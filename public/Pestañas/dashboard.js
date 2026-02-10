
function cargarDashboardForm() {
// ===== VARIABLES GLOBALES DEL DASHBOARD =====
let filtroGastoCategoria = null;
let dashDesde = null;
let dashHasta = null;
let hoy = new Date();

const charts = {
    totales: null,
    porcentajes: null,
    ingresos: null,
    gastos: null,
    ahorros: null,
    ingresosCat: null,
    gastosCat: null,
    gastosMes: null
};

const dashboardConfig = window.dashboardConfig || {};
const endpoints = {
    ahorros: '/ahorros-mes',
    categorias: '/categorias-periodo',
    dashboard: '/dashboard',
    rangoFechas: '/dashboard-rango-fechas',
    gastosMes: '/gastos-categoria-mes',
    impuestosMes: '/impuestos-mes',
    ...(dashboardConfig.endpoints || {})
};
const realEndpoints = {
    ahorros: '/ahorros-mes-real',
    gastosMes: '/gastos-categoria-mes-real',
    ...(dashboardConfig.realEndpoints || {})
};
const dashboardFeatures = {
    showTotals: true,
    showPorcentajes: true,
    showIngresos: true,
    showGastosMes: true,
    showAhorros: true,
    showIngresosCat: true,
    showGastosCat: true,
    useCategorias: true,
    simpleMode: false,
    simpleIngresos: false,
    simpleGastos: false,
    ...(dashboardConfig.features || {})
};

let dateRangeSlider = null;
let sliderUpdateFromInputs = false;
const DASHBOARD_RANGE_STORAGE_KEY = 'dashboardDateRange';

// ===== USAR FORMATEO GLOBAL =====
// Alias para mantener compatibilidad con código existente
const formatearEuro = (monto) => {
    if (typeof window.formatCurrency === 'function') {
        return window.formatCurrency(monto, { convert: false });
    }
    if (monto === null || monto === undefined) return '€0,00';
    return '€' + parseFloat(monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function formatearFechaInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatearFechaDisplay(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function parsearFechaInput(valor) {
    if (!valor) return null;
    const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
    const date = soloFecha ? new Date(`${valor}T00:00:00`) : new Date(valor);
    return Number.isNaN(date.getTime()) ? null : date;
}

function clampFecha(date, minDate, maxDate) {
    const time = Math.min(Math.max(date.getTime(), minDate.getTime()), maxDate.getTime());
    return new Date(time);
}

function actualizarEtiquetasSlider(desde, hasta) {
    const desdeEl = document.getElementById('sliderDesdeLabel');
    const hastaEl = document.getElementById('sliderHastaLabel');
    if (desdeEl) desdeEl.textContent = desde;
    if (hastaEl) hastaEl.textContent = hasta;
}

function guardarRangoSeleccionado(desde, hasta) {
    try {
        localStorage.setItem(DASHBOARD_RANGE_STORAGE_KEY, JSON.stringify({ desde, hasta }));
    } catch (error) {
        console.warn('⚠️ No se pudo guardar el rango:', error);
    }
}

function cargarRangoSeleccionado() {
    try {
        const raw = localStorage.getItem(DASHBOARD_RANGE_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.desde || !parsed?.hasta) return null;
        return parsed;
    } catch (error) {
        return null;
    }
}

function actualizarQuickPeriodActivos() {
    const desdeDate = parsearFechaInput(dashDesde?.value);
    const hastaDate = parsearFechaInput(dashHasta?.value);
    if (!desdeDate || !hastaDate) return;

    const diffMs = hastaDate.getTime() - desdeDate.getTime();
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

    document.querySelectorAll('.quick-period-btn').forEach(b => b.classList.remove('active'));
    if (diffDays < 0) return;

    const matched = document.querySelector(`.quick-period-btn[data-days="${diffDays}"]`);
    if (matched) {
        matched.classList.add('active');
        return;
    }

    const fallback = Array.from(document.querySelectorAll('.quick-period-btn'))
        .find(b => Math.abs(parseInt(b.getAttribute('data-days'), 10) - diffDays) <= 1);
    if (fallback) fallback.classList.add('active');
}

function syncSliderWithInputs() {
    if (!dateRangeSlider || !dashDesde || !dashHasta) return;
    const desdeDate = parsearFechaInput(dashDesde.value);
    const hastaDate = parsearFechaInput(dashHasta.value);
    if (!desdeDate || !hastaDate) return;

    sliderUpdateFromInputs = true;
    dateRangeSlider.set([desdeDate.getTime(), hastaDate.getTime()]);
    sliderUpdateFromInputs = false;
    actualizarEtiquetasSlider(formatearFechaDisplay(desdeDate), formatearFechaDisplay(hastaDate));
}

async function obtenerRangoFechasDashboard() {
    try {
        if (window.electronAPI?.getDashboardRangoFechas) {
            return await window.electronAPI.getDashboardRangoFechas();
        }
        const res = await fetch(endpoints.rangoFechas);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || !data.min || !data.max) return null;
        return { min: data.min, max: data.max };
    } catch (error) {
        console.warn('⚠️ Error obteniendo rango de fechas:', error);
        return null;
    }
}

async function initDateRangeSlider() {
    const sliderEl = document.getElementById('dashboardDateRangeSlider');
    if (!sliderEl || typeof noUiSlider === 'undefined') return;

    const rango = await obtenerRangoFechasDashboard();
    let minDate = parsearFechaInput(rango?.min);
    let maxDate = parsearFechaInput(rango?.max);

    if (!minDate || !maxDate) {
        const desdeInput = parsearFechaInput(dashDesde?.value);
        const hastaInput = parsearFechaInput(dashHasta?.value);
        minDate = minDate || desdeInput || new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
        maxDate = maxDate || hastaInput || new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    }

    if (minDate > maxDate) {
        const temp = minDate;
        minDate = maxDate;
        maxDate = temp;
    }

    const rangoGuardado = cargarRangoSeleccionado();
    if (!rangoGuardado && dashDesde && dashHasta) {
        dashDesde.value = formatearFechaInput(minDate);
        dashHasta.value = formatearFechaInput(maxDate);
    }

    const desdeInicial = parsearFechaInput(dashDesde?.value) || minDate;
    const hastaInicial = parsearFechaInput(dashHasta?.value) || maxDate;
    const desdeClamped = clampFecha(desdeInicial, minDate, maxDate);
    const hastaClamped = clampFecha(hastaInicial, minDate, maxDate);

    if (sliderEl.noUiSlider) {
        sliderEl.noUiSlider.destroy();
    }

    noUiSlider.create(sliderEl, {
        start: [desdeClamped.getTime(), hastaClamped.getTime()],
        connect: true,
        step: 24 * 60 * 60 * 1000,
        range: {
            min: minDate.getTime(),
            max: maxDate.getTime()
        }
    });

    dateRangeSlider = sliderEl.noUiSlider;
    if (dashDesde) dashDesde.value = formatearFechaInput(desdeClamped);
    if (dashHasta) dashHasta.value = formatearFechaInput(hastaClamped);
    actualizarEtiquetasSlider(formatearFechaDisplay(desdeClamped), formatearFechaDisplay(hastaClamped));

    dateRangeSlider.on('update', (values) => {
        const desde = formatearFechaDisplay(new Date(Number(values[0])));
        const hasta = formatearFechaDisplay(new Date(Number(values[1])));
        actualizarEtiquetasSlider(desde, hasta);
    });

    dateRangeSlider.on('set', (values) => {
        if (sliderUpdateFromInputs) return;
        const desde = formatearFechaInput(new Date(Number(values[0])));
        const hasta = formatearFechaInput(new Date(Number(values[1])));

        if (dashDesde) dashDesde.value = desde;
        if (dashHasta) dashHasta.value = hasta;

        document.querySelectorAll('.quick-period-btn').forEach(b => b.classList.remove('active'));
        actualizarFechas();
    });
}

// ===== HANDLER PARA RECALCULAR ESTADÍSTICAS AL OCULTAR/MOSTRAR SERIES =====
function crearLegendClickHandler() {
    return function(e, legendItem, legend) {
        const chart = legend.chart;
        const index = legendItem.datasetIndex;
        
        // Comportamiento por defecto: ocultar/mostrar serie
        const meta = chart.getDatasetMeta(index);
        meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
        
        // Recalcular estadísticas si la función existe
        if (chart.updateChartStats) {
            chart.updateChartStats();
        }
        
        chart.update();
    };
}

// ===== FUNCIONES DE EVENT LISTENERS (GLOBALES) =====
function manejarClickPeriodo(e) {
    const btn = e.target.closest('.quick-period-btn');
    if (!btn) return;
    
    e.preventDefault();
    const days = parseInt(btn.getAttribute('data-days'));
    const desde = new Date();
    desde.setDate(desde.getDate() - days);

    dashDesde.value = desde.toISOString().slice(0, 10);
    dashHasta.value = hoy.toISOString().slice(0, 10);

    syncSliderWithInputs();
    guardarRangoSeleccionado(dashDesde.value, dashHasta.value);

    // Actualizar estado activo del botón
    document.querySelectorAll('.quick-period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    console.log(`📅 Período rápido: últimos ${days} días`);

    // Cargar datos
    if (dashboardFeatures.useCategorias) {
        cargarCategorias().then(() => actualizarDashboard());
    } else {
        actualizarDashboard();
    }
}

function actualizarFechas() {
    syncSliderWithInputs();
    actualizarQuickPeriodActivos();
    if (dashDesde?.value && dashHasta?.value) {
        guardarRangoSeleccionado(dashDesde.value, dashHasta.value);
    }
    if (dashboardFeatures.useCategorias) {
        cargarCategorias().then(() => actualizarDashboard());
    } else {
        actualizarDashboard();
    }
}

function manejarEnterDesde(e) {
    if (e.key === 'Enter') {
        dashDesde.blur();
    }
}

function manejarEnterHasta(e) {
    if (e.key === 'Enter') {
        dashHasta.blur();
    }
}

function manejarCambioCategoria() {
    if (!dashboardFeatures.useCategorias || !dashboardFeatures.showGastosMes) return;
    console.log('📁 Categoría seleccionada:', filtroGastoCategoria.value);
    actualizarGraficoGastosMes();
}

// ===== FUNCIONES PARA CONFIGURAR LISTENERS =====
const setupDateListeners = () => {
    const dashDesdeEl = document.getElementById('dashDesde');
    const dashHastaEl = document.getElementById('dashHasta');
    const filtroEl = document.getElementById('filtroGastoCategoria');
    const toggleRealEl = document.getElementById('dashboardToggleReal');
    
    if (dashDesdeEl) {
        dashDesdeEl.removeEventListener('blur', actualizarFechas);
        dashDesdeEl.removeEventListener('keydown', manejarEnterDesde);
        dashDesdeEl.addEventListener('blur', actualizarFechas);
        dashDesdeEl.addEventListener('keydown', manejarEnterDesde);
    }
    
    if (dashHastaEl) {
        dashHastaEl.removeEventListener('blur', actualizarFechas);
        dashHastaEl.removeEventListener('keydown', manejarEnterHasta);
        dashHastaEl.addEventListener('blur', actualizarFechas);
        dashHastaEl.addEventListener('keydown', manejarEnterHasta);
    }
    
    if (filtroEl) {
        filtroEl.removeEventListener('change', manejarCambioCategoria);
        filtroEl.addEventListener('change', manejarCambioCategoria);
    }

    if (toggleRealEl) {
        toggleRealEl.removeEventListener('change', actualizarDashboard);
        toggleRealEl.addEventListener('change', actualizarDashboard);
    }
};

const setupQuickPeriodListener = () => {
    const quickPeriodsContainer = document.querySelector('.quick-periods');
    if (quickPeriodsContainer) {
        quickPeriodsContainer.removeEventListener('click', manejarClickPeriodo);
        quickPeriodsContainer.addEventListener('click', manejarClickPeriodo);
    }
};
    function obtenerColorCategoria(categoria, index) {
        if (!coloresCategorias[categoria]) {
            coloresCategorias[categoria] = paletaColores[index % paletaColores.length];
        }
        return coloresCategorias[categoria];
    }

    // ===== Cargar categorías =====
    async function cargarCategorias() {
        if (!dashboardFeatures.useCategorias || !filtroGastoCategoria) {
            return;
        }
        const desde = document.getElementById('dashDesde').value;
        const hasta = document.getElementById('dashHasta').value;

        if (!desde || !hasta) {
            const mensaje = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.seleccionaRango') : 'Por favor selecciona un rango de fechas';
            console.warn('⚠️ ' + mensaje);
            return;
        }

        try {
            let dataCat = null;
            const resAll = await fetch('/categorias');
            if (resAll.ok) {
                dataCat = await resAll.json();
            } else {
                const resCat = await fetch(`/categorias-periodo?desde=${desde}&hasta=${hasta}`);
                dataCat = await resCat.json();
            }

            const textoTodas = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.todasCategorias') : 'Todas las categorías';
            filtroGastoCategoria.innerHTML = `<option value="">${textoTodas}</option>`;

            const gastosCategorias = Array.isArray(dataCat?.gastos)
                ? dataCat.gastos.map(c => c.nombre)
                : Object.keys(dataCat?.gastos || {});

            if (gastosCategorias.length > 0) {
                gastosCategorias.forEach((c, i) => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    filtroGastoCategoria.appendChild(opt);
                    obtenerColorCategoria(c, i);
                });
                console.log('✅ Categorías cargadas:', gastosCategorias);
            } else {
                console.warn('⚠️ No hay categorías de gastos');
            }
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
        }
    }

    // ===== DESTRUIR TODOS LOS GRÁFICOS EXISTENTES =====
    // Esto es necesario cuando se recarga el dashboard (ej: cambio de idioma)
    // Usar la API correcta de Chart.js para desregistrar gráficos
    var canvasIds = ['chartTotales', 'chartPorcentajes', 'chartIngresos', 'chartAhorros', 
                       'chartIngresosCat', 'chartGastosCat', 'chartGastosMes'];
    
    canvasIds.forEach(canvasId => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                console.log(`🗑️ Destruyendo gráfico anterior: ${canvasId}`);
                existingChart.destroy();
            }
        }
    });
    
    // Limpiar array de tracking
    if (window.chartsInstances && Array.isArray(window.chartsInstances)) {
        window.chartsInstances = [];
    }
    
    // Verificar que los elementos necesarios existan
    filtroGastoCategoria = document.getElementById('filtroGastoCategoria');
    dashDesde = document.getElementById('dashDesde');
    dashHasta = document.getElementById('dashHasta');

    if (!dashDesde || !dashHasta || (!filtroGastoCategoria && !dashboardConfig.allowMissingCategoryFilter)) {
        console.warn('⚠️ Elementos del dashboard no encontrados. Reinintentando en 100ms...');
        setTimeout(() => cargarDashboardForm(), 100);
        return;
    }

    if (dashboardConfig.hideCategoryFilter && filtroGastoCategoria) {
        filtroGastoCategoria.style.display = 'none';
    }

    const hideChartCard = (canvasId) => {
        const canvas = document.getElementById(canvasId);
        const card = canvas ? canvas.closest('.chart-card') : null;
        if (card) {
            card.style.display = 'none';
        }
    };

    if (!dashboardFeatures.showTotals) hideChartCard('chartTotales');
    if (!dashboardFeatures.showPorcentajes) hideChartCard('chartPorcentajes');
    if (!dashboardFeatures.showIngresos) hideChartCard('chartIngresos');
    if (!dashboardFeatures.showGastosMes) hideChartCard('chartGastosMes');
    if (!dashboardFeatures.showAhorros) hideChartCard('chartAhorros');
    if (!dashboardFeatures.showIngresosCat) hideChartCard('chartIngresosCategoria');
    if (!dashboardFeatures.showGastosCat) hideChartCard('chartGastosCategoria');
    
    // Inicializar array global para rastrear gráficos
    if (!window.chartsInstances) {
        window.chartsInstances = [];
    }

    // ===== Colores del tema actual =====
    let temasGraficos = {
        primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
        primaryDark: getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim(),
        success: getComputedStyle(document.documentElement).getPropertyValue('--success').trim(),
        danger: getComputedStyle(document.documentElement).getPropertyValue('--danger').trim(),
        warning: getComputedStyle(document.documentElement).getPropertyValue('--warning').trim(),
        info: getComputedStyle(document.documentElement).getPropertyValue('--info').trim()
    };

    // ===== Paleta de colores dinámica =====
    const coloresCategorias = {};
    let paletaColores = [
        temasGraficos.primary,
        temasGraficos.success,
        temasGraficos.info,
        temasGraficos.warning,
        temasGraficos.primaryDark,
        temasGraficos.danger,
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#fa709a', '#fee140'
    ];

    

    function obtenerColorCategoria(categoria, index) {
        if (!coloresCategorias[categoria]) {
            coloresCategorias[categoria] = paletaColores[index % paletaColores.length];
        }
        return coloresCategorias[categoria];
    }

    // ===== Aclarar color para fondos semitransparentes =====
    function aclararColor(color, porcentaje = 0.2) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${porcentaje})`;
    }

function calcularMedia(arr) {
    const validos = arr.filter(v => !isNaN(v));
    if (validos.length === 0) return 0;
    return validos.reduce((a, b) => a + b, 0) / validos.length;
}

function calcularVarianza(arr) {
    const validos = arr.filter(v => !isNaN(v));
    const n = validos.length;
    if (n <= 1) return 0;

    const media = calcularMedia(validos);

    // Varianza muestral (n - 1) → correcta para análisis financiero
    const suma = validos.reduce((acc, val) => {
        return acc + Math.pow(val - media, 2);
    }, 0);

    return suma / (n - 1);
}


function calcularDesviacion(arr) {
    return Math.sqrt(calcularVarianza(arr));
}

// ===== FUNCIONES AUXILIARES PARA CREAR GRÁFICOS =====
function crearOpcionesGrafico(optComun, titulo, apilado = false, conLegend = true) {
    const opciones = {
        ...optComun,
        plugins: {
            ...optComun.plugins,
            legend: {
                ...optComun.plugins.legend,
                onClick: crearLegendClickHandler()
            },
            title: {
                display: true,
                text: titulo,
                font: { size: 13, weight: '600' },
                padding: { top: 5, bottom: 10 }
            }
        }
    };
    
    if (apilado) {
        opciones.scales = {
            ...optComun.scales,
            x: { ...optComun.scales.x, stacked: true },
            y: { ...optComun.scales.y, stacked: true }
        };
    }
    
    return opciones;
}

function crearDataset(label, data, color, apilado = false) {
    return {
        label,
        data,
        backgroundColor: aclararColor(color, 0.7),
        borderColor: color,
        borderWidth: apilado ? 2 : 3,
        borderRadius: 6,
        tension: 0.4,
        fill: !apilado
    };
}

function crearUpdateChartStats(datosOriginales, calcularFn) {
    return function() {
        const datos = calcularFn.call(this, datosOriginales);
        this.options.plugins.title.text = datos.titulo;
    };
}

function actualizarIndicadorGastosDonut(mostrar, labelBudget, labelReal) {
    const canvas = document.getElementById('chartGastosCategoria');
    const card = canvas ? canvas.closest('.chart-card') : null;
    if (!card) return;

    const indicator = card.querySelector('.ring-indicator');
    if (indicator) indicator.remove();
}

// ===== Función para obtener labels traducidos =====
function obtenerLabelsTraducidos() {
    const textos = {
        ingresos: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.ingresos') : 'Ingresos',
        gastos: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.gastos') : 'Gastos',
        ahorros: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.ahorros') : 'Ahorros',
        impuestosTotales: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('resumen.totalImpuestos') : 'Total Impuestos',
        impuestosCategoria: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.impuestosCategoria') : 'Impuestos',
        ingresosPorCategoria: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.ingresosPorCategoria') : 'Ingresos por Categoría',
        gastosPorCategoria: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.gastosPorCategoria') : 'Gastos por Categoría',
        media: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.media') : 'Media',
        varianza: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.varianza') : 'Varianza',
        desviacion: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.desviacion') : 'Desviación',
        desviacionAbrev: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.desviacionAbrev') : 'Desv',
        mediaTotal: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.mediaTotal') : 'Media Total',
        mediaMensualTotal: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.mediaMensualTotal') : 'Media mensual total',
        cuentasRemuneradas: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.cuentasRemuneradas') : 'Cuentas Remuneradas',
        impuestosIngresos: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.impuestosIngresos') : 'Impuestos (ingresos)',
        impuestosOtros: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.impuestosOtros') : 'Impuestos (otros)'
    };
    return textos;
}

    // ===== Actualizar dashboard =====
    async function actualizarDashboard() {

        const desde = document.getElementById('dashDesde').value;
        const hasta = document.getElementById('dashHasta').value;
        const catSel = filtroGastoCategoria ? filtroGastoCategoria.value : '';

        if (!desde || !hasta) {
            const mensaje = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.seleccionaRango') : 'Por favor selecciona un rango de fechas';
            console.warn('⚠️ ' + mensaje);
            return;
        }

        // Control: hasta no puede ser menor que desde
        if (hasta < desde) {
            const mensajeError = typeof gestorIdiomas !== 'undefined' && gestorIdiomas 
                ? gestorIdiomas.obtenerTexto('dashboard.errorHastaMenorDesde')
                : 'La fecha "hasta" no puede ser menor que "desde"';
            console.warn('⚠️ ' + mensajeError);
            showAlert(mensajeError);
            return;
        }

        console.log(`📊 Actualizando dashboard de ${desde} a ${hasta}`);
        
        // Mostrar loader
        const loader = document.getElementById('dashboardLoader');
        if (loader) {
            loader.classList.remove('hidden');
        }

        try {
            // ⚡ Paralelizar todas las llamadas fetch para mayor velocidad
            const showReales = document.getElementById('dashboardToggleReal')?.checked;
            const [resTotales, resCat, resDashboard, resGastoMes, resImpuestosMes, resAhorrosReal, resGastosMesReal] = await Promise.all([
                fetch(`${endpoints.ahorros}?desde=${desde}&hasta=${hasta}`),
                fetch(`${endpoints.categorias}?desde=${desde}&hasta=${hasta}`),
                fetch(endpoints.dashboard),
                fetch(`${endpoints.gastosMes}?desde=${desde}&hasta=${hasta}`),
                fetch(`${endpoints.impuestosMes}?desde=${desde}&hasta=${hasta}`),
                showReales ? fetch(`${realEndpoints.ahorros}?desde=${desde}&hasta=${hasta}`) : Promise.resolve(null),
                showReales ? fetch(`${realEndpoints.gastosMes}?desde=${desde}&hasta=${hasta}`) : Promise.resolve(null)
            ]);
            
            if (!resTotales.ok) {
                throw new Error(`Error ${resTotales.status}: ${resTotales.statusText}`);
            }
            
            // Parsear todas las respuestas en paralelo
            const [dataTotales, dataCat, dataDashboard, dataGastoMes, dataImpuestosMes, dataAhorrosReal, dataGastosMesReal] = await Promise.all([
                resTotales.json(),
                resCat.json(),
                resDashboard.json(),
                resGastoMes.json(),
                resImpuestosMes.json(),
                resAhorrosReal ? resAhorrosReal.json() : Promise.resolve(null),
                resGastosMesReal ? resGastosMesReal.json() : Promise.resolve(null)
            ]);
            
            if (!Array.isArray(dataTotales) || dataTotales.length === 0) {
                console.warn('⚠️ No hay datos para este período');
                return;
            }

            const totalIngresos = dataTotales.reduce((sum, m) => sum + (m.ingresos || 0), 0); // Suma ingresos netos
            const totalGastos = dataTotales.reduce((sum, m) => sum + (m.gastos || 0), 0); // Suma gastos tabla
            const totalCuentasRemuneradas = dataTotales.reduce((sum, m) => sum + (m.cuentas_remuneradas || 0), 0); // Suma intereses generados de cuentas remuneradas
            const totalAhorros = dataTotales.reduce((sum, m) => sum + (m.ahorros || 0), 0); // Suma ahorros como (ingresos + cuentas_remuneradas) - gastos - impuestos_otros

            const meses = dataTotales.map(m => m.mes);
            const ingresosMes = dataTotales.map(m => m.ingresos || 0);
            const cuentasRemuneradasMes = dataTotales.map(m => m.cuentas_remuneradas || 0);
            const gastosMes = dataTotales.map(m => m.gastos || 0);
            const ahorrosMes = dataTotales.map(m => m.ahorros || 0);

            const ingresosRealesMes = Array.isArray(dataAhorrosReal) ? dataAhorrosReal.map(m => m.ingresos || 0) : [];
            const gastosRealesMes = Array.isArray(dataAhorrosReal) ? dataAhorrosReal.map(m => m.gastos || 0) : [];
            const ahorrosRealesMes = Array.isArray(dataAhorrosReal) ? dataAhorrosReal.map(m => m.ahorros || 0) : [];

            // Categorías (ya cargadas en paralelo)
            const catIngresos = Object.keys(dataCat.ingresos || {});
            const valIngresos = Object.values(dataCat.ingresos || {});
            const catGastos = Object.keys(dataCat.gastos || {});
            const valGastos = Object.values(dataCat.gastos || {});

            // Cuentas remuneradas (ya cargadas en paralelo)
            const cuentasRemuneradasPorCategoria = {};
            const cuentaRemunerada = Array.isArray(dataDashboard?.cuenta_remunerada) ? dataDashboard.cuenta_remunerada : [];
            cuentaRemunerada.forEach(cr => {
                const crDesde = new Date(cr.desde + "-28");
                const crHasta = cr.hasta ? new Date(cr.hasta + "-28") : new Date(9999,11,31);
                const desdeDate = new Date(desde);
                const hastaDate = new Date(hasta);
                
                // Calcular el solapamiento entre el período de la cuenta y el período seleccionado
                const overlapDesde = desdeDate > crDesde ? desdeDate : crDesde;
                const overlapHasta = hastaDate < crHasta ? hastaDate : crHasta;
                
                // Verificar si hay solapamiento con el período
                if (overlapDesde <= overlapHasta) {
                    const categoriaKey = cr.categoria;
                    // Calcular los días totales del período de la cuenta
                    const diasTotalCuenta = Math.max(1, Math.floor((crHasta - crDesde) / (1000 * 60 * 60 * 24)));
                    // Calcular los días de solapamiento
                    const diasSolapamiento = Math.max(1, Math.floor((overlapHasta - overlapDesde) / (1000 * 60 * 60 * 24)));
                    // Calcular los intereses proporcionales al período seleccionado
                    const interesProporcional = (cr.interes_generado || 0) * (diasSolapamiento / diasTotalCuenta);
                    
                    cuentasRemuneradasPorCategoria[categoriaKey] = (cuentasRemuneradasPorCategoria[categoriaKey] || 0) + interesProporcional;
                }
            });

            // Gastos por mes (ya cargados en paralelo)
            const labelsMeses = dashboardFeatures.simpleGastos ? meses : Object.keys(dataGastoMes).sort();
            let datasetsMesCat = [];

            // Verificar si existe "taxes" en los datos y agregarlo al select si no está
            const tieneImpuestos = labelsMeses.some(m => dataGastoMes[m]['taxes']);
            if(tieneImpuestos) {
                const taxesOption = document.querySelector('option[value="taxes"]');
                if(!taxesOption) {
                    const opt = document.createElement('option');
                    opt.value = 'taxes';
                    const textoImpuestos = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.impuestosCategoria') : 'Impuestos';
                    opt.textContent = textoImpuestos;
                    filtroGastoCategoria.appendChild(opt);
                    obtenerColorCategoria('taxes', coloresCategorias.size || 0);
                    coloresCategorias['taxes'] = temasGraficos.warning;
                }
            }

            if(catSel){ 
                const data = labelsMeses.map(m => dataGastoMes[m]?.[catSel] || 0);
                const labelCategoria = catSel === 'taxes'
                    ? (typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.impuestosCategoria') : 'Impuestos')
                    : catSel;
                datasetsMesCat.push({ 
                    label: labelCategoria, 
                    data, 
                    backgroundColor: aclararColor(coloresCategorias[catSel], 0.7),
                    borderColor: coloresCategorias[catSel],
                    borderWidth: 2,
                    borderRadius: 6,
                    tension: 0.4,
                    stack: showReales ? 'main' : undefined
                });
            }
            else {
                const categoriasSet = new Set();
                labelsMeses.forEach(m => {
                    if (dataGastoMes[m]) {
                        Object.keys(dataGastoMes[m]).forEach(c => categoriasSet.add(c));
                    }
                });
                Array.from(categoriasSet).forEach((c,i)=>{
                    const data = labelsMeses.map(m => dataGastoMes[m]?.[c] || 0);
                    let color = coloresCategorias[c];
                    if(!color) {
                        if(c === 'taxes') {
                            color = temasGraficos.warning;
                            coloresCategorias['taxes'] = color;
                        } else {
                            color = obtenerColorCategoria(c,i);
                        }
                    }
                    const labelCategoria = c === 'taxes'
                        ? (typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.impuestosCategoria') : 'Impuestos')
                        : c;
                    datasetsMesCat.push({ 
                        label: labelCategoria, 
                        data, 
                        backgroundColor: aclararColor(color, 0.7),
                        borderColor: color,
                        borderWidth: 2,
                        borderRadius: 6,
                        tension: 0.4,
                        stack: showReales ? 'main' : undefined
                    });
                });
            }

            if (showReales && catSel !== 'taxes') {
                const sufijoReal = typeof gestorIdiomas !== 'undefined'
                    ? gestorIdiomas.obtenerTexto('dashboard.realesSuffix')
                    : 'Real';

                if (catSel) {
                    const realData = labelsMeses.map(m => dataGastosMesReal?.[m]?.[catSel] || 0);
                    const color = coloresCategorias[catSel] || temasGraficos.primaryDark || '#475569';
                    const labelCategoria = `${catSel} (${sufijoReal})`;

                    datasetsMesCat.push({
                        label: labelCategoria,
                        data: realData,
                        backgroundColor: aclararColor(color, 0.45),
                        borderColor: color,
                        borderWidth: 2,
                        borderRadius: 6,
                        tension: 0.4,
                        stack: 'real'
                    });
                } else {
                    const categoriasRealSet = new Set();
                    labelsMeses.forEach(m => {
                        if (dataGastosMesReal?.[m]) {
                            Object.keys(dataGastosMesReal[m]).forEach(c => categoriasRealSet.add(c));
                        }
                    });

                    Array.from(categoriasRealSet).forEach((c, i) => {
                        if (c === 'taxes') return;
                        const data = labelsMeses.map(m => dataGastosMesReal?.[m]?.[c] || 0);
                        const color = coloresCategorias[c] || obtenerColorCategoria(c, i);
                        const labelCategoria = `${c} (${sufijoReal})`;

                        datasetsMesCat.push({
                            label: labelCategoria,
                            data,
                            backgroundColor: aclararColor(color, 0.45),
                            borderColor: color,
                            borderWidth: 2,
                            borderRadius: 6,
                            tension: 0.4,
                            stack: 'real'
                        });
                    });
                }
            }

            // Destruir gráficos previos
            Object.values(charts).forEach(chart => {
                if (chart) {
                    try {
                        chart.destroy();
                    } catch (e) {
                        console.warn('⚠️ Error destruyendo gráfico:', e);
                    }
                }
            });

            // Opciones comunes para todos los gráficos
            const optComun = {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        display: true, 
                        position: 'bottom',
                        labels: {
                            color: '#333',
                            font: { size: 12, weight: '600' },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 },
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(ctx) {
                                return formatearEuro(ctx.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: { 
                            color: '#666', 
                            font: { size: 11 },
                            callback: function(value) {
                                return formatearEuro(value);
                            }
                        },
                        grid: { color: 'rgba(0, 0, 0, 0.19)' }
                    },
                    x: {
                        ticks: { color: '#666', font: { size: 11 } },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    }
                }
            };

            // ===== OBTENER IMPUESTOS POR MES (ya cargados en paralelo) =====
            const impuestosMes = (Array.isArray(dataImpuestosMes) ? dataImpuestosMes : []).map(m => m.impuestos || 0); 
            const totalImpuestosIngresos = impuestosMes.reduce((sum, m) => sum + m, 0);
            
            // ===== OBTENER IMPUESTOS STANDALONE (de tablas impuestos_puntuales/mensuales) =====  
            const totalImpuestosStandalone = dashboardFeatures.simpleMode ? 0 : labelsMeses.reduce((sum, mes) => { 
                return sum + (dataGastoMes[mes]?.['taxes'] || 0);
            }, 0);

            const labelsTraducidos = obtenerLabelsTraducidos();

            if (dashboardFeatures.simpleMode) {
                const mediaIngresos = calcularMedia(ingresosMes);
                const desvIngresos = calcularDesviacion(ingresosMes);
                const tituloIngresos = `${labelsTraducidos.media}: ${formatearEuro(mediaIngresos)}   |   ${labelsTraducidos.desviacion}: ${formatearEuro(desvIngresos)}`;

                charts.ingresos = new Chart(document.getElementById('chartIngresos'), {
                    type: 'bar',
                    data: {
                        labels: meses,
                        datasets: [crearDataset(labelsTraducidos.ingresos + ' €', ingresosMes, temasGraficos.success, false)]
                    },
                    options: crearOpcionesGrafico(optComun, tituloIngresos, false)
                });
                window.chartsInstances.push(charts.ingresos);

                const mediaGastos = calcularMedia(gastosMes);
                const desvGastos = calcularDesviacion(gastosMes);
                const tituloGastos = `${labelsTraducidos.media}: ${formatearEuro(mediaGastos)}   |   ${labelsTraducidos.desviacion}: ${formatearEuro(desvGastos)}`;

                charts.gastosMes = new Chart(document.getElementById('chartGastosMes'), {
                    type: 'bar',
                    data: {
                        labels: meses,
                        datasets: [crearDataset(labelsTraducidos.gastos + ' €', gastosMes, temasGraficos.danger, false)]
                    },
                    options: crearOpcionesGrafico(optComun, tituloGastos, false)
                });
                window.chartsInstances.push(charts.gastosMes);

                const mediaAhorros = calcularMedia(ahorrosMes);
                const desviacionAhorros = calcularDesviacion(ahorrosMes);
                const tituloAhorros = `${labelsTraducidos.media}: ${formatearEuro(mediaAhorros)}   |   ${labelsTraducidos.desviacion}: ${formatearEuro(desviacionAhorros)}`;

                charts.ahorros = new Chart(document.getElementById('chartAhorros'), {
                    type: 'bar',
                    data: {
                        labels: meses,
                        datasets: [crearDataset(labelsTraducidos.ahorros + ' €', ahorrosMes, temasGraficos.info, false)]
                    },
                    options: crearOpcionesGrafico(optComun, tituloAhorros, false)
                });
                window.chartsInstances.push(charts.ahorros);

                if (loader) {
                    loader.classList.add('hidden');
                }
                return;
            }

            // ===== GRÁFICO TOTALES =====
            
            const labelIncomeBruto = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.incomeBruto') : 'Income Bruto';
            const labelGastosImpOtros = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.gastosImpuestosOtros') : 'Gastos + Impuestos (otros)';
            
            charts.totales = new Chart(document.getElementById('chartTotales'), {
                type:'bar',
                data:{
                    labels:[labelIncomeBruto, labelGastosImpOtros, labelsTraducidos.ahorros],
                    datasets:[
                        {
                            label: labelsTraducidos.ingresos,
                            data:[totalIngresos, 0, 0],
                            backgroundColor: temasGraficos.success,
                            borderColor: temasGraficos.success,
                            borderWidth: 2,
                            borderRadius: 8,
                            stack: showReales ? 'main' : undefined
                        },
                        {
                            label: labelsTraducidos.cuentasRemuneradas,
                            data:[totalCuentasRemuneradas, 0, 0],
                            backgroundColor: temasGraficos.primary,
                            borderColor: temasGraficos.primary,
                            borderWidth: 2,
                            borderRadius: 8,
                            stack: showReales ? 'main' : undefined
                        },
                        {
                            label: labelsTraducidos.impuestosIngresos,
                            data:[totalImpuestosIngresos, 0, 0],
                            backgroundColor: temasGraficos.warning,
                            borderColor: temasGraficos.warning,
                            borderWidth: 2,
                            borderRadius: 8,
                            stack: showReales ? 'main' : undefined
                        },
                        {
                            label: labelsTraducidos.gastos,
                            data:[0, totalGastos, 0],
                            backgroundColor: temasGraficos.danger,
                            borderColor: temasGraficos.danger,
                            borderWidth: 2,
                            borderRadius: 8,
                            stack: showReales ? 'main' : undefined
                        },
                        {
                            label: labelsTraducidos.impuestosOtros,
                            data:[0, totalImpuestosStandalone, 0],
                            backgroundColor: '#e7a33c',
                            borderColor: '#e7a33c',
                            borderWidth: 2,
                            borderRadius: 8,
                            stack: showReales ? 'main' : undefined
                        },
                        {
                            label: labelsTraducidos.ahorros,
                            data:[0, 0, totalAhorros],
                            backgroundColor: temasGraficos.info,
                            borderColor: temasGraficos.info,
                            borderWidth: 2,
                            borderRadius: 8,
                            stack: showReales ? 'main' : undefined
                        }
                    ]
                },
                options:{ 
                    ...optComun, 
                    plugins:{ 
                        ...optComun.plugins, 
                        legend:{ display:true, position: 'bottom' }
                    },
                    scales: {
                        ...optComun.scales,
                        x: { ...optComun.scales.x, stacked: true },
                        y: { ...optComun.scales.y, stacked: true }
                    }
                }
            });
            window.chartsInstances.push(charts.totales);

            // ===== GRÁFICO DE PORCENTAJES =====
            const incomeBruto = totalIngresos + totalCuentasRemuneradas + totalImpuestosIngresos;
            const incomeNeto = totalIngresos + totalCuentasRemuneradas;
            const gastosTotal = totalGastos  ;
            
            // Calcular porcentajes para Ingreso Bruto
            const porcentajeAhorroBruto = incomeBruto > 0 ? (totalAhorros / incomeBruto * 100) : 0;
            const porcentajeGastosBruto = incomeBruto > 0 ? (totalGastos / incomeBruto * 100) : 0;
            const porcentajeImpuestosIngresos = incomeBruto > 0 ? (totalImpuestosIngresos / incomeBruto * 100) : 0;
            const porcentajeImpuestosStandaloneBruto = incomeBruto > 0 ? (totalImpuestosStandalone / incomeBruto * 100) : 0;
            
            // Calcular porcentajes para Ingreso Neto
            const porcentajeAhorroNeto = incomeNeto > 0 ? (totalAhorros / incomeNeto * 100) : 0;
            const porcentajeGastosNeto = incomeNeto > 0 ? (totalGastos / incomeNeto * 100) : 0;
            const porcentajeImpuestosStandaloneNeto = incomeNeto > 0 ? (totalImpuestosStandalone / incomeNeto * 100) : 0;
            
            const labelIngresoBruto = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.ingresoBruto') : 'Ingreso Bruto';
            const labelIngresoNeto = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.ingresoNeto') : 'Ingreso Neto';
            const labelAhorro = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.ahorros') : 'Ahorro';
            const labelGastos = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.gastos') : 'Gastos';
            const labelImpRetenciones = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.impuestosRetenciones') : 'Imp. Retenciones';
            const labelImpOtros = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.impuestosOtrosCorto') : 'Imp. Otros';
            
            // Guardar datos para el tooltip en el contexto del chart
            const porcentajesData = {
                totalAhorros: totalAhorros,
                totalGastos: totalGastos,
                totalImpuestosIngresos: totalImpuestosIngresos,
                totalImpuestosStandalone: totalImpuestosStandalone,
                incomeBruto: incomeBruto,
                incomeNeto: incomeNeto
            };

            charts.porcentajes = new Chart(document.getElementById('chartPorcentajes'), {
                type: 'bar',
                data: {
                    labels: [labelIngresoBruto, labelIngresoNeto],
                    datasets: [
                        {
                            label: labelAhorro,
                            data: [porcentajeAhorroBruto, porcentajeAhorroNeto],
                            backgroundColor: temasGraficos.info,
                            borderColor: temasGraficos.info,
                            borderWidth: 2,
                            borderRadius: 8
                        },
                        {
                            label: labelGastos,
                            data: [porcentajeGastosBruto, porcentajeGastosNeto],
                            backgroundColor: temasGraficos.danger,
                            borderColor: temasGraficos.danger,
                            borderWidth: 2,
                            borderRadius: 8
                        },
                        {
                            label: labelImpRetenciones,
                            data: [porcentajeImpuestosIngresos, 0],
                            backgroundColor: temasGraficos.warning,
                            borderColor: temasGraficos.warning,
                            borderWidth: 2,
                            borderRadius: 8
                        },
                        {
                            label: labelImpOtros,
                            data: [porcentajeImpuestosStandaloneBruto, porcentajeImpuestosStandaloneNeto],
                            backgroundColor: '#e7a33c',
                            borderColor: '#e7a33c',
                            borderWidth: 2,
                            borderRadius: 8
                        }
                    ]
                },
                options: {
                    indexAxis: 'y', // Barras horizontales
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'bottom',
                            labels: {
                                color: '#333',
                                font: { size: 11, weight: '600' },
                                padding: 10,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderWidth: 1,
                            callbacks: {
                                label: function(ctx) {
                                    const label = ctx.dataset.label || '';
                                    const porcentaje = ctx.parsed.x || 0;
                                    const datasetIndex = ctx.datasetIndex; // 0=Ahorro, 1=Gastos, 2=ImpRet, 3=ImpOtros
                                    const labelIndex = ctx.dataIndex; // 0=Bruto, 1=Neto
                                    const datos = ctx.chart.porcentajesData;
                                    
                                    // Calcular monto según dataset y categoría
                                    let monto = 0;
                                    
                                    if (datasetIndex === 0) { // Ahorro
                                        monto = datos.totalAhorros;
                                    } else if (datasetIndex === 1) { // Gastos
                                        monto = datos.totalGastos;
                                    } else if (datasetIndex === 2) { // Impuestos Retenciones
                                        monto = labelIndex === 0 ? datos.totalImpuestosIngresos : 0;
                                    } else if (datasetIndex === 3) { // Impuestos Otros
                                        monto = datos.totalImpuestosStandalone;
                                    }
                                    
                                    return `${label}: ${porcentaje.toFixed(1)}% (${formatearEuro(monto)})`;
                                }
                            }
                        },
                        title: {
                            display: true,
                            font: { size: 11, weight: '600' },
                            padding: { top: 5, bottom: 10 }
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            min: 0,
                            max: 100,
                            ticks: { 
                                color: '#666', 
                                font: { size: 11 },
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            grid: { color: 'rgba(0, 0, 0, 0.1)' }
                        },
                        y: {
                            stacked: true,
                            ticks: { 
                                color: '#666', 
                                font: { size: 11 }
                            },
                            grid: { display: false }
                        }
                    }
                }
            });
            // Asignar datos al chart para acceso desde callbacks
            charts.porcentajes.porcentajesData = porcentajesData;
            window.chartsInstances.push(charts.porcentajes);


            // ===== GRÁFICO INGRESOS POR MES =====

            // Media y varianza
            const mediaIngresos = calcularMedia(ingresosMes);
            const mediaCuentasRemuneradas = calcularMedia(cuentasRemuneradasMes);
            const mediaImpuestosMes = calcularMedia(impuestosMes);
            const mediaTotalIngresos = mediaIngresos + mediaCuentasRemuneradas + mediaImpuestosMes;
            // Calcular desviación sobre la suma de los tres
            const sumaTotalPorMes = ingresosMes.map((ing, idx) => ing + cuentasRemuneradasMes[idx] + impuestosMes[idx]);
            const varianzaIngresos = calcularDesviacion(sumaTotalPorMes);

            const tituloIngresos = `${labelsTraducidos.media}: ${formatearEuro(mediaTotalIngresos)} | ${labelsTraducidos.desviacion}: ${formatearEuro(varianzaIngresos)}`;
            
            const labelIngresosReales = typeof gestorIdiomas !== 'undefined'
                ? gestorIdiomas.obtenerTexto('dashboard.ingresosReales')
                : 'Ingresos Reales';

            charts.ingresos = new Chart(document.getElementById('chartIngresos'), {
                type: 'bar',
                data: {
                    labels: meses,
                    datasets: [
                        crearDataset(labelsTraducidos.ingresos + ' €', ingresosMes, temasGraficos.success, true),
                        crearDataset(labelsTraducidos.cuentasRemuneradas + ' €', cuentasRemuneradasMes, temasGraficos.primary, true),
                        crearDataset(labelsTraducidos.impuestosCategoria + ' €', impuestosMes, temasGraficos.warning, true)
                    ]
                },
                options: crearOpcionesGrafico(optComun, tituloIngresos, true)
            });

            if (showReales) {
                const realColor = temasGraficos.primaryDark || '#475569';
                charts.ingresos.data.datasets.forEach(ds => ds.stack = 'main');
                charts.ingresos.data.datasets.push({
                    label: labelIngresosReales,
                    data: ingresosRealesMes,
                    backgroundColor: aclararColor(realColor, 0.6),
                    borderColor: realColor,
                    borderWidth: 2,
                    borderRadius: 6,
                    tension: 0.4,
                    stack: 'real'
                });
                charts.ingresos.update();
            }
            
            charts.ingresos.updateChartStats = function() {
                const visibleIngresos = this.isDatasetVisible(0) ? ingresosMes : ingresosMes.map(() => 0);
                const visibleCuentas = this.isDatasetVisible(1) ? cuentasRemuneradasMes : cuentasRemuneradasMes.map(() => 0);
                const visibleImpuestos = this.isDatasetVisible(2) ? impuestosMes : impuestosMes.map(() => 0);
                
                const sumaTotalVisiblePorMes = visibleIngresos.map((ing, idx) => ing + visibleCuentas[idx] + visibleImpuestos[idx]);
                const mediaTot = calcularMedia(visibleIngresos) + calcularMedia(visibleCuentas) + calcularMedia(visibleImpuestos);
                const desv = calcularDesviacion(sumaTotalVisiblePorMes);
                
                this.options.plugins.title.text = `${labelsTraducidos.mediaTotal}: ${formatearEuro(mediaTot)} | ${labelsTraducidos.desviacionAbrev}: ${formatearEuro(desv)}`;
            };
            
            window.chartsInstances.push(charts.ingresos);

// Calcular media y desviación
const mediaAhorros = calcularMedia(ahorrosMes);
const desviacionAhorros = calcularDesviacion(ahorrosMes);

const tituloAhorros = `${labelsTraducidos.media}: ${formatearEuro(mediaAhorros)}   |   ${labelsTraducidos.desviacion}: ${formatearEuro(desviacionAhorros)}`;

const labelAhorrosReales = typeof gestorIdiomas !== 'undefined'
    ? gestorIdiomas.obtenerTexto('dashboard.ahorrosReales')
    : 'Ahorros Reales';

const datasetsAhorros = [crearDataset(labelsTraducidos.ahorros + ' €', ahorrosMes, temasGraficos.info, false)];
if (showReales) {
    const realColor = temasGraficos.primaryDark || '#475569';
    datasetsAhorros.push({
        label: labelAhorrosReales,
        data: ahorrosRealesMes,
        backgroundColor: aclararColor(realColor, 0.6),
        borderColor: realColor,
        borderWidth: 2,
        borderRadius: 6,
        tension: 0.4
    });
}

charts.ahorros = new Chart(document.getElementById('chartAhorros'), {
    type: 'bar',
    data: {
        labels: meses,
        datasets: datasetsAhorros
    },
    options: crearOpcionesGrafico(optComun, tituloAhorros, false)
});

charts.ahorros.updateChartStats = function() {
    const visibleAhorros = this.isDatasetVisible(0) ? ahorrosMes : [];
    const mediaAh = calcularMedia(visibleAhorros);
    const desvAh = calcularDesviacion(visibleAhorros);
    this.options.plugins.title.text = `${labelsTraducidos.media}: ${formatearEuro(mediaAh)}   |   ${labelsTraducidos.desviacion}: ${formatearEuro(desvAh)}`;
};

            window.chartsInstances.push(charts.ahorros);


            // ===== GRÁFICO INGRESOS POR CATEGORÍA DONUT =====
            // Combinar ingresos y cuentas remuneradas en el mismo arco
            const todasLasCategoriasIngresos = new Set([...catIngresos, ...Object.keys(cuentasRemuneradasPorCategoria)]);
            const valIngresosTotal = Array.from(todasLasCategoriasIngresos).map(cat => {
                const ingresos = valIngresos.find((v,i) => catIngresos[i] === cat) || 0;
                const cuentasRem = cuentasRemuneradasPorCategoria[cat] || 0;
                return ingresos + cuentasRem;
            });
            
            // Crear tooltips personalizados para mostrar desglose
            const ingresosPorCat = {};
            const cuentasRemPorCat = {};
            Array.from(todasLasCategoriasIngresos).forEach(cat => {
                ingresosPorCat[cat] = valIngresos.find((v,i) => catIngresos[i] === cat) || 0;
                cuentasRemPorCat[cat] = cuentasRemuneradasPorCategoria[cat] || 0;
            });
            
            const labelTotalIngresos = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.totalIngresos') : 'Total Ingresos';
            
            charts.ingresosCat = new Chart(document.getElementById('chartIngresosCategoria'), {
                type:'doughnut',
                data:{
                    labels:Array.from(todasLasCategoriasIngresos),
                    datasets:[
                        {
                            label: labelTotalIngresos,
                            data:valIngresosTotal, 
                            backgroundColor: Array.from(todasLasCategoriasIngresos).map((c,i)=>obtenerColorCategoria(c,i)),
                            borderColor: '#fff',
                            borderWidth: 2
                        }
                    ]
                },
                options:{
                    ...optComun,
                    scales: { x: { display: false }, y: { display: false } },
                    plugins:{
                        ...optComun.plugins,
                        legend:{ position:'bottom' },
                        tooltip:{ 
                            callbacks:{ 
                                label:function(ctx){ 
                                    const categoria = ctx.label;
                                    const ingresos = ingresosPorCat[categoria] || 0;
                                    const cuentasRem = cuentasRemPorCat[categoria] || 0;
                                    const total = valIngresosTotal.reduce((a,b)=>a+b,0);
                                    const perc=((ctx.raw/total)*100).toFixed(1);
                                    
                                    const textoTotal = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.total') : 'Total';
                                    const textoIngresos = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.ingresos') : 'Ingresos';
                                    const textoCuentasRem = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.cuentasRemuneradasAbrev') : 'Cuentas Rem';
                                    
                                    let tooltip = `${textoTotal}: ${formatearEuro(ctx.raw)} (${perc}%)`;
                                    if (ingresos > 0) tooltip += `\n${textoIngresos}: ${formatearEuro(ingresos)}`;
                                    if (cuentasRem > 0) tooltip += `\n${textoCuentasRem}: ${formatearEuro(cuentasRem)}`;
                                    return tooltip;
                                }
                            }
                        },
                        datalabels: {
                            color: '#fff',
                            font: { weight: 'bold', size: 12 },
                            formatter: (value, ctx) => {
                                const total = valIngresosTotal.reduce((a,b)=>a+b,0);
                                const perc = ((value / total) * 100).toFixed(1);
                                return perc + '%';
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
            window.chartsInstances.push(charts.ingresosCat);

            // ===== GRÁFICO GASTOS POR CATEGORÍA DONUT =====
            const gastosRealesPorCategoria = {};
            if (showReales && dataGastosMesReal) {
                Object.values(dataGastosMesReal).forEach((mesData) => {
                    if (!mesData) return;
                    Object.entries(mesData).forEach(([cat, val]) => {
                        gastosRealesPorCategoria[cat] = (gastosRealesPorCategoria[cat] || 0) + (val || 0);
                    });
                });
            }

            const categoriasGastosSet = new Set([
                ...catGastos,
                ...Object.keys(gastosRealesPorCategoria)
            ]);
            const gastosLabels = Array.from(categoriasGastosSet);
            const gastosBudgetData = gastosLabels.map(cat => {
                const idx = catGastos.indexOf(cat);
                return idx >= 0 ? (valGastos[idx] || 0) : 0;
            });
            const gastosRealData = gastosLabels.map(cat => gastosRealesPorCategoria[cat] || 0);

            const labelGastosBudget = typeof gestorIdiomas !== 'undefined'
                ? gestorIdiomas.obtenerTexto('dashboard.gastos')
                : 'Gastos';
            const labelGastosReal = typeof gestorIdiomas !== 'undefined'
                ? gestorIdiomas.obtenerTexto('dashboard.gastosReales')
                : 'Gastos Reales';

            const datasetsGastosDonut = [{
                label: labelGastosBudget,
                data: gastosBudgetData,
                backgroundColor: gastosLabels.map((c, i) => obtenerColorCategoria(c, i)),
                borderColor: '#fff',
                borderWidth: 0,
                spacing: 0,
                radius: '100%',
                cutout: showReales ? '30%' : '55%'
            }];

            if (showReales) {
                datasetsGastosDonut.push({
                    label: labelGastosReal,
                    data: gastosRealData,
                    backgroundColor: gastosLabels.map((c, i) => aclararColor(obtenerColorCategoria(c, i), 0.55)),
                    borderColor: '#fff',
                    borderWidth: 0,
                    spacing: 0,
                    radius: '100%',
                    cutout: '0%'
                });
            }

            charts.gastosCat = new Chart(document.getElementById('chartGastosCategoria'), {
                type:'doughnut',
                data:{
                    labels: gastosLabels,
                    datasets: datasetsGastosDonut
                },
                options:{
                    ...optComun,
                    scales: { x: { display: false }, y: { display: false } },
                    plugins:{
                        ...optComun.plugins,
                        legend:{ position:'bottom' },
                        tooltip:{ 
                            callbacks:{ 
                                label:function(ctx){ 
                                    const total = ctx.dataset.data.reduce((a,b)=>a+b,0); 
                                    const perc = total > 0 ? ((ctx.raw/total)*100).toFixed(1) : '0.0';
                                    const prefijo = ctx.dataset.label ? `${ctx.dataset.label} - ` : '';
                                    return `${prefijo}${ctx.label}: ${formatearEuro(ctx.raw)} (${perc}%)`; 
                                }
                            }
                        },
                        datalabels: {
                            color: '#fff',
                            font: { weight: 'bold', size: 12 },
                            formatter: (value, ctx) => {
                                if (ctx.datasetIndex !== 0) return '';
                                const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
                                const perc = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                return perc + '%';
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
            actualizarIndicadorGastosDonut(showReales, labelGastosBudget, labelGastosReal);
            window.chartsInstances.push(charts.gastosCat);


            // ===== GRÁFICO GASTOS POR MES Y CATEGORÍA =====

            // Calcular totales por mes (suma de categorías)
            const totalesMes = labelsMeses.map((mes, idx) => {
                return datasetsMesCat.reduce((sum, ds) => sum + (ds.data[idx] || 0), 0);
            });

            // Media y varianza sobre el total mensual
            const mediaGastosMes = calcularMedia(totalesMes);
            const varianzaGastosMes = calcularDesviacion(totalesMes);

            const tituloGastosMes = `${labelsTraducidos.mediaMensualTotal}: ${formatearEuro(mediaGastosMes)}   |   ${labelsTraducidos.desviacion}: ${formatearEuro(varianzaGastosMes)}`;
            
            charts.gastosMes = new Chart(document.getElementById('chartGastosMes'), {
                type: 'bar',
                data: { 
                    labels: labelsMeses, 
                    datasets: datasetsMesCat 
                },
                options: crearOpcionesGrafico(optComun, tituloGastosMes, true)
            });

charts.gastosMes.updateChartStats = function() {
    const totalesMesBis = labelsMeses.map((mes, idx) => {
        return this.data.datasets.reduce((sum, ds, dsIdx) => {
            return sum + (this.isDatasetVisible(dsIdx) ? (ds.data[idx] || 0) : 0);
        }, 0);
    });
    
    const mediaGM = calcularMedia(totalesMesBis);
    const desvGM = calcularDesviacion(totalesMesBis);
    this.options.plugins.title.text = `${labelsTraducidos.mediaMensualTotal}: ${formatearEuro(mediaGM)}   |   ${labelsTraducidos.desviacion}: ${formatearEuro(desvGM)}`;
};

            console.log('✅ Dashboard actualizado correctamente');
            window.chartsInstances.push(charts.gastosMes);
            
            // Ocultar loader
            if (loader) {
                loader.classList.add('hidden');
            }
        } catch (error) {
            console.error('❌ Error actualizando dashboard:', error);
            
            // Ocultar loader en caso de error
            if (loader) {
                loader.classList.add('hidden');
            }
        }
    }
    
    // ===== INICIALIZACIÓN =====
    const unAnioAtras = new Date(hoy.getFullYear()-1, hoy.getMonth(), hoy.getDate());

    const rangoGuardado = cargarRangoSeleccionado();
    if (rangoGuardado?.desde && rangoGuardado?.hasta) {
        document.getElementById('dashDesde').value = rangoGuardado.desde;
        document.getElementById('dashHasta').value = rangoGuardado.hasta;
    } else {
        document.getElementById('dashDesde').value = '';
        document.getElementById('dashHasta').value = '';
    }

    initDateRangeSlider();

    console.log('📅 Fechas iniciales:', {
        desde: document.getElementById('dashDesde').value || unAnioAtras.toISOString().slice(0,10),
        hasta: document.getElementById('dashHasta').value || hoy.toISOString().slice(0,10)
    });

    actualizarQuickPeriodActivos();

    // ===== ACTUALIZAR SOLO GRÁFICO DE GASTOS POR CATEGORÍA =====
    async function actualizarGraficoGastosMes() {
        const desde = document.getElementById('dashDesde').value;
        const hasta = document.getElementById('dashHasta').value;
        const catSel = filtroGastoCategoria.value;
        const showReales = document.getElementById('dashboardToggleReal')?.checked;

        if (!desde || !hasta) return;

        try {
            // Obtener labels traducidos
            const labelsTraducidos = obtenerLabelsTraducidos();
            
            // Obtener gastos por mes y categoría
            const resGastoMes = await fetch(`/gastos-categoria-mes?desde=${desde}&hasta=${hasta}`);
            const resGastoMesReal = showReales
                ? await fetch(`${realEndpoints.gastosMes}?desde=${desde}&hasta=${hasta}`)
                : null;
            const dataGastoMes = await resGastoMes.json();
            const dataGastoMesReal = resGastoMesReal ? await resGastoMesReal.json() : null;

            const labelsMeses = Object.keys(dataGastoMes).sort();
            let datasetsMesCat = [];

            if(catSel){ 
                const data = labelsMeses.map(m => dataGastoMes[m]?.[catSel] || 0);
                datasetsMesCat.push({ 
                    label: catSel === 'taxes'
                        ? (typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.impuestosCategoria') : 'Impuestos')
                        : catSel, 
                    data, 
                    backgroundColor: aclararColor(coloresCategorias[catSel], 0.7),
                    borderColor: coloresCategorias[catSel],
                    borderWidth: 2,
                    borderRadius: 6,
                    tension: 0.4,
                    stack: showReales ? 'main' : undefined
                });
            }
            else {
                const categoriasSet = new Set();
                labelsMeses.forEach(m => {
                    if (dataGastoMes[m]) {
                        Object.keys(dataGastoMes[m]).forEach(c => categoriasSet.add(c));
                    }
                });
                Array.from(categoriasSet).forEach((c,i)=>{
                    const data = labelsMeses.map(m => dataGastoMes[m]?.[c] || 0);
                    let color = coloresCategorias[c];
                    if(!color) {
                        if(c === 'taxes') {
                            color = temasGraficos.warning;
                            coloresCategorias['taxes'] = color;
                        } else {
                            color = obtenerColorCategoria(c,i);
                        }
                    }
                    const labelCategoria = c === 'taxes'
                        ? (typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.impuestosCategoria') : 'Impuestos')
                        : c;
                    datasetsMesCat.push({ 
                        label: labelCategoria, 
                        data, 
                        backgroundColor: aclararColor(color, 0.7),
                        borderColor: color,
                        borderWidth: 2,
                        borderRadius: 6,
                        tension: 0.4,
                        stack: showReales ? 'main' : undefined
                    });
                });
            }

            if (showReales && catSel !== 'taxes') {
                const sufijoReal = typeof gestorIdiomas !== 'undefined'
                    ? gestorIdiomas.obtenerTexto('dashboard.realesSuffix')
                    : 'Real';

                if (catSel) {
                    const realData = labelsMeses.map(m => dataGastoMesReal?.[m]?.[catSel] || 0);
                    const color = coloresCategorias[catSel] || temasGraficos.primaryDark || '#475569';
                    const labelCategoria = `${catSel} (${sufijoReal})`;

                    datasetsMesCat.push({
                        label: labelCategoria,
                        data: realData,
                        backgroundColor: aclararColor(color, 0.45),
                        borderColor: color,
                        borderWidth: 2,
                        borderRadius: 6,
                        tension: 0.4,
                        stack: 'real'
                    });
                } else {
                    const categoriasRealSet = new Set();
                    labelsMeses.forEach(m => {
                        if (dataGastoMesReal?.[m]) {
                            Object.keys(dataGastoMesReal[m]).forEach(c => categoriasRealSet.add(c));
                        }
                    });

                    Array.from(categoriasRealSet).forEach((c, i) => {
                        if (c === 'taxes') return;
                        const data = labelsMeses.map(m => dataGastoMesReal?.[m]?.[c] || 0);
                        const color = coloresCategorias[c] || obtenerColorCategoria(c, i);
                        const labelCategoria = `${c} (${sufijoReal})`;

                        datasetsMesCat.push({
                            label: labelCategoria,
                            data,
                            backgroundColor: aclararColor(color, 0.45),
                            borderColor: color,
                            borderWidth: 2,
                            borderRadius: 6,
                            tension: 0.4,
                            stack: 'real'
                        });
                    });
                }
            }

            // Destruir gráfico anterior
            if(charts.gastosMes) {
                try {
                    charts.gastosMes.destroy();
                } catch (e) {
                    console.warn('⚠️ Error destruyendo gráfico:', e);
                }
            }

            // Calcular totales por mes y media
            const totalesMes = labelsMeses.map((mes, idx) => {
                return datasetsMesCat.reduce((sum, ds) => sum + (ds.data[idx] || 0), 0);
            });
            const mediaGastosMes = calcularMedia(totalesMes);
            const varianzaGastosMes = calcularDesviacion(totalesMes);

            // Recrear gráfico
            charts.gastosMes = new Chart(document.getElementById('chartGastosMes'), {
                type: 'bar',
                data:{ 
                    labels: labelsMeses, 
                    datasets: datasetsMesCat 
                },
                options:{ 
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        x: { stacked: true },
                        y: { stacked: true }
                    },
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'bottom',
                            labels: {
                                color: '#333',
                                font: { size: 12, weight: '600' },
                                padding: 15,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderWidth: 1,
                            callbacks: {
                                label: function(ctx) {
                                    return formatearEuro(ctx.raw);
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: `${labelsTraducidos.mediaMensualTotal}: ${formatearEuro(mediaGastosMes)}   |   ${labelsTraducidos.desviacion}: ${formatearEuro(varianzaGastosMes)}`,
                            font: { size: 13, weight: '600' },
                            padding: { top: 5, bottom: 10 }
                        }
                    }
                }
            });

            console.log('✅ Gráfico de gastos actualizado');
            window.chartsInstances.push(charts.gastosMes);
        } catch (error) {
            console.error('❌ Error actualizando gráfico de gastos:', error);
        }
    }

    // Cargar inicial - con pequeño delay para asegurar que el DOM esté listo
    console.log('⏳ Iniciando carga del dashboard...');
    setTimeout(() => {
        cargarCategorias().then(() => {
            actualizarDashboard();
        });
    }, 50);
    
    // Configurar listeners después de que el HTML esté disponible
    setupDateListeners();
    setupQuickPeriodListener();



}
    
