// ===== MANEJO DE PERÍODOS Y RESUMEN =====
let periodoActual = '1mes';
let resumenData = null;
let cargandoResumen = false;

function isCuentaRemuneradaActiva(cr, mesActual) {
    if (!cr || !cr.desde || !cr.hasta) return false;
    return cr.desde <= mesActual && mesActual <= cr.hasta;
}

function calcularSaldoCuentaRemunerada(cr, mesActual) {
    const monto = parseFloat(cr.monto) || 0;
    const aportacion = parseFloat(cr.aportacion_mensual) || 0;
    const interes = parseFloat(cr.interes) || 0;
    const retencion = parseFloat(cr.retencion) || 0;
    if (!cr.desde || !mesActual) return monto;

    const [desdeY, desdeM] = cr.desde.split('-').map(Number);
    const [actualY, actualM] = mesActual.split('-').map(Number);

    const desdeDate = new Date(desdeY, desdeM - 1, 1);
    const actualMonthDate = new Date(actualY, actualM - 1, 1);
    const mesInteresDate = new Date(actualY, actualM - 2, 1); // interés hasta fin del mes anterior

    const monthsDiff =
        (actualMonthDate.getFullYear() - desdeDate.getFullYear()) * 12 +
        (actualMonthDate.getMonth() - desdeDate.getMonth());

    const aportacionesAcumuladas = Math.max(0, monthsDiff) * aportacion;

    let totalInteres = 0;
    if (interes > 0 && mesInteresDate >= desdeDate) {
        let saldoInteres = monto;
        const current = new Date(desdeDate);

        totalInteres += saldoInteres * (interes / 100) / 12;
        current.setMonth(current.getMonth() + 1);

        while (current <= mesInteresDate) {
            saldoInteres += aportacion;
            totalInteres += saldoInteres * (interes / 100) / 12;
            current.setMonth(current.getMonth() + 1);
        }
    }

    // Aplicar retención: solo se recibe el interés neto
    const interesNeto = totalInteres * (1 - retencion / 100);
    return monto + aportacionesAcumuladas + interesNeto;
}

async function cargarResumenPeriodos() {
    if (switchingUser || !activeUser) return;
    if (cargandoResumen) return; // Evitar solicitudes múltiples simultáneas
    cargandoResumen = true;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // timeout de 10 segundos

        const res = await fetch('/resumen-periodos', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        resumenData = await res.json();
        
            async function actualizarResumen(periodo) {
            const stats = await getStatsForPeriodo(periodo);
            if (!stats) {
                console.warn(`⚠️ Datos no disponibles para período: ${periodo}`);
                return;
            }

            const ingresos = document.getElementById('total-ingresos');
            const gastos = document.getElementById('total-gastos');
            const saldo = document.getElementById('saldo');
            const taxes = document.getElementById('total-taxes');
                const hucha = document.getElementById('total-hucha');

            if (ingresos) ingresos.textContent = formatearEuro(stats.ingresos);
            if (gastos) gastos.textContent = formatearEuro(stats.gastos);
            if (saldo) saldo.textContent = formatearEuro(stats.ahorro);
            if (taxes) taxes.textContent = formatearEuro(stats.impuestos || 0);

            // Etiqueta de período en las notas (los deltas se añaden luego en renderInicioDeltas)
            const periodLabel = getPeriodLabel(periodo);
            ['inicio-note-saldo', 'inicio-note-ingresos', 'inicio-note-gastos', 'inicio-note-taxes'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = periodLabel;
            });

                // Obtener total hucha
                if (hucha) {
                    try {
                        const [resHucha, resCR, resAssets, resSubHuchas, resSubHuchasPunt] = await Promise.all([
                            fetch('/hucha'),
                            fetch('/cuenta_remunerada'),
                            fetch('/assets'),
                            fetch('/sub_huchas'),
                            fetch(`/sub_huchas/total?mes=${getReferenceMonthForPeriod(periodo)}`)
                        ]);

                        const dataHucha = resHucha.ok ? await resHucha.json() : [];
                        const dataCR = resCR.ok ? await resCR.json() : [];
                        const dataAssets = resAssets.ok ? await resAssets.json() : [];
                        const subHuchasList = resSubHuchas.ok ? await resSubHuchas.json() : [];
                        const subHuchasTotalData = resSubHuchasPunt.ok ? await resSubHuchasPunt.json() : { total: 0 };

                        const totalHuchaManual = dataHucha.reduce((acc, item) => acc + (parseFloat(item.cantidad) || 0), 0);

                        const mesReferencia = getReferenceMonthForPeriod(periodo);
                        const totalCR = dataCR
                            .filter(cr => isCuentaRemuneradaActiva(cr, mesReferencia))
                            .reduce((acc, cr) => acc + calcularSaldoCuentaRemunerada(cr, mesReferencia), 0);

                        let totalAssets = 0;
                        for (const asset of dataAssets) {
                            try {
                                const shares = Number(asset.shares) || 0;
                                const fallbackPrice = Number(asset.purchase_price) || 0;
                                const currentPrice = await window.getAssetPrice(asset.ticker);
                                const appliedPrice = Number.isFinite(currentPrice) ? currentPrice : fallbackPrice;
                                totalAssets += shares * appliedPrice;
                            } catch (e) {
                                console.error(`Error obteniendo precio para ${asset.ticker}:`, e);
                            }
                        }

                        hucha.textContent = formatearEuro(totalHuchaManual + totalCR + totalAssets);

                        // Sub-huchas: mostrar cada una con nombre y saldo
                        const subHuchasListEl = document.getElementById('sub-huchas-list');
                        if (subHuchasListEl) {
                            subHuchasListEl.innerHTML = '';
                            if (subHuchasList.length > 0) {
                                const mesRef = getReferenceMonthForPeriod(periodo);
                                // Fetch puntuales per sub-hucha to calc individual balances
                                const puntualsByHucha = {};
                                await Promise.all(subHuchasList.map(async (sh) => {
                                    try {
                                        const r = await fetch(`/sub_huchas/${sh.id}/puntuales`);
                                        puntualsByHucha[sh.id] = r.ok ? await r.json() : [];
                                    } catch { puntualsByHucha[sh.id] = []; }
                                }));
                                for (const sh of subHuchasList) {
                                    const inicial = Number(sh.aportacion_inicial) || 0;
                                    const mensual = Number(sh.aportacion_mensual) || 0;
                                    const [dY, dM] = sh.desde.split('-').map(Number);
                                    const [hY, hM] = sh.hasta.split('-').map(Number);
                                    const [rY, rM] = mesRef.split('-').map(Number);
                                    const desdeD = new Date(dY, dM - 1);
                                    const hastaD = new Date(hY, hM - 1);
                                    const refD = new Date(rY, rM - 1);
                                    let saldo = 0;
                                    if (refD >= desdeD) {
                                        const limD = refD < hastaD ? refD : hastaD;
                                        const meses = Math.max(0, (limD.getFullYear() - desdeD.getFullYear()) * 12 + (limD.getMonth() - desdeD.getMonth()));
                                        const punts = (puntualsByHucha[sh.id] || []).filter(p => p.fecha.substring(0, 7) <= mesRef);
                                        const totalPunt = punts.reduce((a, p) => a + (Number(p.monto) || 0), 0);
                                        saldo = inicial + meses * mensual + totalPunt;
                                    }
                                    const row = document.createElement('div');
                                    row.className = 'inicio-sub-hucha-row';
                                    row.innerHTML = `<span class="inicio-sub-hucha-name">${sh.nombre}</span><span class="inicio-sub-hucha-amount">${formatearEuro(saldo)}</span>`;
                                    subHuchasListEl.appendChild(row);
                                }
                            }
                        }
                    } catch {
                        hucha.textContent = formatearEuro(0);
                        const subHuchasListEl = document.getElementById('sub-huchas-list');
                        if (subHuchasListEl) subHuchasListEl.innerHTML = '';
                    }
                }
                
                // Calcular rendimiento del portfolio (con caché de 20 minutos)
                const portfolio = document.getElementById('portfolio-rendimiento');
                const portfolioTotalValue = document.getElementById('portfolio-valor-total');
                if (portfolio) {
                    const portfolioTotalLabel = (typeof gestorIdiomas !== 'undefined')
                        ? gestorIdiomas.obtenerTexto('resumen.portfolioValorTotal')
                        : 'Valor total';

                    const updatePortfolioCard = (textContent, color = '', totalValue = 0) => {
                        portfolio.textContent = textContent;
                        portfolio.style.color = color;
                        if (portfolioTotalValue) {
                            portfolioTotalValue.textContent = `${portfolioTotalLabel}: ${formatearEuro(totalValue)}`;
                        }
                    };

                    const now = Date.now();
                    const portfolioCacheKey = `${activeUser || 'anon'}:${periodo}`;
                    if (portfolioResultCache && portfolioResultCache.key === portfolioCacheKey && (now - portfolioResultCache.timestamp) < PORTFOLIO_CACHE_TTL) {
                        updatePortfolioCard(
                            portfolioResultCache.textContent,
                            portfolioResultCache.color,
                            Number(portfolioResultCache.totalValue) || 0
                        );
                    } else {
                        try {
                            const resAssets = await fetch('/assets');
                            if (resAssets.ok) {
                                const assets = await resAssets.json();

                                if (assets.length === 0) {
                                    portfolioResultCache = { key: portfolioCacheKey, textContent: '€0 (0%)', color: '', totalValue: 0, timestamp: now };
                                    updatePortfolioCard('€0 (0%)', '', 0);
                                } else {
                                    let totalInvested = 0;
                                    let currentValue = 0;

                                    for (const asset of assets) {
                                        const shares = Number(asset.shares) || 0;
                                        const purchasePrice = Number(asset.purchase_price) || 0;
                                        const invested = shares * purchasePrice;
                                        totalInvested += invested;
                                        try {
                                            const currentPrice = await window.getAssetPrice(asset.ticker);
                                            const appliedPrice = Number.isFinite(currentPrice) ? currentPrice : purchasePrice;
                                            currentValue += shares * appliedPrice;
                                        } catch (e) {
                                            currentValue += invested;
                                        }
                                    }

                                    const profit = currentValue - totalInvested;
                                    const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
                                    const sign = profit >= 0 ? '+' : '';
                                    const textContent = `${sign}${formatearEuro(profit)} (${sign}${profitPercent.toFixed(2)}%)`;
                                    const color = profit >= 0 ? 'var(--success)' : 'var(--danger)';

                                    portfolioResultCache = { key: portfolioCacheKey, textContent, color, totalValue: currentValue, timestamp: now };
                                    updatePortfolioCard(textContent, color, currentValue);
                                }
                            } else {
                                updatePortfolioCard('€0 (0%)', '', 0);
                            }
                        } catch (e) {
                            console.error('Error calculando rendimiento del portfolio:', e);
                            updatePortfolioCard('€0 (0%)', '', 0);
                        }
                    }
                }
        }
        
        // Botones de período (solo agregar listeners si no existen)
        const btnsPeriodo = document.querySelectorAll('.btn-periodo');
        if (btnsPeriodo.length > 0 && !btnsPeriodo[0].dataset.listenerAdded) {
            btnsPeriodo.forEach(btn => {
                btn.addEventListener('click', () => {
                    btnsPeriodo.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    periodoActual = btn.dataset.periodo;
                    actualizarResumen(periodoActual);
                    renderInicioInsights();
                    console.log(`📊 Período actualizado a: ${periodoActual}`);
                });
                btn.dataset.listenerAdded = 'true';
            });
        }

        // Sincronizar estado visual del botón activo con el período persistido
        if (btnsPeriodo.length > 0) {
            let btnActivo = document.querySelector(`.btn-periodo[data-periodo="${periodoActual}"]`);
            if (!btnActivo) {
                btnActivo = btnsPeriodo[0];
                periodoActual = btnActivo.dataset.periodo || '1mes';
            }
            btnsPeriodo.forEach(b => b.classList.remove('active'));
            btnActivo.classList.add('active');
        }

        // Botón de refresh
        const btnRefresh = document.getElementById('btn-refresh-resumen');
        if (btnRefresh && !btnRefresh.dataset.listenerAdded) {
            btnRefresh.addEventListener('click', async () => {
                btnRefresh.classList.add('spinning');
                portfolioResultCache = null; // invalidar caché al refrescar manualmente
                const periodoGuardado = periodoActual;
                await cargarResumenPeriodos();
                // Asegurar que el botón activo y el período actual coincidan
                const btnActivo = document.querySelector(`[data-periodo="${periodoGuardado}"]`);
                if (btnActivo) {
                    document.querySelectorAll('.btn-periodo').forEach(b => b.classList.remove('active'));
                    btnActivo.classList.add('active');
                    periodoActual = periodoGuardado;
                    actualizarResumen(periodoGuardado);
                } else {
                    // Si no encuentra el botón, actualiza con el período actual guardado
                    actualizarResumen(periodoGuardado);
                }
                renderInicioInsights();
                setTimeout(() => btnRefresh.classList.remove('spinning'), 600);
            });
            btnRefresh.dataset.listenerAdded = 'true';
        }

        // Cargar con el período sincronizado
        actualizarResumen(periodoActual);
        renderInicioInsights();
        console.log('✅ Resumen de períodos cargado con período:', periodoActual);

    } catch (error) {

        console.error('❌ Error cargando resumen de períodos:', error);
        // Mostrar valores por defecto si hay error
        const ingresos = document.getElementById('total-ingresos');
        const gastos = document.getElementById('total-gastos');
        const saldo = document.getElementById('saldo');
        const taxes = document.getElementById('total-taxes');
        const hucha = document.getElementById('total-hucha');

        if (typeof formatearEuro !== 'function') {
            window.formatearEuro = function(monto) {
                if (monto === null || monto === undefined) return '€0,00';
                return '€' + parseFloat(monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };
        }
        if (ingresos) ingresos.textContent = formatearEuro(0);
        if (gastos) gastos.textContent = formatearEuro(0);
        if (saldo) saldo.textContent = formatearEuro(0);
        if (taxes) taxes.textContent = formatearEuro(0);
        if (hucha) hucha.textContent = formatearEuro(0);
        const subHuchasListErr = document.getElementById('sub-huchas-list');
        if (subHuchasListErr) subHuchasListErr.innerHTML = '';

        // Reintentar en 5 segundos
        setTimeout(() => {
            cargandoResumen = false;
            cargarResumenPeriodos();
        }, 5000);
    } finally {
        cargandoResumen = false;
    }
}

// Recargar resumen cada 5 minutos automáticamente
setInterval(() => {
    if (!cargandoResumen && document.getElementById('total-ingresos')) {
        cargarResumenPeriodos();
    }
}, 5 * 60 * 1000);

