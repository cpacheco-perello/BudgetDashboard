// ===== MANEJO DE PESTAÑAS =====
const buttons = document.querySelectorAll('.tablink');
const tabContent = document.getElementById('tab-content');

// Guardar posición de scroll por pestaña
const scrollPositions = {};

function setActiveTabButton(tabId) {
    buttons.forEach((btn) => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-current', isActive ? 'page' : 'false');
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function initTabAccessibility() {
    const tabButtons = Array.from(buttons).filter((btn) => !!btn.dataset.tab);
    tabButtons.forEach((btn, idx) => {
        const shortcut = idx < 9 ? `Alt+${idx + 1}` : '';
        if (shortcut) {
            btn.setAttribute('aria-keyshortcuts', shortcut);
            const title = String(btn.getAttribute('title') || '').trim();
            if (title && !title.includes(`(${shortcut})`)) {
                btn.setAttribute('title', `${title} (${shortcut})`);
            }
        }
    });
}

function isEditableTarget(target) {
    if (!target) return false;
    const tagName = String(target.tagName || '').toLowerCase();
    if (target.isContentEditable) return true;
    return ['input', 'textarea', 'select'].includes(tagName);
}

function focusFirstTableFilterControl() {
    if (!tabContent) return false;
    const control = tabContent.querySelector('.table-column-filter-control');
    if (!control) return false;
    control.focus();
    if (typeof control.select === 'function' && control.tagName === 'INPUT') {
        control.select();
    }
    return true;
}

function initKeyboardNavigation() {
    if (!document.body || document.body.dataset.keyboardNavigationReady === 'true') return;
    document.body.dataset.keyboardNavigationReady = 'true';

    document.addEventListener('keydown', (event) => {
        const key = String(event.key || '').toLowerCase();

        // Alt+1..9 cambia de pestaña principal.
        if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
            const match = String(event.code || '').match(/^Digit([1-9])$/);
            if (match) {
                const tabIndex = Number(match[1]) - 1;
                const tabButtons = Array.from(buttons).filter((btn) => !!btn.dataset.tab);
                const targetButton = tabButtons[tabIndex];
                if (targetButton?.dataset?.tab) {
                    event.preventDefault();
                    loadTab(targetButton.dataset.tab);
                }
                return;
            }
        }

        // Ctrl+Alt+F enfoca el primer filtro de tabla de la pestaña activa.
        if (event.ctrlKey && event.altKey && !event.metaKey && key === 'f') {
            if (focusFirstTableFilterControl()) {
                event.preventDefault();
            }
            return;
        }

        // '/' enfoca filtros rápidos cuando no se está escribiendo.
        if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key === '/') {
            if (!isEditableTarget(event.target) && focusFirstTableFilterControl()) {
                event.preventDefault();
            }
        }
    });
}

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

function setMaximizeButtonState(isMaximized) {
    const maximizeBtn = document.getElementById('windowMaximizeBtn');
    if (!maximizeBtn) return;

    if (isMaximized) {
        maximizeBtn.innerHTML = '<i class="far fa-clone"></i>';
        maximizeBtn.title = 'Restaurar';
        maximizeBtn.setAttribute('aria-label', 'Restaurar');
    } else {
        maximizeBtn.innerHTML = '<i class="far fa-square"></i>';
        maximizeBtn.title = 'Maximizar';
        maximizeBtn.setAttribute('aria-label', 'Maximizar');
    }
}

async function initWindowControls() {
    const titlebar = document.getElementById('windowTitlebar');
    const minimizeBtn = document.getElementById('windowMinimizeBtn');
    const maximizeBtn = document.getElementById('windowMaximizeBtn');
    const closeBtn = document.getElementById('windowCloseBtn');
    const api = window.electronAPI;

    if (!titlebar || !minimizeBtn || !maximizeBtn || !closeBtn) return;
    if (!api || !api.windowMinimize || !api.windowMaximizeToggle || !api.windowClose) {
        titlebar.style.display = 'none';
        return;
    }

    if (api.platform === 'darwin') {
        titlebar.style.display = 'none';
        return;
    }

    minimizeBtn.addEventListener('click', async () => {
        try {
            await api.windowMinimize();
        } catch (error) {
            console.error('Error minimizando ventana:', error);
        }
    });

    maximizeBtn.addEventListener('click', async () => {
        try {
            const result = await api.windowMaximizeToggle();
            setMaximizeButtonState(!!result?.isMaximized);
        } catch (error) {
            console.error('Error maximizando/restaurando ventana:', error);
        }
    });

    closeBtn.addEventListener('click', async () => {
        try {
            await api.windowClose();
        } catch (error) {
            console.error('Error cerrando ventana:', error);
        }
    });

    titlebar.addEventListener('dblclick', async () => {
        try {
            const result = await api.windowMaximizeToggle();
            setMaximizeButtonState(!!result?.isMaximized);
        } catch (error) {
            console.error('Error alternando maximize con doble click:', error);
        }
    });

    if (api.windowIsMaximized) {
        try {
            const state = await api.windowIsMaximized();
            setMaximizeButtonState(!!state?.isMaximized);
        } catch (error) {
            setMaximizeButtonState(false);
        }
    }

    if (api.onWindowMaximizedChanged) {
        api.onWindowMaximizedChanged((isMaximized) => {
            setMaximizeButtonState(!!isMaximized);
        });
    }
}

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
    const normalizedTicker = String(ticker || '').trim().toUpperCase();
    if (!normalizedTicker) return null;

    const now = Date.now();
    if (assetPriceCache[normalizedTicker] && (now - assetPriceCache[normalizedTicker].timestamp) < ASSET_CACHE_DURATION) {
        return assetPriceCache[normalizedTicker].price;
    }
    
    try {
        const res = await fetch(`/asset-price/${encodeURIComponent(normalizedTicker)}`);
        if (res.ok) {
            const data = await res.json();
            const parsedPrice = Number(data?.currentPrice);
            const price = Number.isFinite(parsedPrice) ? parsedPrice : null;
            assetPriceCache[normalizedTicker] = {
                price,
                timestamp: now
            };
            return price;
        }
    } catch (e) {
        console.error(`Error obteniendo precio para ${normalizedTicker}:`, e);
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    const makeGradient = (color, alphaTop, alphaBottom) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 220);
        gradient.addColorStop(0, hexToRgba(color, alphaTop));
        gradient.addColorStop(1, hexToRgba(color, alphaBottom));
        return gradient;
    };

    const ingresosGradient = makeGradient(successColor, 0.35, 0.03);
    const gastosGradient = makeGradient(dangerColor, 0.33, 0.03);
    const ahorrosGradient = makeGradient(primaryColor, 0.3, 0.03);

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
                    backgroundColor: ingresosGradient,
                    pointBackgroundColor: successColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1,
                    tension: 0.38,
                    borderWidth: 2.4,
                    pointRadius: 2.2,
                    pointHoverRadius: 4,
                    fill: true
                },
                {
                    label: (typeof gestorIdiomas !== 'undefined') ? gestorIdiomas.obtenerTexto('dashboard.gastos') : 'Gastos',
                    data: gastos,
                    borderColor: dangerColor,
                    backgroundColor: gastosGradient,
                    pointBackgroundColor: dangerColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1,
                    tension: 0.38,
                    borderWidth: 2.4,
                    pointRadius: 2.2,
                    pointHoverRadius: 4,
                    fill: true
                },
                {
                    label: (typeof gestorIdiomas !== 'undefined') ? gestorIdiomas.obtenerTexto('dashboard.ahorros') : 'Ahorros',
                    data: ahorros,
                    borderColor: primaryColor,
                    backgroundColor: ahorrosGradient,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1,
                    tension: 0.38,
                    borderWidth: 2.4,
                    borderDash: [5, 4],
                    pointRadius: 2.2,
                    pointHoverRadius: 4,
                    fill: true
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
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: 'rgba(148, 163, 184, 0.45)',
                    borderWidth: 1,
                    padding: 10,
                    titleFont: { size: 12, weight: '700' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(ctxItem) {
                            return `${ctxItem.dataset.label}: ${formatearEuro(ctxItem.raw || 0)}`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        usePointStyle: true,
                        color: textColor,
                        font: {
                            size: 11,
                            weight: '600',
                            family: 'Segoe UI, system-ui, sans-serif'
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: hexToRgba(primaryColor, 0.08) },
                    ticks: {
                        color: textColor,
                        font: { size: 11, weight: '600', family: 'Segoe UI, system-ui, sans-serif' }
                    }
                },
                y: {
                    grid: { color: hexToRgba(primaryColor, 0.12) },
                    ticks: {
                        color: textColor,
                        font: { size: 11, family: 'Segoe UI, system-ui, sans-serif' },
                        callback: function(value) {
                            return formatearEuro(value);
                        }
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

const tableSearchRegistry = new WeakMap();
const TABLE_FILTER_STATE_KEY = 'dashboardTableFilterStateV1';

function getTableFilterStore() {
    try {
        const raw = localStorage.getItem(TABLE_FILTER_STATE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (_) {
        return {};
    }
}

function saveTableFilterStore(store) {
    try {
        localStorage.setItem(TABLE_FILTER_STATE_KEY, JSON.stringify(store || {}));
    } catch (_) {
        // Ignore storage errors in private mode / full quota.
    }
}

function getScopedTableFilterKey(tableId) {
    const userScope = (activeUser && String(activeUser).trim()) ? String(activeUser).trim() : 'global';
    return `${userScope}::${tableId}`;
}

function loadTableFilterState(tableId) {
    if (!tableId) return {};
    const store = getTableFilterStore();
    const scopedKey = getScopedTableFilterKey(tableId);
    const state = store[scopedKey];
    return (state && typeof state === 'object') ? state : {};
}

function saveTableFilterState(tableId, filterControls) {
    if (!tableId) return;
    const store = getTableFilterStore();
    const scopedKey = getScopedTableFilterKey(tableId);

    const nextState = {};
    (Array.isArray(filterControls) ? filterControls : []).forEach((control) => {
        const index = Number(control.dataset.columnIndex);
        if (!Number.isInteger(index) || index < 0) return;
        const value = String(control.value || '').trim();
        if (!value) return;
        nextState[index] = value;
    });

    if (Object.keys(nextState).length > 0) {
        store[scopedKey] = nextState;
    } else {
        delete store[scopedKey];
    }

    saveTableFilterStore(store);
}

function clearTableFilterState(tableId) {
    if (!tableId) return;
    const store = getTableFilterStore();
    const scopedKey = getScopedTableFilterKey(tableId);
    if (scopedKey in store) {
        delete store[scopedKey];
        saveTableFilterStore(store);
    }
}

function normalizarTextoBusqueda(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function obtenerPlaceholderBuscadorTabla() {
    if (typeof gestorIdiomas !== 'undefined') {
        const texto = gestorIdiomas.obtenerTexto('tablas.buscar');
        if (texto && texto !== 'tablas.buscar') return texto;
    }
    return 'Buscar en tabla...';
}

function obtenerTextoTodosFiltro() {
    if (typeof gestorIdiomas !== 'undefined') {
        const keys = ['dashboard.todasCategorias', 'importacion.seleccionarTodos', 'categorias.todas'];
        for (const key of keys) {
            const text = gestorIdiomas.obtenerTexto(key);
            if (text && text !== key) return text;
        }
    }
    return 'Todos';
}

function obtenerTextoInterfaz(key, fallback) {
    if (typeof gestorIdiomas !== 'undefined') {
        const text = gestorIdiomas.obtenerTexto(key);
        if (text && text !== key) return text;
    }
    return fallback;
}

function obtenerTextoLimpiarFiltros() {
    return obtenerTextoInterfaz('formularios.limpiar', 'Limpiar filtros');
}

function obtenerTextoAjustaFiltros() {
    return obtenerTextoInterfaz('tablas.ajustaFiltros', 'Ajusta o limpia filtros');
}

function obtenerTextoSinDatosTabla() {
    return obtenerTextoInterfaz('mensajes.noHayDatos', 'No hay datos disponibles');
}

function obtenerTextoExportarTabla() {
    return obtenerTextoInterfaz('tablas.exportar', 'Exportar CSV');
}

function obtenerTextoSinFilasExportables() {
    return obtenerTextoInterfaz('tablas.sinFilasExportables', 'No hay filas visibles para exportar');
}

function obtenerTextoExportacionOk() {
    return obtenerTextoInterfaz('tablas.exportacionOk', 'Archivo CSV exportado');
}

function obtenerOCrearToolbarFiltros(table) {
    const wrapper = table.closest('.table-container') || table.parentElement;
    if (!wrapper) return null;

    let toolbar = wrapper.querySelector(`.table-filter-toolbar[data-table-filter-toolbar="${table.id}"]`);
    if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.className = 'table-filter-toolbar';
        toolbar.dataset.tableFilterToolbar = table.id;
        toolbar.innerHTML = `
            <span class="table-filter-status"></span>
            <div class="table-filter-toolbar-actions">
                <button type="button" class="table-filter-export-btn">
                    <i class="fas fa-file-export" aria-hidden="true"></i>
                    <span></span>
                </button>
                <button type="button" class="table-filter-clear-btn">
                    <i class="fas fa-filter-circle-xmark" aria-hidden="true"></i>
                    <span></span>
                </button>
            </div>
        `;
        wrapper.insertBefore(toolbar, table);
    }

    return toolbar;
}

function actualizarResumenFiltrosTabla(table, filterControls) {
    const toolbar = obtenerOCrearToolbarFiltros(table);
    if (!toolbar) return;

    const statusEl = toolbar.querySelector('.table-filter-status');
    const clearBtn = toolbar.querySelector('.table-filter-clear-btn');
    const exportBtn = toolbar.querySelector('.table-filter-export-btn');
    const clearBtnLabel = clearBtn?.querySelector('span');
    const exportBtnLabel = exportBtn?.querySelector('span');

    const rows = Array.from(table?.tBodies?.[0]?.rows || []);
    const totalRows = rows.length;
    const visibleRows = rows.filter((row) => row.style.display !== 'none').length;
    const activeFilters = (Array.isArray(filterControls) ? filterControls : [])
        .filter((control) => String(control.value || '').trim() !== '').length;

    if (clearBtnLabel) clearBtnLabel.textContent = obtenerTextoLimpiarFiltros();
    if (exportBtnLabel) exportBtnLabel.textContent = obtenerTextoExportarTabla();
    if (clearBtn) clearBtn.disabled = activeFilters === 0;

    if (!statusEl) return;

    if (totalRows === 0) {
        statusEl.textContent = `${obtenerTextoSinDatosTabla()}. ${obtenerTextoInterfaz('tablas.agregaPrimero', 'Agrega el primer registro desde la fila superior.')}`;
        statusEl.classList.add('is-empty');
        statusEl.classList.remove('is-no-results');
        return;
    }

    if (visibleRows === 0) {
        const sinResultados = obtenerTextoInterfaz('tablas.sinResultados', 'Sin resultados');
        statusEl.textContent = `${sinResultados}. ${obtenerTextoAjustaFiltros()}.`;
        statusEl.classList.add('is-no-results');
        statusEl.classList.remove('is-empty');
        return;
    }

    const template = obtenerTextoInterfaz('tablas.mostrandoRegistros', 'Mostrando {0} de {1} registros');
    statusEl.textContent = template.replace('{0}', visibleRows).replace('{1}', totalRows);
    statusEl.classList.remove('is-empty', 'is-no-results');
}


function escaparCsvValor(value) {
    const raw = String(value ?? '').replace(/\r?\n|\r/g, ' ').trim();
    if (raw.includes('"') || raw.includes(',') || raw.includes(';')) {
        return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
}

function exportarFilasVisiblesTabla(table) {
    if (!table || !table.id) return;

    const headerCells = Array.from(table.querySelectorAll('thead tr:first-child th'));
    const exportColumns = headerCells
        .map((th, index) => ({ index, label: obtenerLabelColumna(th, index), isAction: esColumnaAcciones(th) }))
        .filter((column) => !column.isAction);

    const rows = Array.from(table.tBodies?.[0]?.rows || []).filter((row) => row.style.display !== 'none');
    if (rows.length === 0) {
        if (typeof window.notifyInfo === 'function') {
            window.notifyInfo(obtenerTextoSinFilasExportables());
        }
        return;
    }

    const lines = [];
    lines.push(exportColumns.map((column) => escaparCsvValor(column.label)).join(';'));
    rows.forEach((row) => {
        const values = exportColumns.map((column) => {
            const text = row.cells?.[column.index]?.textContent || '';
            return escaparCsvValor(text);
        });
        lines.push(values.join(';'));
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateLabel = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `${table.id}-${dateLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof window.notifySuccess === 'function') {
        window.notifySuccess(obtenerTextoExportacionOk());
    }
}

function esColumnaAcciones(th) {
    if (!th) return false;
    const i18nKey = String(th.getAttribute('data-i18n') || '').toLowerCase();
    const label = normalizarTextoBusqueda(th.textContent);

    if (i18nKey.includes('acciones')) return true;
    if (label.includes('accion') || label.includes('actions')) return true;
    if (th.classList.contains('w-120') || th.classList.contains('w-150')) return true;
    return false;
}

function obtenerLabelColumna(th, index) {
    const text = String(th?.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) return text;
    return `Col ${index + 1}`;
}

function esValorTipoFecha(value) {
    const normalized = String(value || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) || /^\d{4}-\d{2}$/.test(normalized);
}

function esValorTipoNumero(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return false;
    const cleaned = normalized.replace(/[€$£¥%\s]/g, '').replace(/\./g, '').replace(',', '.');
    return /^-?\d+(\.\d+)?$/.test(cleaned);
}

function obtenerValoresUnicosColumna(table, columnIndex, maxValues = 40) {
    const tbody = table?.tBodies?.[0];
    if (!tbody) return [];

    const valueMap = new Map();
    Array.from(tbody.rows || []).forEach((row) => {
        const value = String(row.cells[columnIndex]?.textContent || '').replace(/\s+/g, ' ').trim();
        if (!value || value === '—') return;
        const key = normalizarTextoBusqueda(value);
        if (!key || valueMap.has(key)) return;
        valueMap.set(key, value);
    });

    return Array.from(valueMap.values())
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
        .slice(0, maxValues);
}

function debeUsarSelectEnColumna(th, valoresUnicos) {
    if (!th || !Array.isArray(valoresUnicos) || valoresUnicos.length === 0) return false;

    const i18nKey = normalizarTextoBusqueda(th.getAttribute('data-i18n') || '');
    const label = normalizarTextoBusqueda(th.textContent || '');
    const contexto = `${i18nKey} ${label}`;

    // Columnas categóricas con muchos posibles valores únicos
    if (/categoria|tipo|estado|cuenta|origen|metodo|m[eé]todo|banco|moneda|divisa/.test(contexto)) {
        return valoresUnicos.length <= 60;
    }

    // Columnas de período (YYYY-MM) y texto corto identificador — select aunque sean fechas
    if (/\bdesde\b|\bhasta\b|\bticker\b|\bempresa\b|compan|\bconcepto\b/.test(contexto)) {
        return valoresUnicos.length <= 36;
    }

    if (valoresUnicos.length > 14) return false;

    const largos = valoresUnicos.filter((value) => String(value).length > 28).length;
    if (largos > 2) return false;

    const numericosOFecha = valoresUnicos.filter((value) => esValorTipoNumero(value) || esValorTipoFecha(value)).length;
    if ((numericosOFecha / valoresUnicos.length) >= 0.6) return false;

    return true;
}

function actualizarOpcionesSelectDeFiltros(table, filterControls) {
    const selects = (Array.isArray(filterControls) ? filterControls : [])
        .filter((control) => control.tagName === 'SELECT');

    selects.forEach((selectControl) => {
        const columnIndex = Number(selectControl.dataset.columnIndex);
        if (!Number.isInteger(columnIndex) || columnIndex < 0) return;

        const valoresUnicos = obtenerValoresUnicosColumna(table, columnIndex, 80);
        const selected = selectControl.value;
        const allText = selectControl.dataset.allText || 'Todos';

        selectControl.innerHTML = '';

        const optionAll = document.createElement('option');
        optionAll.value = '';
        optionAll.textContent = allText;
        selectControl.appendChild(optionAll);

        valoresUnicos.forEach((value) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            selectControl.appendChild(option);
        });

        selectControl.value = valoresUnicos.includes(selected) ? selected : '';
    });
}

function aplicarFiltroTablaPorColumnas(table, filterControls) {
    const tbody = table?.tBodies?.[0];
    if (!tbody) return;

    const filters = (Array.isArray(filterControls) ? filterControls : [])
        .map((control) => ({
            columnIndex: Number(control.dataset.columnIndex),
            query: normalizarTextoBusqueda(control.value || ''),
            mode: control.dataset.matchMode || 'includes'
        }))
        .filter((entry) => Number.isInteger(entry.columnIndex) && entry.columnIndex >= 0);

    Array.from(tbody.rows || []).forEach((row) => {
        const visible = filters.every(({ columnIndex, query, mode }) => {
            if (!query) return true;
            const cellText = normalizarTextoBusqueda(row.cells[columnIndex]?.textContent || '');
            if (mode === 'exact') {
                return cellText === query;
            }
            return cellText.includes(query);
        });
        row.style.display = visible ? '' : 'none';
    });

    actualizarResumenFiltrosTabla(table, filterControls);
}

function attachTableSearch(table) {
    if (!table || !table.id || table.dataset.disableSearch === 'true') return;

    const thead = table.tHead;
    if (!thead) return;

    const headerCells = Array.from(thead.rows[0]?.cells || []);
    if (headerCells.length === 0) return;

    const toolbar = obtenerOCrearToolbarFiltros(table);

    // Reutilizar o crear la fila de filtros dentro del thead
    let filterRow = thead.querySelector('tr.table-filter-row');
    if (!filterRow) {
        filterRow = document.createElement('tr');
        filterRow.className = 'table-filter-row';
        thead.appendChild(filterRow);
    }

    const textoTodos = obtenerTextoTodosFiltro();
    const persistedValuesByColumn = loadTableFilterState(table.id);

    // Guardar valores previos antes de vaciar
    const previousValuesByColumn = {};
    Array.from(filterRow.querySelectorAll('.table-column-filter-control')).forEach((control) => {
        const columnIndex = Number(control.dataset.columnIndex);
        if (Number.isInteger(columnIndex) && columnIndex >= 0) {
            previousValuesByColumn[columnIndex] = control.value || '';
        }
    });
    filterRow.innerHTML = '';

    headerCells.forEach((th, index) => {
        const td = document.createElement('td');
        td.className = 'table-filter-cell';

        if (esColumnaAcciones(th)) {
            td.classList.add('is-action');
            filterRow.appendChild(td);
            return;
        }

        const label = obtenerLabelColumna(th, index);
        const valoresUnicos = obtenerValoresUnicosColumna(table, index);
        const usarSelect = debeUsarSelectEnColumna(th, valoresUnicos);

        let control;
        if (usarSelect) {
            const select = document.createElement('select');
            select.className = 'table-column-filter-select table-column-filter-control';
            select.dataset.columnIndex = String(index);
            select.dataset.matchMode = 'exact';
            select.dataset.allText = textoTodos;
            select.setAttribute('aria-label', label);
            control = select;
        } else {
            const input = document.createElement('input');
            input.type = 'search';
            input.className = 'table-column-filter-input table-column-filter-control';
            input.dataset.columnIndex = String(index);
            input.dataset.matchMode = 'includes';
            input.placeholder = label;
            input.setAttribute('aria-label', label);
            control = input;
        }

        const previousValue = previousValuesByColumn[index];
        const persistedValue = persistedValuesByColumn[index];
        control.value = previousValue || persistedValue || '';
        td.appendChild(control);
        filterRow.appendChild(td);
    });

    const filterControls = Array.from(filterRow.querySelectorAll('.table-column-filter-control'));
    actualizarOpcionesSelectDeFiltros(table, filterControls);

    filterControls.forEach((control) => {
        const onFilterChange = () => {
            saveTableFilterState(table.id, filterControls);
            aplicarFiltroTablaPorColumnas(table, filterControls);
        };
        control.addEventListener('input', onFilterChange);
        control.addEventListener('change', onFilterChange);
    });

    if (toolbar) {
        const clearBtn = toolbar.querySelector('.table-filter-clear-btn');
        const exportBtn = toolbar.querySelector('.table-filter-export-btn');

        if (exportBtn) {
            exportBtn.onclick = () => {
                exportarFilasVisiblesTabla(table);
            };
        }

        if (clearBtn) {
            clearBtn.onclick = () => {
                filterControls.forEach((control) => {
                    control.value = '';
                    control.dispatchEvent(new Event('change'));
                });
                clearTableFilterState(table.id);
                const firstControl = filterControls[0];
                if (firstControl) firstControl.focus();
            };
        }
    }

    const existingRegistry = tableSearchRegistry.get(table);
    if (existingRegistry?.observer) {
        existingRegistry.observer.disconnect();
    }

    const tbody = table.tBodies?.[0];
    if (tbody) {
        const observer = new MutationObserver(() => {
            actualizarOpcionesSelectDeFiltros(table, filterControls);
            aplicarFiltroTablaPorColumnas(table, filterControls);
        });
        observer.observe(tbody, { childList: true, subtree: true });
        tableSearchRegistry.set(table, { observer });
    }

    aplicarFiltroTablaPorColumnas(table, filterControls);
}

function initTableSearchers(scope = document) {
    const tables = scope.querySelectorAll('table[id]');
    tables.forEach((table) => attachTableSearch(table));
}

async function loadTab(tabId) {
    try {
        // Guardar posición de scroll de la pestaña actual
        const currentTab = document.querySelector('.tablink.active');
        if (currentTab) {
            scrollPositions[currentTab.dataset.tab] = window.scrollY;
        }

        setActiveTabButton(tabId);
        
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

        // Añadir filtros por columna a las tablas de la pestaña.
        initTableSearchers(tabContent);
        
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

    initTabAccessibility();
    initKeyboardNavigation();
    const activeBtn = document.querySelector('.tablink.active');
    if (activeBtn?.dataset?.tab) {
        setActiveTabButton(activeBtn.dataset.tab);
    }

    initWindowControls();
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