/**
 * Ingresos - Versión simplificada usando TransactionManager
 * Mantiene lógica específica: Assets, Cuenta Remunerada, campo bruto
 */
function cargarIngresosForm() {
    // Inicializar TransactionManager para ingresos puntuales, mensuales y cuenta remunerada
    const ingresosManager = new TransactionManager({
        entityName: 'ingresos',
        entityNameSingular: 'ingreso',
        categoryType: 'ingresos',
        endpoints: {
            puntuales: 'ingresos_puntuales',
            mensuales: 'ingresos_mensuales',
            cuentaRemunerada: 'cuenta_remunerada',
            delete: {
                puntual: '/delete/ingreso_puntual',
                mensual: '/delete/ingreso_mensual',
                cuentaRemunerada: '/delete/cuenta_remunerada'
            }
        },
        tables: {
            puntuales: '#tablaIngresosPuntuales tbody',
            mensuales: '#tablaIngresosMensuales tbody',
            cuentaRemunerada: '#tablaCuentaRemunerada tbody'
        },
        selects: {
            puntuales: '#categoriaIngresoPuntual',
            mensuales: '#categoriaIngresoMensual',
            cuentaRemunerada: '#categoriaCuentaRemunerada'
        },
        customColumns: {
            puntual: ['fecha', 'descripcion', 'monto', 'bruto', 'categoria'],
            mensual: ['desde', 'hasta', 'descripcion', 'monto', 'bruto', 'categoria'],
            cuentaRemunerada: ['desde', 'hasta', 'descripcion', 'monto', 'aportacion_mensual', 'interes', 'interes_generado', 'categoria']
        },
        showOldFlag: 'showOldIngresos'
    });

    // Inicializar TransactionManager para ingresos reales
    const ingresosRealesManager = new TransactionManager({
        entityName: 'ingresos_reales',
        entityNameSingular: 'ingreso_real',
        categoryType: 'ingresos',
        endpoints: {
            puntuales: 'ingresos_reales',
            delete: {
                puntual: '/delete/ingreso_real'
            }
        },
        updateEndpoints: {
            puntual: '/update/ingreso_real'
        },
        tables: {
            puntuales: '#tablaIngresosReales tbody'
        },
        selects: {
            puntuales: '#categoriaIngresoReal'
        },
        showOldFlag: 'showOldIngresosReales'
    });

    // Inicializar manager
    ingresosManager.init();
    ingresosRealesManager.init();

    // ===== AGREGAR INGRESO PUNTUAL =====
    document.getElementById('btnAgregarIngresoPuntual').onclick = async () => {
        const fecha = document.getElementById('fechaIngresoPuntual').value;
        const descripcion = document.getElementById('descIngresoPuntual').value;
        const monto = parseFloat(document.getElementById('montoIngresoPuntual').value);
        const bruto = parseFloat(document.getElementById('brutoIngresoPuntual').value) || null;
        const categoria_id = document.getElementById('categoriaIngresoPuntual').value;

        if (!fecha) return showAlert(ingresosManager.t('ingresos.seleccionaFecha', 'Selecciona una fecha'));
        if (!descripcion) return showAlert(ingresosManager.t('ingresos.ingresaDescripcion', 'Ingresa una descripción'));
        if (isNaN(monto) || monto <= 0) return showAlert(ingresosManager.t('ingresos.montoInvalido', 'Monto inválido'));
        if (!categoria_id) return showAlert(ingresosManager.t('ingresos.seleccionaCategoria', 'Selecciona una categoría'));

        await fetch('/add/ingreso_puntual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fecha, descripcion, monto, bruto, categoria_id })
        });

        document.getElementById('fechaIngresoPuntual').value = '';
        document.getElementById('descIngresoPuntual').value = '';
        document.getElementById('montoIngresoPuntual').value = '';
        document.getElementById('brutoIngresoPuntual').value = '';
        
        ingresosManager.loadData();
        if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
    };

    // ===== AGREGAR INGRESO REAL =====
    document.getElementById('btnAgregarIngresoReal').onclick = async () => {
        const fecha = document.getElementById('fechaIngresoReal').value;
        const descripcion = document.getElementById('descIngresoReal').value;
        const monto = parseFloat(document.getElementById('montoIngresoReal').value);
        const categoria_id = document.getElementById('categoriaIngresoReal').value;

        if (!fecha) return showAlert(ingresosManager.t('ingresos.seleccionaFecha', 'Selecciona una fecha'));
        if (!descripcion) return showAlert(ingresosManager.t('ingresos.ingresaDescripcion', 'Ingresa una descripción'));
        if (isNaN(monto) || monto <= 0) return showAlert(ingresosManager.t('ingresos.montoInvalido', 'Monto inválido'));
        if (!categoria_id) return showAlert(ingresosManager.t('ingresos.seleccionaCategoria', 'Selecciona una categoría'));

        await fetch('/add/ingreso_real', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fecha, descripcion, monto, categoria_id, archivo_origen: 'manual' })
        });

        document.getElementById('fechaIngresoReal').value = '';
        document.getElementById('descIngresoReal').value = '';
        document.getElementById('montoIngresoReal').value = '';

        ingresosRealesManager.loadData();
        if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
    };

    // ===== AGREGAR INGRESO MENSUAL =====
    document.getElementById('btnAgregarIngresoMensual').onclick = async () => {
        const desde = document.getElementById('desdeIngresoMensual').value;
        const hasta = document.getElementById('hastaIngresoMensual').value;
        const descripcion = document.getElementById('descIngresoMensual').value;
        const monto = parseFloat(document.getElementById('montoIngresoMensual').value);
        const bruto = parseFloat(document.getElementById('brutoIngresoMensual').value) || null;
        const categoria_id = document.getElementById('categoriaIngresoMensual').value;

        const validarMes = (valor) => /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);

        if (!desde) return showAlert(ingresosManager.t('ingresos.ingresaDesde', "Ingresa el mes 'desde' en formato YYYY-MM"));
        if (!hasta) return showAlert(ingresosManager.t('ingresos.ingresaHasta', "Ingresa el mes 'hasta' en formato YYYY-MM"));
        if (!descripcion) return showAlert(ingresosManager.t('ingresos.ingresaDescripcion', "Ingresa una descripción"));
        if (isNaN(monto) || monto <= 0) return showAlert(ingresosManager.t('ingresos.montoInvalido', "Monto inválido"));
        if (!categoria_id) return showAlert(ingresosManager.t('ingresos.seleccionaCategoria', "Selecciona una categoría"));
        if (!validarMes(desde)) return showAlert(ingresosManager.t('ingresos.formatoDesde', "El campo 'Desde' debe tener formato YYYY-MM"));
        if (!validarMes(hasta)) return showAlert(ingresosManager.t('ingresos.formatoHasta', "El campo 'Hasta' debe tener formato YYYY-MM"));
        if (desde > hasta) return showAlert(ingresosManager.t('ingresos.desdeNoMayorHasta', "El mes 'desde' no puede ser mayor que 'hasta'"));

        await fetch('/add/ingreso_mensual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ desde, hasta, descripcion, monto, bruto, categoria_id })
        });

        document.getElementById('desdeIngresoMensual').value = '';
        document.getElementById('hastaIngresoMensual').value = '';
        document.getElementById('descIngresoMensual').value = '';
        document.getElementById('montoIngresoMensual').value = '';
        document.getElementById('brutoIngresoMensual').value = '';
        
        ingresosManager.loadData();
        if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
    };

    // ===== CUENTA REMUNERADA (Usando TransactionManager) =====
    const btnAgregarCR = document.getElementById('btnAgregarCuentaRemunerada');
    if (btnAgregarCR) {
        btnAgregarCR.onclick = async () => {
            const desde = document.getElementById('desdeCuentaRemunerada').value;
            const hasta = document.getElementById('hastaCuentaRemunerada').value;
            const descripcion = document.getElementById('descCuentaRemunerada').value;
            const monto = parseFloat(document.getElementById('montoCuentaRemunerada').value);
            const aportacion_mensual = parseFloat(document.getElementById('aportacionMensualCR').value) || null;
            const interes = parseFloat(document.getElementById('interesCuentaRemunerada').value) || null;
            const selectCatCR = document.getElementById('categoriaCuentaRemunerada');
            const categoria_id = selectCatCR.value;

            const validarMes = (valor) => /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);

            if (!desde) return showAlert(ingresosManager.t('ingresos.ingresaDesde'));
            if (!hasta) return showAlert(ingresosManager.t('ingresos.ingresaHasta'));
            if (isNaN(monto) || monto <= 0) return showAlert(ingresosManager.t('ingresos.montoInicialInvalido'));
            if (!categoria_id) return showAlert(ingresosManager.t('ingresos.seleccionaCategoria'));
            if (!validarMes(desde)) return showAlert(ingresosManager.t('ingresos.formatoDesde'));
            if (!validarMes(hasta)) return showAlert(ingresosManager.t('ingresos.formatoHasta'));
            if (desde > hasta) return showAlert(ingresosManager.t('ingresos.desdeNoMayorHasta'));

            await fetch('/add/cuenta_remunerada', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ desde, hasta, descripcion, monto, aportacion_mensual, interes, categoria_id })
            });

            document.getElementById('desdeCuentaRemunerada').value = '';
            document.getElementById('hastaCuentaRemunerada').value = '';
            document.getElementById('descCuentaRemunerada').value = '';
            document.getElementById('montoCuentaRemunerada').value = '';
            document.getElementById('aportacionMensualCR').value = '';
            document.getElementById('interesCuentaRemunerada').value = '';
            
            ingresosManager.loadData();
            if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
        };
    }

    // ===== ASSETS (Lógica específica compleja) =====
    const tbodyAssets = document.querySelector('#tablaAssets tbody');

    async function cargarAssets() {
        if (!tbodyAssets) return;
        
        try {
            const res = await fetch('/assets');
            const assets = await res.json();
            
            tbodyAssets.innerHTML = '';
            
            for (const asset of assets) {
                const totalInvestment = asset.shares * asset.purchase_price;
                
                const tr = document.createElement('tr');
                tr.dataset.id = asset.id;
                tr.dataset.type = 'asset';
                tr.innerHTML = `
                    <td class="editable" data-field="company">${asset.company}</td>
                    <td class="editable" data-field="ticker">${asset.ticker}</td>
                    <td class="editable" data-field="shares">${asset.shares}</td>
                    <td class="editable" data-field="purchase_price"><strong>${ingresosManager.formatCurrency(asset.purchase_price)}</strong></td>
                    <td><strong>${ingresosManager.formatCurrency(totalInvestment)}</strong></td>
                    <td class="current-price"><span style="color:#999;">Cargando...</span></td>
                    <td class="current-value">—</td>
                    <td class="diff-percent">—</td>
                    <td class="diff-amount">—</td>
                    <td>
                        <button class="historyAssetBtn btn-info" data-ticker="${asset.ticker}" title="${ingresosManager.t('ingresos.verHistorico', 'Ver histórico')}" style="margin-right:8px;">
                            <i class="fas fa-question-circle"></i>
                        </button>
                        <button class="editAssetBtn btn-editar" title="${ingresosManager.t('formularios.editar')}" style="margin-right:8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-id="${asset.id}" class="sellAsset btn-success" title="${ingresosManager.t('ingresos.sellAsset', 'Vender')}" style="margin-right:8px;">
                            <i class="fas fa-hand-holding-usd"></i>
                        </button>
                        <button data-id="${asset.id}" class="delAsset btn-eliminar" title="${ingresosManager.t('formularios.eliminar')}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbodyAssets.appendChild(tr);
                
                // Obtener precio actual
                try {
                    const currentPrice = await window.getAssetPrice(asset.ticker);
                    if (currentPrice) {
                        const currentValue = asset.shares * currentPrice;
                        const diffAmount = currentValue - totalInvestment;
                        const diffPercent = totalInvestment > 0 ? (diffAmount / totalInvestment) * 100 : 0;
                        
                        const colorDiff = diffAmount >= 0 ? '#22c55e' : '#ef4444';
                        const signDiff = diffAmount >= 0 ? '+' : '';
                        
                        tr.querySelector('.current-price').innerHTML = `<strong>${window.formatCurrency(currentPrice, { convert: true })}</strong>`;
                        tr.querySelector('.current-value').innerHTML = `<strong style="color:${colorDiff}">${window.formatCurrency(currentValue, { convert: true })}</strong>`;
                        tr.querySelector('.diff-percent').innerHTML = `<strong style="color:${colorDiff}">${signDiff}${diffPercent.toFixed(2)}%</strong>`;
                        tr.querySelector('.diff-amount').innerHTML = `<strong style="color:${colorDiff}">${signDiff}${window.formatCurrency(Math.abs(diffAmount), { convert: true })}</strong>`;
                    } else {
                        tr.querySelector('.current-price').innerHTML = '<span style="color:#ef4444;">Error</span>';
                    }
                } catch (e) {
                    console.error(`Error obteniendo precio para ${asset.ticker}:`, e);
                    tr.querySelector('.current-price').innerHTML = '<span style="color:#ef4444;">Error</span>';
                }
            }
            
            // Eliminar assets
            document.querySelectorAll('.delAsset').forEach(b => {
                b.onclick = async () => {
                    const confirmed = await showConfirm(ingresosManager.t('ingresos.eliminarAsset', '¿Eliminar este asset?'));
                    if (!confirmed) return;
                    await fetch('/delete/asset', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: b.dataset.id })
                    });
                    cargarAssets();
                };
            });
            
            // Ver histórico del asset
            document.querySelectorAll('.historyAssetBtn').forEach(b => {
                b.onclick = () => {
                    const ticker = b.dataset.ticker;
                    const tr = b.closest('tr');
                    const company = tr.querySelector('[data-field="company"]').textContent;
                    openHistoryModal(ticker, company);
                };
            });
            
            // Vender assets
            document.querySelectorAll('.sellAsset').forEach(b => {
                b.onclick = async () => {
                    const assetId = b.dataset.id;
                    const asset = assets.find(a => a.id == assetId);
                    if (!asset) return;
                    
                    let currentPrice = 0;
                    try {
                        currentPrice = await window.getAssetPrice(asset.ticker) || asset.purchase_price;
                    } catch (e) {
                        currentPrice = asset.purchase_price;
                    }
                    
                    openSellModal(asset, currentPrice);
                };
            });
            
            // Editar assets
            document.querySelectorAll('.editAssetBtn').forEach(btn => {
                btn.onclick = async () => {
                    const tr = btn.closest('tr');
                    const id = tr.dataset.id;
                    const cells = tr.querySelectorAll('td.editable');
                    const originalData = {};
                    
                    cells.forEach(cell => {
                        const field = cell.dataset.field;
                        originalData[field] = cell.textContent.trim();
                        
                        let input = document.createElement('input');
                        if (field === 'purchase_price') {
                            input.type = 'number';
                            input.step = '0.01';
                            input.value = ingresosManager.parseAmount(originalData[field]);
                            input.style.width = '100px';
                        } else if (field === 'shares') {
                            input.type = 'number';
                            input.step = '0.01';
                            input.value = parseFloat(originalData[field]) || '';
                            input.style.width = '80px';
                        } else {
                            input.type = 'text';
                            input.value = originalData[field];
                            input.style.width = field === 'company' ? '200px' : '100px';
                        }
                        
                        cell.innerHTML = '';
                        if (field === 'purchase_price') {
                            cell.appendChild(document.createTextNode('€ '));
                        }
                        cell.appendChild(input);
                    });
                    
                    const actionsCell = tr.querySelector('td:last-child');
                    actionsCell.innerHTML = `
                        <button class="saveAssetBtn btn-success" style="margin-right:5px;">
                            <i class="fas fa-save"></i>
                        </button>
                        <button class="cancelAssetBtn btn-secondary">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
                    actionsCell.querySelector('.saveAssetBtn').onclick = async () => {
                        const newData = {};
                        cells.forEach(cell => {
                            const field = cell.dataset.field;
                            const input = cell.querySelector('input');
                            newData[field] = input.value;
                        });
                        
                        if (!newData.company) return showAlert(ingresosManager.t('ingresos.companyRequerido'));
                        if (!newData.ticker) return showAlert(ingresosManager.t('ingresos.tickerRequerido'));
                        if (isNaN(parseFloat(newData.shares)) || parseFloat(newData.shares) <= 0) {
                            return showAlert(ingresosManager.t('ingresos.numeroAccionesInvalido'));
                        }
                        if (isNaN(parseFloat(newData.purchase_price)) || parseFloat(newData.purchase_price) <= 0) {
                            return showAlert(ingresosManager.t('ingresos.precioCompraInvalidoAlt'));
                        }
                        
                        await fetch('/update/asset', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: id,
                                company: newData.company,
                                ticker: newData.ticker,
                                shares: parseFloat(newData.shares),
                                purchase_price: parseFloat(newData.purchase_price)
                            })
                        });
                        
                        cargarAssets();
                    };
                    
                    actionsCell.querySelector('.cancelAssetBtn').onclick = () => {
                        cargarAssets();
                    };
                };
            });
            
        } catch (e) {
            console.error('Error cargando assets:', e);
        }
    }

    // Modal de venta de assets
    function openSellModal(asset, currentPrice) {
        const modal = document.getElementById('sellAssetModal');
        const sellPriceInput = document.getElementById('sellPrice');
        
        document.getElementById('sellCompany').textContent = asset.company;
        document.getElementById('sellTicker').textContent = asset.ticker;
        document.getElementById('sellShares').textContent = asset.shares;
        document.getElementById('sellPurchasePrice').textContent = ingresosManager.formatCurrency(asset.purchase_price);
        document.getElementById('sellCurrentPrice').textContent = ingresosManager.formatCurrency(currentPrice);
        
        sellPriceInput.value = currentPrice.toFixed(2);
        updateSellCalculations(asset, currentPrice);
        
        sellPriceInput.oninput = () => {
            const salePrice = parseFloat(sellPriceInput.value) || 0;
            updateSellCalculations(asset, salePrice);
        };
        
        modal.style.display = 'flex';
        
        document.getElementById('cancelSellBtn').onclick = () => {
            modal.style.display = 'none';
        };
        
        document.getElementById('confirmSellBtn').onclick = async () => {
            const salePrice = parseFloat(sellPriceInput.value);
            if (isNaN(salePrice) || salePrice <= 0) {
                showAlert(ingresosManager.t('ingresos.precioVentaInvalido'));
                return;
            }
            
            const confirmarVenta = ingresosManager.t('ingresos.confirmarVenta', 
                `¿Confirmar venta de ${asset.shares} acciones de ${asset.company} a ${ingresosManager.formatCurrency(salePrice)} por acción?`)
                .replace('{shares}', asset.shares)
                .replace('{company}', asset.company)
                .replace('{price}', ingresosManager.formatCurrency(salePrice));
            
            const confirmed = await showConfirm(confirmarVenta);
            if (!confirmed) return;
            
            try {
                const res = await fetch('/sell/asset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: asset.id, sale_price: salePrice })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    showAlert(ingresosManager.t('ingresos.ventaExitosa', 
                        `Venta exitosa. Ganancia registrada: ${ingresosManager.formatCurrency(data.profit)}`)
                        .replace('{profit}', ingresosManager.formatCurrency(data.profit)));
                    modal.style.display = 'none';
                    cargarAssets();
                    ingresosManager.loadData();
                    if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
                } else {
                    const error = await res.json();
                    showAlert(ingresosManager.t('ingresos.errorVenta', `Error: ${error.error}`)
                        .replace('{error}', error.error || 'No se pudo procesar la venta'));
                }
            } catch (e) {
                console.error('Error vendiendo asset:', e);
                showAlert(ingresosManager.t('ingresos.errorProcesarVenta'));
            }
        };
    }
    
    function updateSellCalculations(asset, salePrice) {
        const totalInvested = asset.shares * asset.purchase_price;
        const totalValue = asset.shares * salePrice;
        const profit = totalValue - totalInvested;
        
        document.getElementById('sellTotalInvested').textContent = ingresosManager.formatCurrency(totalInvested);
        document.getElementById('sellTotalValue').textContent = ingresosManager.formatCurrency(totalValue);
        
        const profitSpan = document.getElementById('sellProfit');
        profitSpan.textContent = ingresosManager.formatCurrency(profit);
        profitSpan.style.color = profit >= 0 ? '#28a745' : '#dc3545';
    }

    const btnAgregarAsset = document.getElementById('btnAgregarAsset');
    if (btnAgregarAsset) {
        btnAgregarAsset.onclick = async () => {
            const company = document.getElementById('companyAsset').value;
            const ticker = document.getElementById('tickerAsset').value;
            const shares = parseFloat(document.getElementById('sharesAsset').value);
            const purchase_price = parseFloat(document.getElementById('purchasePriceAsset').value);

            if (!company) return showAlert(ingresosManager.t('ingresos.ingresaNombreCompania'));
            if (!ticker) return showAlert(ingresosManager.t('ingresos.ingresaTicker'));
            if (isNaN(shares) || shares <= 0) return showAlert(ingresosManager.t('ingresos.accionesInvalidas'));
            if (isNaN(purchase_price) || purchase_price <= 0) return showAlert(ingresosManager.t('ingresos.precioCompraInvalido'));

            await fetch('/add/asset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company, ticker, shares, purchase_price })
            });

            document.getElementById('companyAsset').value = '';
            document.getElementById('tickerAsset').value = '';
            document.getElementById('sharesAsset').value = '';
            document.getElementById('purchasePriceAsset').value = '';
            cargarAssets();
        };
    }

    // ===== TOGGLE MOSTRAR ANTIGUOS =====
    window.showOldIngresos = false;
    window.showOldIngresosReales = false;
    
    const toggleBtns = [
        document.getElementById('toggleIngresosAntiguos'),
        document.getElementById('toggleIngresosMensualesAntiguos'),
        document.getElementById('toggleCuentaRemuneradaAntiguos')
    ].filter(Boolean);

    const toggleBtnsReales = [
        document.getElementById('toggleIngresosRealesAntiguos')
    ].filter(Boolean);
    
    if (toggleBtns.length) {
        const updateAll = () => {
            const textoMostrar = ingresosManager.t('ingresos.mostrarAntiguos', 'Mostrar antiguos');
            const textoOcultar = ingresosManager.t('ingresos.ocultarAntiguos', 'Ocultar antiguos');
            toggleBtns.forEach(b => b.textContent = window.showOldIngresos ? textoOcultar : textoMostrar);
        };
        
        toggleBtns.forEach(b => b.addEventListener('click', () => {
            window.showOldIngresos = !window.showOldIngresos;
            updateAll();
            ingresosManager.loadData();
        }));
        
        updateAll();
    }

    if (toggleBtnsReales.length) {
        const updateAllReales = () => {
            const textoMostrar = ingresosRealesManager.t('ingresos.mostrarAntiguos', 'Mostrar antiguos');
            const textoOcultar = ingresosRealesManager.t('ingresos.ocultarAntiguos', 'Ocultar antiguos');
            toggleBtnsReales.forEach(b => b.textContent = window.showOldIngresosReales ? textoOcultar : textoMostrar);
        };
        toggleBtnsReales.forEach(b => b.addEventListener('click', () => {
            window.showOldIngresosReales = !window.showOldIngresosReales;
            updateAllReales();
            ingresosRealesManager.loadData();
        }));
        updateAllReales();
    }

    // ===== SUBPESTAÑAS =====
    const botonesSubtab = document.querySelectorAll('#ingresos .subtab-btn');
    const subtabs = document.querySelectorAll('#ingresos .subtab');

    botonesSubtab.forEach(btn => {
        btn.addEventListener('click', () => {
            botonesSubtab.forEach(b => b.classList.remove('active'));
            subtabs.forEach(st => st.style.display = 'none');
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).style.display = 'block';
        });
    });

    if (botonesSubtab.length > 0) {
        botonesSubtab[0].classList.add('active');
    }

    // Permitir Enter para agregar
    document.getElementById('descIngresoPuntual')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('btnAgregarIngresoPuntual').click();
    });
    document.getElementById('descIngresoMensual')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('btnAgregarIngresoMensual').click();
    });

    // Listener para cambios de idioma
    document.addEventListener('idiomaActualizado', () => {
        if (toggleBtns.length) {
            const textoMostrar = ingresosManager.t('ingresos.mostrarAntiguos', 'Mostrar antiguos');
            const textoOcultar = ingresosManager.t('ingresos.ocultarAntiguos', 'Ocultar antiguos');
            toggleBtns.forEach(b => b.textContent = window.showOldIngresos ? textoOcultar : textoMostrar);
        }
        if (toggleBtnsReales.length) {
            const textoMostrar = ingresosRealesManager.t('ingresos.mostrarAntiguos', 'Mostrar antiguos');
            const textoOcultar = ingresosRealesManager.t('ingresos.ocultarAntiguos', 'Ocultar antiguos');
            toggleBtnsReales.forEach(b => b.textContent = window.showOldIngresosReales ? textoOcultar : textoMostrar);
        }
    });

    // Cargar Assets
    cargarAssets();
}

// ===== MODAL DE HISTÓRICO DE ASSET =====
let assetHistoryChart = null;

/**
 * Abre el modal con el gráfico histórico del ticker
 */
async function openHistoryModal(ticker, company) {
    const modal = document.getElementById('assetHistoryModal');
    const chartCanvas = document.getElementById('assetHistoryChart');
    const loadingDiv = document.getElementById('historyChartLoading');
    const tickerNameSpan = document.getElementById('historyTickerName');
    
    // Mostrar modal
    modal.style.display = 'flex';
    tickerNameSpan.textContent = `${ticker} - ${company}`;
    
    // Cerrar modal
    document.getElementById('closeHistoryBtn').onclick = () => {
        modal.style.display = 'none';
        if (assetHistoryChart) {
            assetHistoryChart.destroy();
            assetHistoryChart = null;
        }
    };
    
    // Click fuera del modal para cerrar
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            if (assetHistoryChart) {
                assetHistoryChart.destroy();
                assetHistoryChart = null;
            }
        }
    };
    
    // Configurar botones de período
    const periodBtns = modal.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.onclick = async () => {
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            await loadHistoricalChart(ticker, btn.dataset.period);
        };
    });
    
    // Resetear botones y activar el primero (1 mes)
    periodBtns.forEach(b => b.classList.remove('active'));
    if (periodBtns.length > 0) {
        periodBtns[0].classList.add('active');
    }
    
    // Cargar datos por defecto (1 mes)
    await loadHistoricalChart(ticker, '1mo');
}

/**
 * Carga y renderiza el gráfico histórico
 */
async function loadHistoricalChart(ticker, period = '1mo') {
    const chartCanvas = document.getElementById('assetHistoryChart');
    const loadingDiv = document.getElementById('historyChartLoading');
    const modal = document.getElementById('assetHistoryModal');
    
    try {
        // Actualizar el botón activo
        const periodBtns = modal.querySelectorAll('.period-btn');
        periodBtns.forEach(btn => {
            if (btn.dataset.period === period) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Mostrar indicador de carga
        chartCanvas.style.display = 'none';
        loadingDiv.style.display = 'block';
        
        // Destruir TODOS los gráficos asociados al canvas
        if (assetHistoryChart) {
            try {
                assetHistoryChart.destroy();
            } catch (e) {
                console.warn('Error destruyendo gráfico global:', e);
            }
            assetHistoryChart = null;
        }
        
        // Método 1: Usar Chart.getChart por ID
        try {
            const existingChart = Chart.getChart('assetHistoryChart');
            if (existingChart) {
                existingChart.destroy();
            }
        } catch (e) {
            console.warn('Error con Chart.getChart:', e);
        }
        
        // Método 2: Usar Chart.getChart por elemento canvas
        try {
            const existingChart2 = Chart.getChart(chartCanvas);
            if (existingChart2) {
                existingChart2.destroy();
            }
        } catch (e) {
            console.warn('Error con Chart.getChart(canvas):', e);
        }
        
        // Método 3: Forzar limpieza recreando el canvas
        const parent = chartCanvas.parentNode;
        const newCanvas = chartCanvas.cloneNode(true);
        parent.replaceChild(newCanvas, chartCanvas);
        const finalCanvas = document.getElementById('assetHistoryChart');
        
        // Obtener datos históricos
        const response = await fetch(`/asset-history/${ticker}?period=${period}`);
        if (!response.ok) {
            throw new Error('No se pudieron obtener los datos');
        }
        
        const result = await response.json();
        const data = result.data;
        
        if (!data || data.length === 0) {
            throw new Error('No hay datos disponibles para este período');
        }
        
        // Preparar datos para el gráfico
        const labels = data.map(item => item.date);
        const prices = data.map(item => item.price);
        
        // Calcular estadísticas
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const priceRange = maxPrice - minPrice;
        
        // Detectar si los datos son muy planos (variación < 0.5%)
        const variation = (priceRange / avgPrice) * 100;
        const isFlat = variation < 0.5;
        
        // Color basado en la tendencia
        const color = lastPrice >= firstPrice ? '#22c55e' : '#ef4444';
        
        // Ocultar loading y mostrar canvas
        loadingDiv.style.display = 'none';
        finalCanvas.style.display = 'block';
        
        // Configurar escala Y - ajustar para datos planos
        let yAxisConfig = {
            display: true,
            title: {
                display: true,
                text: 'Precio (€)'
            },
            ticks: {
                callback: function(value) {
                    return '€' + value.toFixed(2);
                }
            }
        };
        
        // Si los datos son muy planos, ajustar la escala para mejor visualización
        if (isFlat && priceRange > 0) {
            const padding = priceRange * 2; // Añadir padding
            yAxisConfig.min = minPrice - padding;
            yAxisConfig.max = maxPrice + padding;
        }
        
        // Crear gráfico en el nuevo canvas
        const ctx = finalCanvas.getContext('2d');
        assetHistoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Precio (€) ${isFlat ? '⚠️' : ''}`,
                    data: prices,
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: data.length > 100 ? 0 : 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Precio: €${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Fecha'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            maxTicksLimit: 12
                        }
                    },
                    y: yAxisConfig
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
        
    } catch (error) {
        console.error('Error cargando gráfico histórico:', error);
        loadingDiv.innerHTML = `
            <i class="fas fa-exclamation-circle" style="font-size: 24px; color: #ef4444;"></i>
            <p style="margin-top: 10px; color: #ef4444;">Error al cargar los datos: ${error.message}</p>
        `;
        loadingDiv.style.display = 'block';
        chartCanvas.style.display = 'none';
    }
}
