function cargarDashboardForm() {
    let chartTotales, chartIngresos, chartGastos, chartAhorros, chartIngresosCat, chartGastosCat, chartGastosMes;
    const filtroGastoCategoria = document.getElementById('filtroGastoCategoria');
    const hoy = new Date();

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


    // ===== Cargar categorías =====
    async function cargarCategorias() {
        const desde = document.getElementById('dashDesde').value;
        const hasta = document.getElementById('dashHasta').value;

        if (!desde || !hasta) {
            console.warn('⚠️ Selecciona rango de fechas antes');
            return;
        }

        try {
            const resCat = await fetch(`/categorias-periodo?desde=${desde}&hasta=${hasta}`);
            const dataCat = await resCat.json();

            filtroGastoCategoria.innerHTML = '<option value="">Todas las categorías</option>';
            
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

    // ===== Actualizar dashboard =====
    async function actualizarDashboard() {
        const desde = document.getElementById('dashDesde').value;
        const hasta = document.getElementById('dashHasta').value;
        const catSel = filtroGastoCategoria.value;

        if (!desde || !hasta) {
            console.warn('⚠️ Por favor selecciona rango de fechas');
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

            const meses = dataTotales.map(m => m.mes);
            const ingresosMes = dataTotales.map(m => m.ingresos || 0);
            const gastosMes = dataTotales.map(m => m.gastos || 0);
            const ahorrosMes = dataTotales.map(m => m.ahorros || 0);

            // Categorías
            const resCat = await fetch(`/categorias-periodo?desde=${desde}&hasta=${hasta}`);
            const dataCat = await resCat.json();
            const catIngresos = Object.keys(dataCat.ingresos || {});
            const valIngresos = Object.values(dataCat.ingresos || {});
            const catGastos = Object.keys(dataCat.gastos || {});
            const valGastos = Object.values(dataCat.gastos || {});

            // Gastos por mes
            const resGastoMes = await fetch(`/gastos-categoria-mes?desde=${desde}&hasta=${hasta}`);
            const dataGastoMes = await resGastoMes.json();

            const labelsMeses = Object.keys(dataGastoMes).sort();
            let datasetsMesCat = [];

            if(catSel){ 
                const data = labelsMeses.map(m => dataGastoMes[m]?.[catSel] || 0);
                datasetsMesCat.push({ 
                    label: catSel, 
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
                    const color = obtenerColorCategoria(c,i);
                    datasetsMesCat.push({ 
                        label: c, 
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
            [chartTotales, chartIngresos, chartGastos, chartAhorros, chartIngresosCat, chartGastosCat, chartGastosMes].forEach(chart => {
                if(chart) chart.destroy();
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
                                return '€' + ctx.raw.toFixed(2);
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
                                return '€' + value.toFixed(0);
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

            // ===== GRÁFICO TOTALES =====
            chartTotales = new Chart(document.getElementById('chartTotales'), {
                type:'bar',
                data:{
                    labels:['Ingresos','Gastos','Ahorros'],
                    datasets:[{
                        label:'€',
                        data:[totalIngresos,totalGastos,totalAhorros],
                        backgroundColor:[
                            temasGraficos.success,
                            temasGraficos.danger,
                            temasGraficos.info
                        ],
                        borderColor:[
                            temasGraficos.success,
                            temasGraficos.danger,
                            temasGraficos.info
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

            // ===== GRÁFICO INGRESOS POR MES =====

            // Media y varianza
            const mediaIngresos = calcularMedia(ingresosMes);
            const varianzaIngresos = calcularDesviacion(ingresosMes);

            chartIngresos = new Chart(document.getElementById('chartIngresos'), {
                type: 'bar',
                data:{
                    labels: meses,
                    datasets:[{ 
                        label:'Ingresos €', 
                        data: ingresosMes, 
                        backgroundColor: aclararColor(temasGraficos.success, 0.7),
                        borderColor: temasGraficos.success,
                        borderWidth: 2,
                        borderRadius: 6,
                        tension: 0.4
                    }]
                },
            options:{ 
                                ...optComun, 

                    plugins:{
                        ...optComun.plugins,

                        // ===== TÍTULO CON MEDIA Y VARIANZA =====
                        title: {
                            display: true,
                            text: `Media: €${mediaIngresos.toFixed(2)}   |   Varianza: ${varianzaIngresos.toFixed(2)}`,
                            font: { size: 13, weight: '600' },
                            padding: { top: 5, bottom: 10 }
                        },

                        // ===== LÍNEA HORIZONTAL DE MEDIA =====
                        annotation: {
                            annotations: {
                                lineaMedia: {
                                    type: 'line',
                                    yMin: mediaIngresos,
                                    yMax: mediaIngresos,
                                    borderColor: temasGraficos.info,
                                    borderWidth: 2,
                                    borderDash: [6, 6],
                                    label: {
                                        display: true,
                                        content: `Media €${mediaIngresos.toFixed(2)}`,
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


            // ===== GRÁFICO GASTOS POR MES =====
                const mediaGastos = calcularMedia(gastosMes);
                const varianzaGastos = calcularDesviacion(gastosMes);

                chartGastos = new Chart(document.getElementById('chartGastos'), {
                    type: 'bar',
                    data: {
                        labels: meses,
                        datasets: [{ 
                            label: 'Gastos €', 
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
                                text: `Media: €${mediaGastos.toFixed(2)}   |   Varianza: €${varianzaGastos.toFixed(2)}`,
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
                                            content: `Media €${mediaGastos.toFixed(2)}`,
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


// ===== GRÁFICO AHORROS POR MES =====

// Calcular media y desviación
const mediaAhorros = calcularMedia(ahorrosMes);
const desviacionAhorros = calcularDesviacion(ahorrosMes);

chartAhorros = new Chart(document.getElementById('chartAhorros'), {
    type:'bar',
    data:{
        labels: meses,
        datasets:[{ 
            label:'Ahorros €', 
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
                text: `Media: €${mediaAhorros.toFixed(2)}   |   Desviación: €${desviacionAhorros.toFixed(2)}`,
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
                            content: `Media €${mediaAhorros.toFixed(2)}`,
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


            // ===== GRÁFICO INGRESOS POR CATEGORÍA DONUT =====
            chartIngresosCat = new Chart(document.getElementById('chartIngresosCategoria'), {
                type:'doughnut',
                data:{
                    labels:catIngresos,
                    datasets:[{ 
                        data:valIngresos, 
                        backgroundColor: catIngresos.map((c,i)=>obtenerColorCategoria(c,i)),
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
                                    const total=valIngresos.reduce((a,b)=>a+b,0); 
                                    const perc=((ctx.raw/total)*100).toFixed(1); 
                                    return `${ctx.label}: €${ctx.raw.toFixed(2)} (${perc}%)`; 
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

            // ===== GRÁFICO GASTOS POR CATEGORÍA DONUT =====
            chartGastosCat = new Chart(document.getElementById('chartGastosCategoria'), {
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


            // ===== GRÁFICO GASTOS POR MES Y CATEGORÍA =====

            // Calcular totales por mes (suma de categorías)
            const totalesMes = labelsMeses.map((mes, idx) => {
                return datasetsMesCat.reduce((sum, ds) => sum + (ds.data[idx] || 0), 0);
            });

            // Media y varianza sobre el total mensual
            const mediaGastosMes = calcularMedia(totalesMes);
            const varianzaGastosMes = calcularDesviacion(totalesMes);

            chartGastosMes = new Chart(document.getElementById('chartGastosMes'), {
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
                text: `Media mensual total: €${mediaGastosMes.toFixed(2)}   |   Varianza: ${varianzaGastosMes.toFixed(2)}`,
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
                            content: `Media total €${mediaGastosMes.toFixed(2)}`,
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

        } catch (error) {
            console.error('❌ Error actualizando dashboard:', error);
        }
    }

    // ===== MANEJAR SELECTORES DE TIEMPO RÁPIDO =====
    document.querySelectorAll('.quick-period-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const days = parseInt(this.getAttribute('data-days'));
            const desde = new Date();
            desde.setDate(desde.getDate() - days);

            document.getElementById('dashDesde').value = desde.toISOString().slice(0, 10);
            document.getElementById('dashHasta').value = hoy.toISOString().slice(0, 10);

            // Actualizar estado activo del botón
            document.querySelectorAll('.quick-period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            console.log(`📅 Período rápido: últimos ${days} días`);

            // Cargar datos
            cargarCategorias().then(() => actualizarDashboard());
        });
    });

    // Remover clase active cuando se modifiquen las fechas manualmente
    document.getElementById('dashDesde').addEventListener('change', () => {
        document.querySelectorAll('.quick-period-btn').forEach(b => b.classList.remove('active'));
    });
    document.getElementById('dashHasta').addEventListener('change', () => {
        document.querySelectorAll('.quick-period-btn').forEach(b => b.classList.remove('active'));
    });

    // ===== ESCUCHAR CAMBIOS DE TEMA =====
    document.addEventListener('temaActualizado', (e) => {
        console.log('🎨 Actualizando colores de gráficos por cambio de tema...');
        
        temasGraficos = {
            primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
            primaryDark: getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim(),
            success: getComputedStyle(document.documentElement).getPropertyValue('--success').trim(),
            danger: getComputedStyle(document.documentElement).getPropertyValue('--danger').trim(),
            warning: getComputedStyle(document.documentElement).getPropertyValue('--warning').trim(),
            info: getComputedStyle(document.documentElement).getPropertyValue('--info').trim()
        };

        paletaColores = [
            temasGraficos.primary,
            temasGraficos.success,
            temasGraficos.info,
            temasGraficos.warning,
            temasGraficos.primaryDark,
            temasGraficos.danger,
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#fa709a', '#fee140'
        ];

        Object.keys(coloresCategorias).forEach(key => delete coloresCategorias[key]);

        console.log('🎨 Nuevos colores:', temasGraficos);
        actualizarDashboard();
    });

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

    // ===== EVENTOS PRINCIPALES =====
    document.getElementById('btnCargarDashboard').onclick = async () => {
        console.log('🔄 Botón actualizar presionado');
        await cargarCategorias();
        await actualizarDashboard();
    };

    filtroGastoCategoria.onchange = () => {
        console.log('📁 Categoría seleccionada:', filtroGastoCategoria.value);
        actualizarDashboard();
    };

    // Cargar inicial
    console.log('⏳ Iniciando carga del dashboard...');
    cargarCategorias().then(() => {
        actualizarDashboard();
    });
}

// Cargar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarDashboardForm);
} else {
    cargarDashboardForm();
}