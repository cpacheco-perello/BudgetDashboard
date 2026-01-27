// ===== MANEJO DE PESTAÑAS =====
const buttons = document.querySelectorAll('.tablink');
const tabContent = document.getElementById('tab-content');

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
        const res = await fetch(`Pestañas/${tabId}.html`);
        const html = await res.text();
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
            if (tabId === 'impuestos') inicializarTaxes();
            if (tabId === 'dashboard') cargarDashboardForm();
            if (tabId === 'hucha') {
                if (typeof cargarHucha !== 'undefined') cargarHucha();
            }

    } catch (error) {
        console.error(`❌ Error cargando pestaña ${tabId}:`, error);
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
    loadTab('categorias');
});



// ===== MANEJO DE PERÍODOS Y RESUMEN =====
let periodoActual = '1mes';
let resumenData = null;
let cargandoResumen = false;

async function cargarResumenPeriodos() {
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
                        const resHucha = await fetch('/hucha');
                        if (resHucha.ok) {
                            const dataHucha = await resHucha.json();
                            const totalHucha = dataHucha.reduce((acc, item) => acc + (parseFloat(item.cantidad) || 0), 0);
                            hucha.textContent = formatearEuro(totalHucha);
                        } else {
                            hucha.textContent = formatearEuro(0);
                        }
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
                const btnActivo = document.querySelector(`[data-periodo="${periodoGuardado}"]`);
                if (btnActivo) {
                    document.querySelectorAll('.btn-periodo').forEach(b => b.classList.remove('active'));
                    btnActivo.classList.add('active');
                    periodoActual = periodoGuardado;
                    actualizarResumen(periodoGuardado);
                }
                setTimeout(() => btnRefresh.classList.remove('spinning'), 600);
            });
            btnRefresh.dataset.listenerAdded = 'true';
        }

        // Cargar por defecto 1 mes
        actualizarResumen('1mes');
        console.log('✅ Resumen de períodos cargado');

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