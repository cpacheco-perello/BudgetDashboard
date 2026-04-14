// Entrypoint nominal de la pestaña Importación Bancaria.
// La implementación principal vive en js/tabModules/importacion/importacion.core.js.
if (typeof window.cargarImportacionBancaria !== 'function') {
    console.error('Importación core no cargado: cargarImportacionBancaria no está disponible');
}
