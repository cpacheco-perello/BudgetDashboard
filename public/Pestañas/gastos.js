/**
 * Gastos - Versión simplificada usando TransactionManager
 * Mantiene lógica específica: agregar gastos, fraccionamiento
 * Delega CRUD y edición a clase base
 */
function cargarGastosForm() {
    // Inicializar TransactionManager para gastos
    const gastosManager = new TransactionManager({
        entityName: 'gastos',
        entityNameSingular: 'gasto',
        categoryType: 'gastos',
        endpoints: {
            puntuales: 'gastos_puntuales',
            mensuales: 'gastos_mensuales',
            delete: {
                puntual: '/delete/gasto_puntual',
                mensual: '/delete/gasto_mensual'
            }
        },
        tables: {
            puntuales: '#tablaGastosPuntuales tbody',
            mensuales: '#tablaGastosMensuales tbody'
        },
        selects: {
            puntuales: '#categoriaGasto',
            mensuales: '#categoriaMensual'
        },
        showOldFlag: 'showOldGastos'
    });

    // Inicializar manager
    gastosManager.init();

    // ===== LÓGICA ESPECÍFICA: AGREGAR GASTO PUNTUAL =====
    document.getElementById('btnAgregarGastoPuntual').onclick = async () => {
        const fecha = document.getElementById('fechaGasto').value;
        const desc = document.getElementById('descGasto').value;
        const monto = parseFloat(document.getElementById('montoGasto').value);
        const fraccionar = document.getElementById('fraccionarGasto')?.checked;
        const partes = parseInt(document.getElementById('partesGasto')?.value || '1', 10) || 1;
        const selectCatP = document.getElementById('categoriaGasto');

        // Validaciones
        if (!fecha) return showAlert(gastosManager.t('gastos.seleccionaFecha', "Selecciona una fecha"));
        if (!desc) return showAlert(gastosManager.t('gastos.ingresaDescripcion', "Ingresa una descripción"));
        if (isNaN(monto) || monto <= 0) return showAlert(gastosManager.t('gastos.montoInvalido', "Monto inválido"));

        // Si no se fracciona, enviar una sola entrada
        if (!fraccionar || partes <= 1) {
            await fetch('/add/gasto_puntual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fecha: fecha,
                    descripcion: desc,
                    monto: monto,
                    categoria_id: selectCatP.value
                })
            });
        } else {
            // Distribuir el monto en 'partes' respetando dos decimales
            const totalCents = Math.round(monto * 100);
            const base = Math.floor(totalCents / partes);
            const remainder = totalCents - base * partes;

            function addMonthsToDate(dateStr, months) {
                const d = new Date(dateStr);
                const day = d.getDate();
                d.setMonth(d.getMonth() + months);
                if (d.getDate() !== day) d.setDate(0);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${dd}`;
            }

            const promises = [];
            for (let i = 0; i < partes; i++) {
                let cents = base + (i < remainder ? 1 : 0);
                const partMonto = (cents / 100);
                const partFecha = addMonthsToDate(fecha, i);
                promises.push(fetch('/add/gasto_puntual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fecha: partFecha,
                        descripcion: desc + gastosManager.t('gastos.parteFraccion', ` (parte ${i + 1}/${partes})`)
                            .replace('{parte}', i + 1).replace('{total}', partes),
                        monto: partMonto,
                        categoria_id: selectCatP.value
                    })
                }));
            }
            await Promise.all(promises);
        }

        // Limpiar formulario
        document.getElementById('fechaGasto').value = '';
        document.getElementById('descGasto').value = '';
        document.getElementById('montoGasto').value = '';
        const chk = document.getElementById('fraccionarGasto');
        if (chk) chk.checked = false;
        const partsInput = document.getElementById('partesGasto');
        if (partsInput) partsInput.value = '1';
        
        gastosManager.loadData();
        if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
    };

    // ===== LÓGICA ESPECÍFICA: AGREGAR GASTO MENSUAL =====
    document.getElementById('btnAgregarMensual').onclick = async () => {
        const desde = document.getElementById('desdeGasto').value;
        const hasta = document.getElementById('hastaGasto').value;
        const desc = document.getElementById('descMensual').value;
        const monto = parseFloat(document.getElementById('montoMensual').value);
        const categoria = document.getElementById('categoriaMensual').value;

        // Validación de formato YYYY-MM
        const validarYYYYMM = (valor) => /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);

        if (!validarYYYYMM(desde)) return showAlert(gastosManager.t('gastos.formatoDesde', "El campo 'Desde' debe tener formato YYYY-MM"));
        if (!validarYYYYMM(hasta)) return showAlert(gastosManager.t('gastos.formatoHasta', "El campo 'Hasta' debe tener formato YYYY-MM"));
        if (!desc) return showAlert(gastosManager.t('gastos.descripcionRequerida', "Descripción requerida"));
        if (isNaN(monto) || monto <= 0) return showAlert(gastosManager.t('gastos.montoInvalido', "Monto inválido"));
        if (!categoria) return showAlert(gastosManager.t('gastos.seleccionaCategoria', "Selecciona una categoría"));

        await fetch('/add/gasto_mensual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                descripcion: desc,
                monto: monto,
                categoria_id: categoria,
                desde: desde,
                hasta: hasta
            })
        });

        // Limpiar formulario
        document.getElementById('desdeGasto').value = '';
        document.getElementById('hastaGasto').value = '';
        document.getElementById('descMensual').value = '';
        document.getElementById('montoMensual').value = '';
        
        gastosManager.loadData();
        if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
    };

    // ===== TOGGLE MOSTRAR/OCULTAR ANTIGUOS =====
    window.showOldGastos = false;
    const toggleBtns = [
        document.getElementById('toggleGastosAntiguos'),
        document.getElementById('toggleGastosMensualesAntiguos')
    ].filter(Boolean);
    
    if (toggleBtns.length) {
        const updateAll = () => {
            const textoMostrar = gastosManager.t('gastos.mostrarAntiguos', 'Mostrar antiguos');
            const textoOcultar = gastosManager.t('gastos.ocultarAntiguos', 'Ocultar antiguos');
            toggleBtns.forEach(b => b.textContent = window.showOldGastos ? textoOcultar : textoMostrar);
        };
        toggleBtns.forEach(b => b.addEventListener('click', () => {
            window.showOldGastos = !window.showOldGastos;
            updateAll();
            gastosManager.loadData();
        }));
        updateAll();
    }

    // ===== SUBPESTAÑAS =====
    const btnPuntuales = document.getElementById('tabGastosPuntualesBtn');
    const btnMensuales = document.getElementById('tabGastosMensualesBtn');
    const tabPuntuales = document.getElementById('tabGastosPuntuales');
    const tabMensuales = document.getElementById('tabGastosMensuales');

    btnPuntuales.onclick = () => {
        tabPuntuales.style.display = 'block';
        tabMensuales.style.display = 'none';
        btnPuntuales.classList.add('active');
        btnMensuales.classList.remove('active');
    };

    btnMensuales.onclick = () => {
        tabPuntuales.style.display = 'none';
        tabMensuales.style.display = 'block';
        btnPuntuales.classList.remove('active');
        btnMensuales.classList.add('active');
    };

    btnPuntuales.classList.add('active');

    // ===== TOGGLE FRACCIONAMIENTO =====
    const chkFraccionar = document.getElementById('fraccionarGasto');
    const inputPartes = document.getElementById('partesGasto');
    const spanFraccionar = document.querySelector('span[data-i18n="gastos.fraccionar"]');
    
    if (chkFraccionar && inputPartes) {
        const setVisible = (visible) => {
            inputPartes.style.display = visible ? 'inline-block' : 'none';
            inputPartes.setAttribute('aria-hidden', visible ? 'false' : 'true');
        };
        setVisible(!!chkFraccionar.checked);
        chkFraccionar.addEventListener('change', () => {
            setVisible(!!chkFraccionar.checked);
            if (!chkFraccionar.checked) inputPartes.value = '1';
        });
        
        if (spanFraccionar) {
            spanFraccionar.style.cursor = 'pointer';
            spanFraccionar.addEventListener('click', () => {
                chkFraccionar.checked = !chkFraccionar.checked;
                chkFraccionar.dispatchEvent(new Event('change'));
            });
        }
    }

    // ===== LISTENER PARA CAMBIOS DE IDIOMA =====
    document.addEventListener('idiomaActualizado', () => {
        if (toggleBtns.length) {
            const textoMostrar = gastosManager.t('gastos.mostrarAntiguos', 'Mostrar antiguos');
            const textoOcultar = gastosManager.t('gastos.ocultarAntiguos', 'Ocultar antiguos');
            toggleBtns.forEach(b => b.textContent = window.showOldGastos ? textoOcultar : textoMostrar);
        }
    });
}
