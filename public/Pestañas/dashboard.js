
function cargarDashboardForm() {
// ===== VARIABLES GLOBALES DEL DASHBOARD =====
let filtroGastoCategoria = null;
let dashDesde = null;
let dashHasta = null;
let hoy = new Date();

const charts = {
    totales: null,
    ingresos: null,
    gastos: null,
    ahorros: null,
    ingresosCat: null,
    gastosCat: null,
    gastosMes: null
};


// ===== FUNCIONES DE FORMATO GLOBAL =====
function formatearEuro(monto) {
    if (monto === null || monto === undefined) return '€0,00';
    return '€' + parseFloat(monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

    // Actualizar estado activo del botón
    document.querySelectorAll('.quick-period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    console.log(`📅 Período rápido: últimos ${days} días`);

    // Cargar datos
    cargarCategorias().then(() => actualizarDashboard());
}

function actualizarFechas() {
    document.querySelectorAll('.quick-period-btn').forEach(b => b.classList.remove('active'));
    cargarCategorias().then(() => actualizarDashboard());
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
    console.log('📁 Categoría seleccionada:', filtroGastoCategoria.value);
    actualizarGraficoGastosMes();
}

// ===== FUNCIONES PARA CONFIGURAR LISTENERS =====
const setupDateListeners = () => {
    const dashDesdeEl = document.getElementById('dashDesde');
    const dashHastaEl = document.getElementById('dashHasta');
    const filtroEl = document.getElementById('filtroGastoCategoria');
    
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
        const desde = document.getElementById('dashDesde').value;
        const hasta = document.getElementById('dashHasta').value;

        if (!desde || !hasta) {
            const mensaje = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.seleccionaRango') : 'Por favor selecciona un rango de fechas';
            console.warn('⚠️ ' + mensaje);
            return;
        }

        try {
            const resCat = await fetch(`/categorias-periodo?desde=${desde}&hasta=${hasta}`);
            const dataCat = await resCat.json();

            const textoTodas = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.todasCategorias') : 'Todas las categorías';
            filtroGastoCategoria.innerHTML = `<option value="">${textoTodas}</option>`;
            
            if (dataCat.gastos && Object.keys(dataCat.gastos).length > 0) {
                Object.keys(dataCat.gastos).forEach((c, i) => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    filtroGastoCategoria.appendChild(opt);
                    obtenerColorCategoria(c, i);
                });
                console.log('✅ Categorías cargadas:', Object.keys(dataCat.gastos));
            } else {
                console.warn('⚠️ No hay categorías para este período');
            }
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
        }
    }

    // ===== DESTRUIR TODOS LOS GRÁFICOS EXISTENTES =====
    // Esto es necesario cuando se recarga el dashboard (ej: cambio de idioma)
    // Usar la API correcta de Chart.js para desregistrar gráficos
    var canvasIds = ['chartTotales', 'chartIngresos', 'chartGastos', 'chartAhorros', 
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
    
    if (!filtroGastoCategoria || !dashDesde || !dashHasta) {
        console.warn('⚠️ Elementos del dashboard no encontrados. Reinintentando en 100ms...');
        setTimeout(() => cargarDashboardForm(), 100);
        return;
    }
    
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
        mediaMensualTotal: typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('dashboard.mediaMensualTotal') : 'Media mensual total'
    };
    return textos;
}

    // ===== Actualizar dashboard =====
    async function actualizarDashboard() {

        const desde = document.getElementById('dashDesde').value;
        const hasta = document.getElementById('dashHasta').value;
        const catSel = filtroGastoCategoria.value;

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
            alert(mensajeError);
            return;
        }

        console.log(`📊 Actualizando dashboard de ${desde} a ${hasta}`);

        try {
            // Totales
            const resTotales = await fetch(`/ahorros-mes?desde=${desde}&hasta=${hasta}`);
            const dataTotales = await resTotales.json();
            
            if (!dataTotales || dataTotales.length === 0) {
                console.warn('⚠️ No hay datos para este período');
                return;
            }

            const totalIngresos = dataTotales.reduce((sum, m) => sum + (m.ingresos || 0), 0);
            const totalGastos = dataTotales.reduce((sum, m) => sum + (m.gastos || 0), 0);
            const totalAhorros = dataTotales.reduce((sum, m) => sum + (m.ahorros || 0), 0);
            const totalCuentasRemuneradas = dataTotales.reduce((sum, m) => sum + (m.cuentas_remuneradas || 0), 0);

            const meses = dataTotales.map(m => m.mes);
            const ingresosMes = dataTotales.map(m => m.ingresos || 0);
            const cuentasRemuneradasMes = dataTotales.map(m => m.cuentas_remuneradas || 0);
            const gastosMes = dataTotales.map(m => m.gastos || 0);
            const ahorrosMes = dataTotales.map(m => m.ahorros || 0);

            // Categorías
            const resCat = await fetch(`/categorias-periodo?desde=${desde}&hasta=${hasta}`);
            const dataCat = await resCat.json();
            const catIngresos = Object.keys(dataCat.ingresos || {});
            const valIngresos = Object.values(dataCat.ingresos || {});
            const catGastos = Object.keys(dataCat.gastos || {});
            const valGastos = Object.values(dataCat.gastos || {});

            // Obtener cuentas remuneradas para desglose por categoría (SOLO INTERESES)
            const resDashboard = await fetch('/dashboard');
            const dataDashboard = await resDashboard.json();
            const cuentasRemuneradasPorCategoria = {};
            dataDashboard.cuenta_remunerada.forEach(cr => {
                const crDesde = new Date(cr.desde + "-28");
                const crHasta = cr.hasta ? new Date(cr.hasta + "-28") : new Date(9999,11,31);
                const desdeDate = new Date(desde);
                const hastaDate = new Date(hasta);
                const endRef = hastaDate < crHasta ? hastaDate : crHasta;
                
                // Verificar si hay solapamiento con el período
                if (crDesde <= hastaDate && crHasta >= desdeDate) {
                    const categoriaKey = cr.categoria;
                    // Usar solo los intereses generados
                    cuentasRemuneradasPorCategoria[categoriaKey] = (cuentasRemuneradasPorCategoria[categoriaKey] || 0) + (cr.interes_generado || 0);
                }
            });

            // Gastos por mes
            const resGastoMes = await fetch(`/gastos-categoria-mes?desde=${desde}&hasta=${hasta}`);
            const dataGastoMes = await resGastoMes.json();

            const labelsMeses = Object.keys(dataGastoMes).sort();
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
                    tension: 0.4
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
                        tension: 0.4
                    });
                });
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

            // ===== OBTENER IMPUESTOS POR MES =====
            const resImpuestosMes = await fetch(`/impuestos-mes?desde=${desde}&hasta=${hasta}`);
            const dataImpuestosMes = await resImpuestosMes.json();
            const impuestosMes = dataImpuestosMes.map(m => m.impuestos || 0);
            const totalImpuestos = impuestosMes.reduce((sum, m) => sum + m, 0);

            // ===== GRÁFICO TOTALES =====
            const labelsTraducidos = obtenerLabelsTraducidos();
            
            charts.totales = new Chart(document.getElementById('chartTotales'), {
                type:'bar',
                data:{
                    labels:[labelsTraducidos.ingresos, labelsTraducidos.gastos, labelsTraducidos.ahorros, labelsTraducidos.impuestosTotales],
                    datasets:[{
                        label:'€',
                        data:[totalIngresos,totalGastos,totalAhorros,totalImpuestos],
                        backgroundColor:[
                            temasGraficos.success,
                            temasGraficos.danger,
                            temasGraficos.info,
                            temasGraficos.warning
                        ],
                        borderColor:[
                            temasGraficos.success,
                            temasGraficos.danger,
                            temasGraficos.info,
                            temasGraficos.warning
                        ],
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options:{ 
                    ...optComun, 
                    plugins:{ 
                        ...optComun.plugins, 
                        legend:{ display:false }
                    }
                }
            });
            window.chartsInstances.push(charts.totales);


            // ===== GRÁFICO INGRESOS POR MES =====

            // Media y varianza
            const mediaIngresos = calcularMedia(ingresosMes);
            const mediaCuentasRemuneradas = calcularMedia(cuentasRemuneradasMes);
            const varianzaIngresos = calcularDesviacion(ingresosMes);

            charts.ingresos = new Chart(document.getElementById('chartIngresos'), {
                type: 'bar',
                data:{
                    labels: meses,
                    datasets:[
                        { 
                            label: labelsTraducidos.ingresos + ' €', 
                            data: ingresosMes, 
                            backgroundColor: aclararColor(temasGraficos.success, 0.7),
                            borderColor: temasGraficos.success,
                            borderWidth: 2,
                            borderRadius: 6,
                            tension: 0.4
                        },
                        {
                            label: 'Cuentas Remuneradas €',
                            data: cuentasRemuneradasMes,
                            backgroundColor: aclararColor(temasGraficos.info, 0.7),
                            borderColor: temasGraficos.info,
                            borderWidth: 2,
                            borderRadius: 6,
                            tension: 0.4
                        },
                        {
                            label: labelsTraducidos.impuestosCategoria + ' €',
                            data: impuestosMes,
                            backgroundColor: aclararColor(temasGraficos.warning, 0.7),
                            borderColor: temasGraficos.warning,
                            borderWidth: 2,
                            borderRadius: 6,
                            tension: 0.4
                        }
                    ]
                },
            options:{ 
                                ...optComun,
                    scales: {
                        ...optComun.scales,
                        x: {
                            ...optComun.scales.x,
                            stacked: true
                        },
                        y: {
                            ...optComun.scales.y,
                            stacked: true
                        }
                    },
                    plugins:{
                        ...optComun.plugins,

                        // ===== TÍTULO CON MEDIA Y VARIANZA =====
                        title: {
                            display: true,
                            text: `Ingresos: ${formatearEuro(mediaIngresos)} | Cuentas Rem: ${formatearEuro(mediaCuentasRemuneradas)} | Desv: ${formatearEuro(varianzaIngresos)}`,
                            font: { size: 13, weight: '600' },
                            padding: { top: 5, bottom: 10 }
                        },

                        // ===== LÍNEA HORIZONTAL DE MEDIA =====
                        annotation: {
                            annotations: {
                                lineaMedia: {
                                    type: 'line',
                                    yMin: mediaIngresos + mediaCuentasRemuneradas,
                                    yMax: mediaIngresos + mediaCuentasRemuneradas,
                                    borderColor: temasGraficos.primaryDark,
                                    borderWidth: 2,
                                    borderDash: [6, 6],
                                    label: {
                                        display: true,
                                        content: `Media Total ${formatearEuro(mediaIngresos + mediaCuentasRemuneradas)}`,
                                        position: 'end',
                                        backgroundColor: 'rgba(0,0,0,0.7)',
                                        color: '#fff',
                                        padding: 6
                                    }
                                }
                            }
                        }
                    }
                }
            });
            window.chartsInstances.push(charts.ingresos);


            // ===== GRÁFICO GASTOS POR MES =====
                const mediaGastos = calcularMedia(gastosMes);
                const varianzaGastos = calcularDesviacion(gastosMes);

                charts.gastos = new Chart(document.getElementById('chartGastos'), {
                    type: 'bar',
                    data: {
                        labels: meses,
                        datasets: [{ 
                            label: labelsTraducidos.gastos + ' €', 
                            data: gastosMes, 
                            backgroundColor: aclararColor(temasGraficos.danger, 0.7),
                            borderColor: temasGraficos.danger,
                            borderWidth: 2,
                            borderRadius: 6,
                            tension: 1
                        }]
                    },
                   options:{ 
                    ...optComun, 

                        plugins: {
                            ...optComun.plugins,

                            // ===== TÍTULO CON MEDIA Y VARIANZA =====
                            title: {
                                display: true,
                                text: `${labelsTraducidos.media}: ${formatearEuro(mediaGastos)}   |   ${labelsTraducidos.desviacion}: ${formatearEuro(varianzaGastos)}`,
                                font: { size: 13, weight: '600' },
                                padding: { top: 5, bottom: 10 }
                            },

                            // ===== LÍNEA HORIZONTAL DE MEDIA =====
                            annotation: {
                                annotations: {
                                    lineaMedia: {
                                        type: 'line',
                                        yMin: mediaGastos,
                                        yMax: mediaGastos,
                                        borderColor: temasGraficos.warning,
                                        borderWidth: 2,
                                        borderDash: [6, 6],
                                        label: {
                                            display: true,
                                            content: `${labelsTraducidos.media} ${formatearEuro(mediaGastos)}`,
                                            position: 'end',
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: '#fff',
                                            padding: 6
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            window.chartsInstances.push(charts.gastos);

// Calcular media y desviación
const mediaAhorros = calcularMedia(ahorrosMes);
const desviacionAhorros = calcularDesviacion(ahorrosMes);

charts.ahorros = new Chart(document.getElementById('chartAhorros'), {
    type:'bar',
    data:{
        labels: meses,
        datasets:[{ 
            label: labelsTraducidos.ahorros + ' €', 
            data: ahorrosMes, 
            backgroundColor: aclararColor(temasGraficos.info, 0.3),
            borderColor: temasGraficos.info,
            borderWidth: 3,
            borderRadius: 6,
            tension: 0.4,
            fill: true
        }]
    },
    options:{
        ...optComun,
        plugins: {
            ...optComun.plugins,

            // ===== TÍTULO CON MEDIA Y DESVIACIÓN =====
            title: {
                display: true,
                text: `${labelsTraducidos.media}: ${formatearEuro(mediaAhorros)}   |   ${labelsTraducidos.desviacion}: ${formatearEuro(desviacionAhorros)}`,
                font: { size: 13, weight: '600' },
                padding: { top: 5, bottom: 10 }
            },

            // ===== LÍNEA HORIZONTAL DE MEDIA =====
            annotation: {
                annotations: {
                    lineaMedia: {
                        type: 'line',
                        yMin: mediaAhorros,
                        yMax: mediaAhorros,
                        borderColor: temasGraficos.success,
                        borderWidth: 2,
                        borderDash: [6, 6],
                        label: {
                            display: true,
                            content: `${labelsTraducidos.media} ${formatearEuro(mediaAhorros)}`,
                            position: 'end',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            padding: 6
                        }
                    }
                }
            }
        }
    }
});
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
            
            charts.ingresosCat = new Chart(document.getElementById('chartIngresosCategoria'), {
                type:'doughnut',
                data:{
                    labels:Array.from(todasLasCategoriasIngresos),
                    datasets:[
                        {
                            label: 'Total Ingresos',
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
                                    
                                    let tooltip = `Total: ${formatearEuro(ctx.raw)} (${perc}%)`;
                                    if (ingresos > 0) tooltip += `\nIngresos: ${formatearEuro(ingresos)}`;
                                    if (cuentasRem > 0) tooltip += `\nCuentas Rem: ${formatearEuro(cuentasRem)}`;
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
            charts.gastosCat = new Chart(document.getElementById('chartGastosCategoria'), {
                type:'doughnut',
                data:{
                    labels:catGastos,
                    datasets:[{ 
                        data:valGastos, 
                        backgroundColor: catGastos.map((c,i)=>obtenerColorCategoria(c,i)),
                        borderColor: '#fff',
                        borderWidth: 2
                    }]
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
                                    const total=valGastos.reduce((a,b)=>a+b,0); 
                                    const perc=((ctx.raw/total)*100).toFixed(1); 
                                    return `${ctx.label}: €${ctx.raw.toFixed(2)} (${perc}%)`; 
                                                                    return `${ctx.label}: ${formatearEuro(ctx.raw)} (${perc}%)`;
                                }
                            }
                        },
                        datalabels: {
                            color: '#fff',
                            font: { weight: 'bold', size: 12 },
                            formatter: (value, ctx) => {
                                const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
                                const perc = ((value / total) * 100).toFixed(1);
                                return perc + '%';
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
            window.chartsInstances.push(charts.gastosCat);


            // ===== GRÁFICO GASTOS POR MES Y CATEGORÍA =====

            // Calcular totales por mes (suma de categorías)
            const totalesMes = labelsMeses.map((mes, idx) => {
                return datasetsMesCat.reduce((sum, ds) => sum + (ds.data[idx] || 0), 0);
            });

            // Media y varianza sobre el total mensual
            const mediaGastosMes = calcularMedia(totalesMes);
            const varianzaGastosMes = calcularDesviacion(totalesMes);

            charts.gastosMes = new Chart(document.getElementById('chartGastosMes'), {
                type: 'bar',
                data:{ 
                    labels: labelsMeses, 
                    datasets: datasetsMesCat 
                },
                options:{ 
                                ...optComun, 
                                
                scales: {
            x: { stacked: true },
            y: { stacked: true }
            },

         
        plugins: {
            ...optComun.plugins,

            // ===== TÍTULO CON MEDIA Y VARIANZA =====
            title: {
                display: true,
                text: `${labelsTraducidos.mediaMensualTotal}: ${formatearEuro(mediaGastosMes)}   |   ${labelsTraducidos.desviacion}: ${formatearEuro(varianzaGastosMes)}`,
                font: { size: 13, weight: '600' },
                padding: { top: 5, bottom: 10 }
            },

            // ===== LÍNEA HORIZONTAL DE MEDIA (TOTAL STACK) =====
            annotation: {
                annotations: {
                    lineaMedia: {
                        type: 'line',
                        yMin: mediaGastosMes,
                        yMax: mediaGastosMes,
                        borderColor: temasGraficos.info,
                        borderWidth: 2,
                        borderDash: [6, 6],
                        label: {
                            display: true,
                            content: `${labelsTraducidos.media} ${formatearEuro(mediaGastosMes)}`,
                            position: 'end',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            padding: 6
                        }
                    }
                }
            }
        }
    }
});


            console.log('✅ Dashboard actualizado correctamente');
            window.chartsInstances.push(charts.gastosMes);
        } catch (error) {
            console.error('❌ Error actualizando dashboard:', error);
        }
    }
    
    // ===== INICIALIZACIÓN =====
    const unAnioAtras = new Date(hoy.getFullYear()-1, hoy.getMonth(), hoy.getDate());
    
    document.getElementById('dashDesde').value = unAnioAtras.toISOString().slice(0,10);
    document.getElementById('dashHasta').value = hoy.toISOString().slice(0,10);

    console.log('📅 Fechas iniciales:', {
        desde: unAnioAtras.toISOString().slice(0,10),
        hasta: hoy.toISOString().slice(0,10)
    });

    // Activar botón de 1 año por defecto
    const btnUnAnio = document.querySelector('[data-days="365"]');
    if (btnUnAnio) {
        btnUnAnio.classList.add('active');
    }

    // ===== ACTUALIZAR SOLO GRÁFICO DE GASTOS POR CATEGORÍA =====
    async function actualizarGraficoGastosMes() {
        const desde = document.getElementById('dashDesde').value;
        const hasta = document.getElementById('dashHasta').value;
        const catSel = filtroGastoCategoria.value;

        if (!desde || !hasta) return;

        try {
            // Obtener gastos por mes y categoría
            const resGastoMes = await fetch(`/gastos-categoria-mes?desde=${desde}&hasta=${hasta}`);
            const dataGastoMes = await resGastoMes.json();

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
                    tension: 0.4
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
                        tension: 0.4
                    });
                });
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
                            text: `Media mensual total: ${formatearEuro(mediaGastosMes)}   |   Desviación: ${formatearEuro(varianzaGastosMes)}`,
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
    
