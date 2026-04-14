// Entrypoint nominal de la pestaña Dashboard.
// La implementación principal vive en js/tabModules/dashboard/dashboard.core.js.
if (typeof window.cargarDashboardForm !== 'function') {
    console.error('Dashboard core no cargado: cargarDashboardForm no está disponible');
}
