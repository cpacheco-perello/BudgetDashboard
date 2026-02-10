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
        label.textContent = name || 'Sin usuario';
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
        await cargarResumenPeriodos();
        await loadTab('categorias');
    } catch (err) {
        showUserError(err.message || 'No se pudo seleccionar el usuario');
        toggleUserOverlay(true);
    } finally {
        switchingUser = false;
    }
}

async function initUserSelection() {
    if (!window.electronAPI?.listUsers) {
        loadTab('categorias');
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

    return monto + aportacionesAcumuladas + totalInteres;
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
            if (!resumenData || !resumenData[periodo]) {
                console.warn(`⚠️ Datos no disponibles para período: ${periodo}`);
                return;
            }

            const stats = resumenData[periodo];
            const ingresos = document.getElementById('total-ingresos');
            const gastos = document.getElementById('total-gastos');
            const saldo = document.getElementById('saldo');
            const taxes = document.getElementById('total-taxes');
                const hucha = document.getElementById('total-hucha');

            if (ingresos) ingresos.textContent = formatearEuro(stats.ingresos);
            if (gastos) gastos.textContent = formatearEuro(stats.gastos);
            if (saldo) saldo.textContent = formatearEuro(stats.ahorro);
            if (taxes) taxes.textContent = formatearEuro(stats.impuestos || 0);

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

                        const now = new Date();
                        const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                        const totalCR = dataCR
                            .filter(cr => isCuentaRemuneradaActiva(cr, mesActual))
                            .reduce((acc, cr) => acc + calcularSaldoCuentaRemunerada(cr, mesActual), 0);

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
                
                // Calcular rendimiento del portfolio
                const portfolio = document.getElementById('portfolio-rendimiento');
                if (portfolio) {
                    try {
                        const resAssets = await fetch('/assets');
                        if (resAssets.ok) {
                            const assets = await resAssets.json();
                            
                            if (assets.length === 0) {
                                portfolio.textContent = '€0 (0%)';
                                portfolio.style.color = '';
                            } else {
                                let totalInvested = 0;
                                let currentValue = 0;
                                
                                // Calcular para cada asset
                                for (const asset of assets) {
                                    const invested = asset.shares * asset.purchase_price;
                                    totalInvested += invested;
                                    
                                    // Obtener precio actual
                                    try {
                                        const priceRes = await fetch(`/asset-price/${asset.ticker}`);
                                        if (priceRes.ok) {
                                            const priceData = await priceRes.json();
                                            const currentPrice = priceData.currentPrice || asset.purchase_price;
                                            currentValue += asset.shares * currentPrice;
                                        } else {
                                            currentValue += invested;
                                        }
                                    } catch (e) {
                                        currentValue += invested;
                                    }
                                }
                                
                                const profit = currentValue - totalInvested;
                                const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
                                const sign = profit >= 0 ? '+' : '';
                                
                                portfolio.textContent = `${sign}${formatearEuro(profit)} (${sign}${profitPercent.toFixed(2)}%)`;
                                portfolio.style.color = profit >= 0 ? '#22c55e' : '#ef4444';
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
        
        // Botones de período (solo agregar listeners si no existen)
        const btnsPeriodo = document.querySelectorAll('.btn-periodo');
        if (btnsPeriodo.length > 0 && !btnsPeriodo[0].dataset.listenerAdded) {
            btnsPeriodo.forEach(btn => {
                btn.addEventListener('click', () => {
                    btnsPeriodo.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    periodoActual = btn.dataset.periodo;
                    actualizarResumen(periodoActual);
                    console.log(`📊 Período actualizado a: ${periodoActual}`);
                });
                btn.dataset.listenerAdded = 'true';
            });
        }

        // Botón de refresh
        const btnRefresh = document.getElementById('btn-refresh-resumen');
        if (btnRefresh && !btnRefresh.dataset.listenerAdded) {
            btnRefresh.addEventListener('click', async () => {
                btnRefresh.classList.add('spinning');
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
                setTimeout(() => btnRefresh.classList.remove('spinning'), 600);
            });
            btnRefresh.dataset.listenerAdded = 'true';
        }

        // Cargar con el período actual (o 1mes si es la primera carga)
        actualizarResumen(periodoActual);
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

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarResumenPeriodos();
});

// Recargar resumen cada 5 minutos automáticamente
setInterval(() => {
    if (!cargandoResumen) {
        cargarResumenPeriodos();
    }
}, 5 * 60 * 1000);

// ===== SELECTOR DE MONEDA EN HEADER =====
document.addEventListener('DOMContentLoaded', () => {
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        const monedaGuardada = localStorage.getItem('currency') || 'EUR';
        currencySelect.value = monedaGuardada;
        setCurrency(monedaGuardada, { silent: true });
        currencySelect.addEventListener('change', (e) => {
            setCurrency(e.target.value);
        });
        console.log('✅ Selector de moneda vinculado');
    } else {
        console.warn('⚠️ Elemento currencySelect no encontrado');
    }
});

// ===== SELECTOR DE IDIOMA EN HEADER =====
document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('languageSelect');
    
    if (languageSelect) {
        // Establecer el idioma actual
        languageSelect.value = gestorIdiomas?.getIdioma() || 'es';
        
        // Cambiar idioma cuando el usuario selecciona uno nuevo
        languageSelect.addEventListener('change', (e) => {
            if (typeof gestorIdiomas !== 'undefined') {
                gestorIdiomas.cambiarIdioma(e.target.value);
                console.log(`🌐 Idioma cambiado a: ${e.target.value}`);
                const tabActiva = document.querySelector('.tablink.active');
                if (tabActiva) {
                    const tabId = tabActiva.dataset.tab;
                    console.log(`🔄 Recargando pestaña ${tabId} por cambio de idioma`);
                    loadTab(tabId);
                }
            }
        });
        
        console.log('✅ Selector de idiomas vinculado');
    } else {
        console.warn('⚠️ Elemento languageSelect no encontrado');
    }
});

// ===== SELECTOR DE TEMA EN HEADER =====
document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('themeSelect');
    
    if (themeSelect) {
        // Establecer el tema guardado
        const temaGuardado = localStorage.getItem('tema') || 'azul';
        themeSelect.value = temaGuardado;
        
        // Cambiar tema cuando el usuario selecciona uno nuevo
        themeSelect.addEventListener('change', (e) => {
            const nuevoTema = e.target.value;
            if (typeof gestorTemas !== 'undefined') {
                gestorTemas.cambiarTema(nuevoTema);
            }
            const tabActiva = document.querySelector('.tablink.active');
            if (tabActiva) {
                const tabId = tabActiva.dataset.tab;
                console.log(`🔄 Recargando pestaña ${tabId} por cambio de tema`);
                loadTab(tabId);
            }
            console.log(`🎨 Tema cambiado a: ${nuevoTema}`);
        });
        
        console.log('✅ Selector de temas vinculado');
    } else {
        console.warn('⚠️ Elemento themeSelect no encontrado');
    }
});

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