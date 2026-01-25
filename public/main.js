// ===== MANEJO DE PESTAÑAS =====
const buttons = document.querySelectorAll('.tablink');
const tabContent = document.getElementById('tab-content');

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
        if (tabId === 'dashboard') cargarDashboardForm();

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

// ===== ESCUCHAR CAMBIOS DE IDIOMA =====
document.addEventListener('idiomaActualizado', (e) => {
    console.log(`🌐 Idioma cambiado a: ${e.detail.idioma}`);
    
    // Aplicar traducciones a la pestaña actual
    if (typeof gestorIdiomas !== 'undefined') {
        gestorIdiomas.actualizarTraduccionesHTML();
    }
    
    // Recargar datos si es necesario
    const activeTab = document.querySelector('.tablink.active');
    if (activeTab) {
        const tabId = activeTab.dataset.tab;
        loadTab(tabId);
    }
});

// ===== MANEJO DE PERÍODOS Y RESUMEN =====
let periodoActual = '1mes';

async function cargarResumenPeriodos() {
    try {
        const res = await fetch('/resumen-periodos');
        const data = await res.json();
        
        function actualizarResumen(periodo) {
            const stats = data[periodo];
            document.getElementById('total-ingresos').textContent = `€${stats.ingresos.toFixed(2)}`;
            document.getElementById('total-gastos').textContent = `€${stats.gastos.toFixed(2)}`;
            document.getElementById('saldo').textContent = `€${stats.ahorro.toFixed(2)}`;
        }

        // Botones de período
        document.querySelectorAll('.btn-periodo').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-periodo').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                periodoActual = btn.dataset.periodo;
                actualizarResumen(periodoActual);
                
                console.log(`📊 Período actualizado a: ${periodoActual}`);
            });
        });

        // Cargar por defecto 1 mes
        actualizarResumen('1mes');
        console.log('✅ Resumen de períodos cargado');

    } catch (error) {
        console.error('❌ Error cargando resumen de períodos:', error);
        // Mostrar valores por defecto si hay error
        document.getElementById('total-ingresos').textContent = '€0.00';
        document.getElementById('total-gastos').textContent = '€0.00';
        document.getElementById('saldo').textContent = '€0.00';
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarResumenPeriodos();
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
            localStorage.setItem('tema', nuevoTema);
            cambiarTema(nuevoTema);
            console.log(`🎨 Tema cambiado a: ${nuevoTema}`);
        });
        
        console.log('✅ Selector de temas vinculado');
    } else {
        console.warn('⚠️ Elemento themeSelect no encontrado');
    }
});

// ===== UTILIDADES GLOBALES =====

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