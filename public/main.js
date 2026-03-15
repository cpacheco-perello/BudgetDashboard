// ===== MANEJO DE PESTAÑAS =====
const buttons = document.querySelectorAll('.tablink');
const tabContent = document.getElementById('tab-content');

// Guardar posición de scroll por pestaña
const scrollPositions = {};

// ===== USUARIOS =====
let activeUser = null;
let switchingUser = false;
const DEFAULT_USER_ICON = 'fa-user';
const USER_ICON_OPTIONS = [
    { value: 'fa-user', label: 'User' },
    { value: 'fa-user-tie', label: 'Executive' },
    { value: 'fa-user-astronaut', label: 'Astronaut' },
    { value: 'fa-user-ninja', label: 'Ninja' },
    { value: 'fa-user-secret', label: 'Secret' },
    { value: 'fa-user-graduate', label: 'Graduate' },
    { value: 'fa-user-gear', label: 'Gear' },
    { value: 'fa-user-shield', label: 'Shield' },
    { value: 'fa-user-clock', label: 'Clock' }
];

function setUserLabel(name) {
    const label = document.getElementById('currentUserLabel');
    if (label) {
        if (name) {
            label.textContent = name;
        } else if (typeof gestorIdiomas !== 'undefined') {
            label.textContent = gestorIdiomas.obtenerTexto('usuarios.sinUsuario');
        } else {
            label.textContent = 'Sin usuario';
        }
    }
}

function updateUserIconUI(iconClass) {
    const icon = iconClass || DEFAULT_USER_ICON;
    const button = document.getElementById('changeUserBtn');
    const preview = document.getElementById('userIconPreview');

    if (button) button.innerHTML = `<i class="fas ${icon}"></i>`;
    if (preview) preview.innerHTML = `<i class="fas ${icon}"></i>`;
}

function fillUserIconSelect(select) {
    if (!select) return;
    select.innerHTML = '';
    USER_ICON_OPTIONS.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        select.appendChild(opt);
    });
}

async function loadUserIcon(name) {
    if (!name || !window.electronAPI?.getUserProfile) {
        updateUserIconUI(DEFAULT_USER_ICON);
        return DEFAULT_USER_ICON;
    }
    try {
        const result = await window.electronAPI.getUserProfile({ name });
        const icon = result?.profile?.icon || DEFAULT_USER_ICON;
        const select = document.getElementById('userIconSelect');
        if (select) select.value = icon;
        updateUserIconUI(icon);
        return icon;
    } catch (err) {
        updateUserIconUI(DEFAULT_USER_ICON);
        return DEFAULT_USER_ICON;
    }
}

function toggleUserOverlay(show) {
    const overlay = document.getElementById('userOverlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
    }
}

function showUserError(message) {
    if (typeof showAlert === 'function') {
        showAlert(message);
        return;
    }
    // eslint-disable-next-line no-alert
    alert(message);
}

function resetUserScopedState() {
    Object.keys(scrollPositions).forEach(key => delete scrollPositions[key]);
    if (window.estadoImportacion) {
        window.estadoImportacion = {
            archivoActual: null,
            nombreArchivoOrigen: null,
            datosRaw: [],
            datosMapados: [],
            columnas: [],
            mapeo: { fecha: null, concepto: null, importe: null, tipo: null },
            formatoFecha: 'DD/MM/YYYY',
            charts: {},
            archivoNuevo: true,
            archivoId: null,
            conceptosSeleccionados: []
        };
    }
    resumenData = null;
    cargandoResumen = false;
    portfolioResultCache = null;
    Object.keys(assetPriceCache).forEach((ticker) => delete assetPriceCache[ticker]);
}

async function refreshUserList() {
    const select = document.getElementById('userSelect');
    if (!select || !window.electronAPI?.listUsers) return { users: [], currentUser: null };

    const result = await window.electronAPI.listUsers();
    const users = result?.users || [];
    const currentUser = result?.currentUser || null;

    select.innerHTML = '';
    users.forEach(user => {
        const opt = document.createElement('option');
        opt.value = user;
        opt.textContent = user;
        select.appendChild(opt);
    });

    return { users, currentUser };
}

async function applyUserSelection(name, { auto = false } = {}) {
    if (!name || !window.electronAPI?.setCurrentUser) return;
    if (name === activeUser) {
        if (!auto) toggleUserOverlay(false);
        return;
    }

    try {
        switchingUser = true;
        await window.electronAPI.setCurrentUser({ name });
        activeUser = name;
        localStorage.setItem('currentUser', name);
        setUserLabel(name);
        await loadUserIcon(name);
        toggleUserOverlay(false);
        resetUserScopedState();

        await ensureFxRates(BASE_CURRENCY);
        switchingUser = false;
        await loadTab('inicio');
    } catch (err) {
        showUserError(err.message || 'No se pudo seleccionar el usuario');
        toggleUserOverlay(true);
    } finally {
        switchingUser = false;
    }
}

async function initUserSelection() {
    if (!window.electronAPI?.listUsers) {
        loadTab('inicio');
        return;
    }

    const changeBtn = document.getElementById('changeUserBtn');
    const selectBtn = document.getElementById('userSelectBtn');
    const createBtn = document.getElementById('userCreateBtn');
    const refreshBtn = document.getElementById('userRefreshBtn');
    const newUserInput = document.getElementById('newUserName');
    const select = document.getElementById('userSelect');
    const iconSelect = document.getElementById('userIconSelect');

    fillUserIconSelect(iconSelect);
    if (iconSelect) iconSelect.value = DEFAULT_USER_ICON;
    updateUserIconUI(DEFAULT_USER_ICON);

    if (changeBtn) {
        changeBtn.addEventListener('click', () => toggleUserOverlay(true));
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await refreshUserList();
        });
    }

    if (select) {
        select.addEventListener('change', async () => {
            const selected = select.value;
            if (selected) await loadUserIcon(selected);
        });
    }

    if (iconSelect) {
        iconSelect.addEventListener('change', async () => {
            const icon = iconSelect.value || DEFAULT_USER_ICON;
            const targetUser = select?.value || activeUser;
            if (!targetUser || !window.electronAPI?.setUserIcon) {
                updateUserIconUI(icon);
                return;
            }
            try {
                await window.electronAPI.setUserIcon({ name: targetUser, icon });
                updateUserIconUI(icon);
            } catch (err) {
                showUserError(err.message || 'No se pudo guardar el icono');
            }
        });
    }

    if (selectBtn) {
        selectBtn.addEventListener('click', async () => {
            const selected = select?.value;
            if (!selected) return;
            await applyUserSelection(selected);
        });
    }

    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            const name = (newUserInput?.value || '').trim();
            if (!name) return;

            try {
                await window.electronAPI.createUser({ name });
                const icon = iconSelect?.value || DEFAULT_USER_ICON;
                if (window.electronAPI?.setUserIcon) {
                    await window.electronAPI.setUserIcon({ name, icon });
                }
                newUserInput.value = '';
                await refreshUserList();
                await applyUserSelection(name);
            } catch (err) {
                showUserError(err.message || 'No se pudo crear el usuario');
            }
        });
    }

    const { users, currentUser } = await refreshUserList();
    const storedUser = localStorage.getItem('currentUser');
    const preferredUser = currentUser || (users.includes(storedUser) ? storedUser : null);

    if (preferredUser) {
        if (select) select.value = preferredUser;
        setUserLabel(preferredUser);
        await loadUserIcon(preferredUser);
        await applyUserSelection(preferredUser, { auto: true });
    } else {
        toggleUserOverlay(true);
    }
}

// ===== CACHE DE PRECIOS DE ACTIVOS =====
const assetPriceCache = {};
const ASSET_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function getAssetPrice(ticker) {
    const now = Date.now();
    if (assetPriceCache[ticker] && (now - assetPriceCache[ticker].timestamp) < ASSET_CACHE_DURATION) {
        return assetPriceCache[ticker].price;
    }
    
    try {
        const res = await fetch(`/asset-price/${ticker}`);
        if (res.ok) {
            const data = await res.json();
            assetPriceCache[ticker] = {
                price: data.currentPrice,
                timestamp: now
            };
            return data.currentPrice;
        }
    } catch (e) {
        console.error(`Error obteniendo precio para ${ticker}:`, e);
    }
    return null;
}

// ===== CONFIGURACIÓN DE MONEDA (extensible a futuro) =====
const BASE_CURRENCY = 'EUR';
const currencyOptions = {
    EUR: { code: 'EUR', symbol: '€', locale: 'es-ES' },
    USD: { code: 'USD', symbol: '$', locale: 'en-US' }
};

let currentCurrency = localStorage.getItem('currency') || 'EUR';
let fxState = {
    base: BASE_CURRENCY,
    rates: { [BASE_CURRENCY]: 1 },
    lastUpdated: 0
};

async function ensureFxRates(base = BASE_CURRENCY) {
    const ONE_HOUR = 60 * 60 * 1000;
    if (fxState.base === base && Date.now() - fxState.lastUpdated < ONE_HOUR && fxState.rates) {
        return fxState.rates;
    }
    try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
        const data = await res.json();
        if (data && data.rates) {
            fxState = { base, rates: data.rates, lastUpdated: Date.now() };
            return fxState.rates;
        }
    } catch (err) {
        console.warn('⚠️ No se pudieron obtener tasas FX, usando caché previa', err.message);
    }
    return fxState.rates;
}

function convertAmount(amount) {
    const numeric = parseFloat(amount || 0);
    if (!isFinite(numeric)) return 0;
    const rate = fxState.rates?.[currentCurrency] || 1;
    return numeric * rate;
}

function formatCurrency(amount, { convert = false } = {}) {
    const cfg = currencyOptions[currentCurrency] || currencyOptions[BASE_CURRENCY];
    const baseValue = parseFloat(amount || 0);
    const value = convert ? convertAmount(baseValue) : baseValue;
    try {
        return new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: cfg.code }).format(isFinite(value) ? value : 0);
    } catch (_) {
        // Fallback simple en caso de fallo de Intl
        return `${cfg.symbol}${(isFinite(value) ? value : 0).toFixed(2)}`;
    }
}

window.formatCurrency = formatCurrency;
window.getSelectedCurrency = () => currentCurrency;
window.convertAmount = convertAmount;

async function setCurrency(code, { silent = false } = {}) {
    if (!currencyOptions[code]) return;
    currentCurrency = code;
    localStorage.setItem('currency', code);
    await ensureFxRates(BASE_CURRENCY);
    if (!silent) {
        await cargarResumenPeriodos();
        const tabActiva = document.querySelector('.tablink.active');
        if (tabActiva) {
            loadTab(tabActiva.dataset.tab);
        }
    }
    console.log(`💱 Moneda activa: ${code}`);
}

let inicioEvolucionChart = null;

// ===== CACHE DE PORTFOLIO =====
const PORTFOLIO_CACHE_TTL = 20 * 60 * 1000; // 20 minutos
let portfolioResultCache = null;

function getPeriodLabel(periodo) {
    const labels = {
        '1mes': { key: 'periodos.label_mes_actual', fallback: 'Mes actual' },
        '3meses': { key: 'periodos.label_ultimos_3_meses', fallback: 'Últimos 3 meses' },
        '6meses': { key: 'periodos.label_ultimos_6_meses', fallback: 'Últimos 6 meses' },
        '1año': { key: 'periodos.label_ultimos_12_meses', fallback: 'Últimos 12 meses' },
        '5años': { key: 'periodos.label_ultimos_5_anios', fallback: 'Últimos 5 años' },
        '10años': { key: 'periodos.label_ultimos_10_anios', fallback: 'Últimos 10 años' },
        'proximo1mes': { key: 'periodos.label_proximo_mes', fallback: 'Próximo mes' },
        'proximos3meses': { key: 'periodos.label_proximos_3_meses', fallback: 'Próximos 3 meses' },
        'proximos6meses': { key: 'periodos.label_proximos_6_meses', fallback: 'Próximos 6 meses' }
    };
    const selected = labels[periodo] || { key: 'periodos.label_periodo_seleccionado', fallback: 'Período seleccionado' };
    if (typeof gestorIdiomas !== 'undefined') {
        return gestorIdiomas.obtenerTexto(selected.key);
    }
    return selected.fallback;
}

function getMonthCountForPeriod(periodo) {
    const monthsByPeriod = {
        '1mes': 1,
        '3meses': 3,
        '6meses': 6,
        '1año': 12,
        '5años': 60,
        '10años': 120,
        'proximo1mes': 1,
        'proximos3meses': 3,
        'proximos6meses': 6
    };
    return monthsByPeriod[periodo] || 1;
}

function clipPeriodMonths(data, monthCount) {
    return (Array.isArray(data) ? data : [])
        .filter((m) => m && m.mes)
        .sort((a, b) => String(a.mes).localeCompare(String(b.mes)))
        .slice(-monthCount);
}

function getInicioDateRange(periodo) {
    const now = new Date();
    const monthCount = getMonthCountForPeriod(periodo);
    const isFuture = ['proximo1mes', 'proximos3meses', 'proximos6meses'].includes(periodo);

    // Período actual o futuro en meses completos
    const desdeDate = isFuture
        ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
        : new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);
    const hastaDate = isFuture
        ? new Date(now.getFullYear(), now.getMonth() + monthCount + 1, 0)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Formato local YYYY-MM-DD para evitar desfases por zona horaria de toISOString()
    const toISODate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Período anterior: misma cantidad de meses completos
    const prevHastaDate = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 0);
    const prevDesdeDate = new Date(desdeDate.getFullYear(), desdeDate.getMonth() - monthCount, 1);

    return {
        desde: toISODate(desdeDate),
        hasta: toISODate(hastaDate),
        prevDesde: toISODate(prevDesdeDate),
        prevHasta: toISODate(prevHastaDate)
    };
}

function getReferenceMonthForPeriod(periodo) {
    const { hasta } = getInicioDateRange(periodo);
    return String(hasta || '').slice(0, 7);
}

async function getStatsForPeriodo(periodo) {
    if (resumenData && resumenData[periodo]) {
        return resumenData[periodo];
    }

    const { desde, hasta } = getInicioDateRange(periodo);
    const res = await fetch(`/ahorros-mes?desde=${desde}&hasta=${hasta}`);
    if (!res.ok) return null;

    const rows = await res.json();
    const sumField = (arr, field) => (Array.isArray(arr) ? arr : []).reduce((acc, item) => acc + (Number(item?.[field]) || 0), 0);

    const ingresos = sumField(rows, 'ingresos') + sumField(rows, 'impuestos_ingresos') + sumField(rows, 'cuentas_remuneradas');
    const gastos = sumField(rows, 'gastos');
    const ahorro = sumField(rows, 'ahorros');
    const impuestos = sumField(rows, 'impuestos_otros') + sumField(rows, 'impuestos_ingresos');

    return { ingresos, gastos, ahorro, impuestos };
}

function renderInicioCategorias(gastosPorCategoria = {}) {
    const container = document.getElementById('inicioCategoriasList');
    if (!container) return;

    const entries = Object.entries(gastosPorCategoria)
        .map(([categoria, total]) => ({ categoria, total: Number(total) || 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

    const total = entries.reduce((acc, item) => acc + item.total, 0);
    if (entries.length === 0 || total <= 0) {
        const emptyText = typeof gestorIdiomas !== 'undefined'
            ? gestorIdiomas.obtenerTexto('inicio.sinDatosPeriodo')
            : 'Sin datos para este período';
        container.innerHTML = `<p class="inicio-empty">${emptyText}</p>`;
        return;
    }

    const palette = ['#4f8ef7', '#3fcf77', '#f472b6', '#fbbf24', '#a78bfa', '#9ca3af'];
    container.innerHTML = entries.map((item, idx) => {
        const percentage = (item.total / total) * 100;
        return `
            <div class="inicio-categoria-row">
                <span class="inicio-categoria-name">${item.categoria}</span>
                <div class="inicio-categoria-bar-wrap">
                    <div class="inicio-categoria-bar" style="width:${Math.max(4, percentage)}%; background:${palette[idx % palette.length]};"></div>
                </div>
                <span class="inicio-categoria-pct">${percentage.toFixed(0)}%</span>
            </div>
        `;
    }).join('');
}

function renderInicioEvolucion(ahorrosMes = [], ahorrosPrev = []) {
    const canvas = document.getElementById('inicioEvolucionChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const css = getComputedStyle(document.documentElement);
    const successColor = (css.getPropertyValue('--success') || '#22c55e').trim();
    const dangerColor = (css.getPropertyValue('--danger') || '#ef4444').trim();
    const primaryColor = (css.getPropertyValue('--primary') || '#3b82f6').trim();
    const textColor = (css.getPropertyValue('--text-secondary') || '#4b5563').trim();
    const borderLight = (css.getPropertyValue('--border-light') || '#e5e7eb').trim();

    const hexToRgba = (hex, alpha) => {
        const clean = String(hex || '').replace('#', '').trim();
        if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
            return `rgba(59,130,246,${alpha})`;
        }
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const monthCount = getMonthCountForPeriod(periodoActual);

    const formatMesLabel = (mes) => {
        if (!mes || typeof mes !== 'string') return '';
        const [year, month] = mes.split('-');
        return `${month}/${String(year).slice(2)}`;
    };

    // Incluir período actual + período de comparación (anterior equivalente)
    const currentClipped = clipPeriodMonths(ahorrosMes, monthCount);
    const prevClipped = clipPeriodMonths(ahorrosPrev, monthCount);
    const puntos = [...prevClipped, ...currentClipped]
        .sort((a, b) => String(a.mes).localeCompare(String(b.mes)))
        .slice(-(monthCount * 2));

    const labels = puntos.map((m) => formatMesLabel(m.mes));
    const ingresos = puntos.map((m) => (Number(m.ingresos) || 0) + (Number(m.impuestos_ingresos) || 0) + (Number(m.cuentas_remuneradas) || 0));
    const gastos = puntos.map((m) => Number(m.gastos) || 0);
    const ahorros = puntos.map((m) => Number(m.ahorros) || 0);

    if (inicioEvolucionChart) {
        inicioEvolucionChart.destroy();
    }

    inicioEvolucionChart = new Chart(canvas, {
        type: 'line',
        devicePixelRatio: Math.max(1, window.devicePixelRatio || 1),
        data: {
            labels,
            datasets: [
                {
                    label: (typeof gestorIdiomas !== 'undefined') ? gestorIdiomas.obtenerTexto('inicio.graficoIngresosBrutos') : 'Ingresos brutos',
                    data: ingresos,
                    borderColor: successColor,
                    backgroundColor: hexToRgba(successColor, 0.25),
                    pointBackgroundColor: successColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1,
                    tension: 0.35,
                    borderWidth: 2.5,
                    pointRadius: 2.8
                },
                {
                    label: (typeof gestorIdiomas !== 'undefined') ? gestorIdiomas.obtenerTexto('dashboard.gastos') : 'Gastos',
                    data: gastos,
                    borderColor: dangerColor,
                    backgroundColor: hexToRgba(dangerColor, 0.24),
                    pointBackgroundColor: dangerColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1,
                    tension: 0.35,
                    borderWidth: 2.5,
                    pointRadius: 2.8
                },
                {
                    label: (typeof gestorIdiomas !== 'undefined') ? gestorIdiomas.obtenerTexto('dashboard.ahorros') : 'Ahorros',
                    data: ahorros,
                    borderColor: primaryColor,
                    backgroundColor: hexToRgba(primaryColor, 0.2),
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1,
                    tension: 0.35,
                    borderWidth: 2.5,
                    borderDash: [5, 4],
                    pointRadius: 2.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        color: textColor,
                        font: {
                            size: 12,
                            weight: '600',
                            family: 'Segoe UI, system-ui, sans-serif'
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: textColor,
                        font: { size: 11, weight: '600', family: 'Segoe UI, system-ui, sans-serif' }
                    }
                },
                y: {
                    grid: { color: borderLight },
                    ticks: {
                        color: textColor,
                        font: { size: 11, family: 'Segoe UI, system-ui, sans-serif' }
                    }
                }
            }
        }
    });
}

function renderInicioDeltas(currentMes, prevMes) {
    const sumField = (arr, field) => (Array.isArray(arr) ? arr : []).reduce((acc, m) => acc + (Number(m[field]) || 0), 0);

    const cur = {
        ingresos: sumField(currentMes, 'ingresos') + sumField(currentMes, 'impuestos_ingresos') + sumField(currentMes, 'cuentas_remuneradas'),
        gastos: sumField(currentMes, 'gastos'),
        ahorro: sumField(currentMes, 'ahorros'),
        impuestos: sumField(currentMes, 'impuestos_otros') + sumField(currentMes, 'impuestos_ingresos')
    };
    const prev = {
        ingresos: sumField(prevMes, 'ingresos') + sumField(prevMes, 'impuestos_ingresos') + sumField(prevMes, 'cuentas_remuneradas'),
        gastos: sumField(prevMes, 'gastos'),
        ahorro: sumField(prevMes, 'ahorros'),
        impuestos: sumField(prevMes, 'impuestos_otros') + sumField(prevMes, 'impuestos_ingresos')
    };

    const label = getPeriodLabel(periodoActual);

    const deltaBadge = (cur, prev) => {
        const variation = cur - prev;
        const sign = variation >= 0 ? '+' : '-';
        const cls = variation >= 0 ? 'pos' : 'neg';
        const amount = formatearEuro(Math.abs(variation));

        if (prev === 0) {
            return `<span class="inicio-delta ${cls}">${sign}${amount}</span>`;
        }

        const pct = ((cur / prev) - 1) * 100;
        return `<span class="inicio-delta ${cls}">${sign}${amount} (${sign}${Math.abs(pct).toFixed(1)}%)</span>`;
    };

    const setNote = (id, label, badge) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = badge ? `${label} ${badge}` : label;
    };

    setNote('inicio-note-saldo', label, deltaBadge(cur.ahorro, prev.ahorro));
    setNote('inicio-note-ingresos', label, deltaBadge(cur.ingresos, prev.ingresos));
    setNote('inicio-note-gastos', label, deltaBadge(cur.gastos, prev.gastos));
    setNote('inicio-note-taxes', label, deltaBadge(cur.impuestos, prev.impuestos));
}

async function renderInicioInsights() {
    if (!document.getElementById('inicioCategoriasList')) return;

    let ahorrosMes = [], ahorrosPrev = [], categoriasData = { gastos: {} };

    try {
        const { desde, hasta, prevDesde, prevHasta } = getInicioDateRange(periodoActual);
        const [ahorrosRes, categoriasRes, ahorrosPrevRes] = await Promise.all([
            fetch(`/ahorros-mes?desde=${desde}&hasta=${hasta}`),
            fetch(`/categorias-periodo?desde=${desde}&hasta=${hasta}`),
            fetch(`/ahorros-mes?desde=${prevDesde}&hasta=${prevHasta}`)
        ]);
        if (ahorrosRes.ok) ahorrosMes = (await ahorrosRes.json()) || [];
        if (categoriasRes.ok) categoriasData = (await categoriasRes.json()) || { gastos: {} };
        if (ahorrosPrevRes.ok) ahorrosPrev = (await ahorrosPrevRes.json()) || [];
    } catch (error) {
        console.error('❌ Error cargando insights de inicio:', error);
    }

    const monthCount = getMonthCountForPeriod(periodoActual);
    const ahorrosMesClipped = clipPeriodMonths(ahorrosMes, monthCount);
    const ahorrosPrevClipped = clipPeriodMonths(ahorrosPrev, monthCount);

    // Cards de Inicio alineadas al mismo rango calendario del gráfico
    const sumField = (arr, field) => (Array.isArray(arr) ? arr : []).reduce((acc, m) => acc + (Number(m[field]) || 0), 0);
    const ingresosTotal = sumField(ahorrosMesClipped, 'ingresos') + sumField(ahorrosMesClipped, 'impuestos_ingresos') + sumField(ahorrosMesClipped, 'cuentas_remuneradas');
    const gastosTotal = sumField(ahorrosMesClipped, 'gastos');
    const ahorroTotal = sumField(ahorrosMesClipped, 'ahorros');
    const impuestosTotal = sumField(ahorrosMesClipped, 'impuestos_otros') + sumField(ahorrosMesClipped, 'impuestos_ingresos');

    const ingresosEl = document.getElementById('total-ingresos');
    const gastosEl = document.getElementById('total-gastos');
    const saldoEl = document.getElementById('saldo');
    const taxesEl = document.getElementById('total-taxes');

    if (ingresosEl) ingresosEl.textContent = formatearEuro(ingresosTotal);
    if (gastosEl) gastosEl.textContent = formatearEuro(gastosTotal);
    if (saldoEl) saldoEl.textContent = formatearEuro(ahorroTotal);
    if (taxesEl) taxesEl.textContent = formatearEuro(impuestosTotal);

    // Siempre renderizar aunque los datos estén vacíos (para mostrar el label del período)
    renderInicioEvolucion(ahorrosMesClipped, ahorrosPrevClipped);
    renderInicioCategorias(categoriasData?.gastos || {});
    renderInicioDeltas(ahorrosMesClipped, ahorrosPrevClipped);
}

function initInicio() {
    cargarResumenPeriodos();
    renderInicioInsights();
}

function initAjustes() {
    setUserLabel(activeUser);

    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect && !currencySelect.dataset.listenerAdded) {
        const monedaGuardada = localStorage.getItem('currency') || 'EUR';
        currencySelect.value = monedaGuardada;
        currencySelect.addEventListener('change', (e) => {
            setCurrency(e.target.value);
        });
        currencySelect.dataset.listenerAdded = 'true';
    }

    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect && !languageSelect.dataset.listenerAdded) {
        languageSelect.value = gestorIdiomas?.getIdioma() || 'es';
        languageSelect.addEventListener('change', (e) => {
            if (typeof gestorIdiomas !== 'undefined') {
                gestorIdiomas.cambiarIdioma(e.target.value);
                const tabActiva = document.querySelector('.tablink.active');
                if (tabActiva) {
                    loadTab(tabActiva.dataset.tab);
                }
            }
        });
        languageSelect.dataset.listenerAdded = 'true';
    }

    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect && !themeSelect.dataset.listenerAdded) {
        const temaGuardado = localStorage.getItem('tema') || 'azul';
        themeSelect.value = temaGuardado;
        themeSelect.addEventListener('change', (e) => {
            const nuevoTema = e.target.value;
            if (typeof gestorTemas !== 'undefined') {
                gestorTemas.cambiarTema(nuevoTema);
            }
            const tabActiva = document.querySelector('.tablink.active');
            if (tabActiva) {
                loadTab(tabActiva.dataset.tab);
            }
        });
        themeSelect.dataset.listenerAdded = 'true';
    }
}

async function loadTab(tabId) {
    try {
        // Guardar posición de scroll de la pestaña actual
        const currentTab = document.querySelector('.tablink.active');
        if (currentTab) {
            scrollPositions[currentTab.dataset.tab] = window.scrollY;
        }
        
        // Agregar clase de carga para transición suave
        tabContent.style.opacity = '0';
        
        // Esperar a que termine la transición de fade out
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const res = await fetch(`Pestañas/${tabId}.html`);
        const html = await res.text();
        
        // Restaurar scroll ANTES de cambiar el contenido
        const savedPosition = scrollPositions[tabId] || 0;
        
        // Cambiar contenido mientras está oculto
        tabContent.innerHTML = html;

        console.log(`📄 Pestaña cargada: ${tabId}`);

        // ✅ APLICAR TRADUCCIONES DESPUÉS DE CARGAR EL HTML
        if (typeof gestorIdiomas !== 'undefined') {
            gestorIdiomas.actualizarTraduccionesHTML();
            console.log(`✅ Traducciones aplicadas a: ${tabId}`);
        }

        // Inicializar la lógica específica de cada pestaña
        if (tabId === 'inicio') initInicio();
        if (tabId === 'ajustes') initAjustes();
        if (tabId === 'categorias') initCategorias();
        if (tabId === 'gastos') cargarGastosForm();
        if (tabId === 'ingresos') cargarIngresosForm();
        if (tabId === 'impuestos') await inicializarTaxes();
        if (tabId === 'importacionBancaria') cargarImportacionBancaria();
        if (tabId === 'dashboard') {
            window.dashboardConfig = null;
            cargarDashboardForm();
        }
        if (tabId === 'hucha') {
            if (typeof cargarHucha !== 'undefined') await cargarHucha();
        }
        
        // Restaurar scroll después de cargar todo
        window.scrollTo({ top: savedPosition, behavior: 'instant' });
        
        // Mostrar con transición después de que todo esté listo
        requestAnimationFrame(() => {
            tabContent.style.opacity = '1';
        });

    } catch (error) {
        console.error(`❌ Error cargando pestaña ${tabId}:`, error);
        tabContent.style.opacity = '1';
    }
}


// Evento de clic en las pestañas
buttons.forEach(btn => {
    btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadTab(btn.dataset.tab);
    });
});

// Cargar la pestaña inicial
document.addEventListener('DOMContentLoaded', () => {
    const temaGuardado = localStorage.getItem('tema') || 'azul';
    const idiomaGuardado = localStorage.getItem('idioma') || 'es';
    const monedaGuardada = localStorage.getItem('currency') || 'EUR';

    if (typeof gestorTemas !== 'undefined') {
        gestorTemas.aplicarTema(temaGuardado);
    }
    if (typeof gestorIdiomas !== 'undefined') {
        gestorIdiomas.cambiarIdioma(idiomaGuardado);
    }
    setCurrency(monedaGuardada, { silent: true });

    initUserSelection();
});



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
                        const [resHucha, resCR, resAssets] = await Promise.all([
                            fetch('/hucha'),
                            fetch('/cuenta_remunerada'),
                            fetch('/assets')
                        ]);

                        const dataHucha = resHucha.ok ? await resHucha.json() : [];
                        const dataCR = resCR.ok ? await resCR.json() : [];
                        const dataAssets = resAssets.ok ? await resAssets.json() : [];

                        const totalHuchaManual = dataHucha.reduce((acc, item) => acc + (parseFloat(item.cantidad) || 0), 0);

                        const mesReferencia = getReferenceMonthForPeriod(periodo);
                        const totalCR = dataCR
                            .filter(cr => isCuentaRemuneradaActiva(cr, mesReferencia))
                            .reduce((acc, cr) => acc + calcularSaldoCuentaRemunerada(cr, mesReferencia), 0);

                        let totalAssets = 0;
                        for (const asset of dataAssets) {
                            try {
                                const currentPrice = await window.getAssetPrice(asset.ticker);
                                if (currentPrice) {
                                    totalAssets += asset.shares * currentPrice;
                                }
                            } catch (e) {
                                console.error(`Error obteniendo precio para ${asset.ticker}:`, e);
                            }
                        }

                        hucha.textContent = formatearEuro(totalHuchaManual + totalCR + totalAssets);
                    } catch {
                        hucha.textContent = formatearEuro(0);
                    }
                }
                
                // Calcular rendimiento del portfolio (con caché de 20 minutos)
                const portfolio = document.getElementById('portfolio-rendimiento');
                if (portfolio) {
                    const now = Date.now();
                    const portfolioCacheKey = `${activeUser || 'anon'}:${periodo}`;
                    if (portfolioResultCache && portfolioResultCache.key === portfolioCacheKey && (now - portfolioResultCache.timestamp) < PORTFOLIO_CACHE_TTL) {
                        portfolio.textContent = portfolioResultCache.textContent;
                        portfolio.style.color = portfolioResultCache.color;
                    } else {
                        try {
                            const resAssets = await fetch('/assets');
                            if (resAssets.ok) {
                                const assets = await resAssets.json();

                                if (assets.length === 0) {
                                    portfolioResultCache = { key: portfolioCacheKey, textContent: '€0 (0%)', color: '', timestamp: now };
                                    portfolio.textContent = '€0 (0%)';
                                    portfolio.style.color = '';
                                } else {
                                    let totalInvested = 0;
                                    let currentValue = 0;

                                    for (const asset of assets) {
                                        const invested = asset.shares * asset.purchase_price;
                                        totalInvested += invested;
                                        try {
                                            const currentPrice = await window.getAssetPrice(asset.ticker);
                                            currentValue += asset.shares * (currentPrice || asset.purchase_price);
                                        } catch (e) {
                                            currentValue += invested;
                                        }
                                    }

                                    const profit = currentValue - totalInvested;
                                    const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
                                    const sign = profit >= 0 ? '+' : '';
                                    const textContent = `${sign}${formatearEuro(profit)} (${sign}${profitPercent.toFixed(2)}%)`;
                                    const color = profit >= 0 ? 'var(--success)' : 'var(--danger)';

                                    portfolioResultCache = { key: portfolioCacheKey, textContent, color, timestamp: now };
                                    portfolio.textContent = textContent;
                                    portfolio.style.color = color;
                                }
                            } else {
                                portfolio.textContent = '€0 (0%)';
                                portfolio.style.color = '';
                            }
                        } catch (e) {
                            console.error('Error calculando rendimiento del portfolio:', e);
                            portfolio.textContent = '€0 (0%)';
                            portfolio.style.color = '';
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

// ===== UTILIDADES GLOBALES =====

/**
 * Formatear monto según la moneda seleccionada (default EUR)
 */
function formatearEuro(monto) {
    if (typeof formatCurrency === 'function') return formatCurrency(monto, { convert: false });
    if (monto === null || monto === undefined) return '€0.00';
    return '€' + parseFloat(monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Obtener un texto traducido
 * @param {string} clave - La clave de traducción (ej: 'app.titulo')
 * @returns {string} - El texto traducido
 */
function t(clave) {
    if (typeof gestorIdiomas !== 'undefined') {
        return gestorIdiomas.obtenerTexto(clave);
    }
    return clave;
}

/**
 * Mostrar un mensaje de éxito
 * @param {string} clave - La clave del mensaje (ej: 'mensajes.exito')
 */
function mostrarExito(clave) {
    const mensaje = t(clave);
    console.log(`✅ ${mensaje}`);
    // Aquí puedes agregar lógica para mostrar un toast/notificación visual
}

/**
 * Mostrar un mensaje de error
 * @param {string} clave - La clave del mensaje (ej: 'mensajes.error')
 */
function mostrarError(clave) {
    const mensaje = t(clave);
    console.error(`❌ ${mensaje}`);
    // Aquí puedes agregar lógica para mostrar un toast/notificación visual
}

/**
 * Validar un campo requerido
 * @param {string} valor - El valor a validar
 * @param {string} claveMensaje - La clave del mensaje de error
 * @returns {boolean} - True si es válido
 */
function validarRequerido(valor, claveMensaje = 'errores.campoObligatorio') {
    if (!valor || valor.trim() === '') {
        mostrarError(claveMensaje);
        return false;
    }
    return true;
}

/**
 * Validar un monto positivo
 * @param {number} monto - El monto a validar
 * @returns {boolean} - True si es válido
 */
function validarMonto(monto) {
    if (isNaN(monto) || monto < 0) {
        mostrarError('errores.montoNegativo');
        return false;
    }
    return true;
}

/**
 * Validar una fecha
 * @param {string} fecha - La fecha a validar (formato YYYY-MM-DD)
 * @returns {boolean} - True si es válida
 */
function validarFecha(fecha) {
    if (!fecha || fecha === '') {
        mostrarError('errores.seleccionaFecha');
        return false;
    }
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
        mostrarError('errores.fechaInvalida');
        return false;
    }
    return true;
}

console.log('✅ main.js cargado completamente');