// Entrypoint nominal de la pestaña Ingresos.
// La implementación principal vive en js/tabModules/ingresos/ingresos.core.js.
if (typeof window.cargarIngresosForm !== 'function') {
    console.error('Ingresos core no cargado: cargarIngresosForm no está disponible');
}
