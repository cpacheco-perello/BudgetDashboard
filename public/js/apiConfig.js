/**
 * API Adapter - Proporciona una interfaz compatible con fetch para usar IPC
 * Este adaptador permite mantener el código del frontend casi sin cambios
 */

// Guardar el fetch original
const originalFetch = window.fetch;

window.API = {
    /**
     * Simula una llamada fetch pero usa IPC de Electron solo para rutas de la API interna
     * @param {string} url - URL de la API (se convertirá a canal IPC)
     * @param {object} options - Opciones de la petición (method, body, etc.)
     * @returns {Promise<Response>} - Objeto Response compatible con fetch
     */
    async fetch(url, options = {}) {
        // Si es una URL externa (http/https) o archivo HTML, usar fetch original
        if (url.startsWith('http://') || url.startsWith('https://') || 
            url.endsWith('.html') || url.endsWith('.js') || url.endsWith('.css')) {
            return originalFetch(url, options);
        }

        const method = options.method || 'GET';
        let body = null;

        // Manejar FormData (para importación de archivos)
        if (options.body instanceof FormData) {
            // Convertir FormData a objeto para IPC
            body = {};
            const file = options.body.get('archivo');
            const nombre = options.body.get('nombre');
            
            if (file instanceof Blob) {
                // Leer el archivo como ArrayBuffer y convertir a base64
                const arrayBuffer = await file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                body.contenido = btoa(binary);
                body.filename = nombre || file.name || 'archivo.csv';
            }
        } else if (options.body) {
            body = JSON.parse(options.body);
        }

        try {
            // Mapeo de URLs a canales IPC
            const result = await this._callIPC(url, method, body);
            
            // Crear un objeto Response compatible
            return {
                ok: true,
                status: 200,
                json: async () => result,
                text: async () => JSON.stringify(result)
            };
        } catch (error) {
            console.error('IPC Error:', error);
            return {
                ok: false,
                status: error.status || 500,
                json: async () => ({ error: error.message || 'Error desconocido' }),
                text: async () => JSON.stringify({ error: error.message || 'Error desconocido' })
            };
        }
    },

    /**
     * Mapea URLs y métodos HTTP a llamadas IPC
     * @private
     */
    async _callIPC(url, method, body) {
        // Categorías
        if (url === '/add/categoria' && method === 'POST') {
            return await window.electronAPI.addCategoria(body);
        }
        if (url === '/categorias' && method === 'GET') {
            return await window.electronAPI.getCategorias();
        }
        if (url === '/update/categoria' && method === 'POST') {
            return await window.electronAPI.updateCategoria(body);
        }
        if (url === '/delete/categoria' && method === 'POST') {
            return await window.electronAPI.deleteCategoria(body);
        }

        // Gastos Puntuales
        if (url === '/add/gasto_puntual' && method === 'POST') {
            return await window.electronAPI.addGastoPuntual(body);
        }
        if (url === '/delete/gasto_puntual' && method === 'POST') {
            return await window.electronAPI.deleteGastoPuntual(body);
        }
        if (url === '/update/gasto_puntual' && method === 'POST') {
            return await window.electronAPI.updateGastoPuntual(body);
        }

        // Gastos Reales
        if (url === '/add/gasto_real' && method === 'POST') {
            return await window.electronAPI.addGastoReal(body);
        }
        if (url === '/delete/gasto_real' && method === 'POST') {
            return await window.electronAPI.deleteGastoReal(body);
        }
        if (url === '/update/gasto_real' && method === 'POST') {
            return await window.electronAPI.updateGastoReal(body);
        }

        // Gastos Mensuales
        if (url === '/add/gasto_mensual' && method === 'POST') {
            return await window.electronAPI.addGastoMensual(body);
        }
        if (url === '/delete/gasto_mensual' && method === 'POST') {
            return await window.electronAPI.deleteGastoMensual(body);
        }
        if (url === '/update/gasto_mensual' && method === 'POST') {
            return await window.electronAPI.updateGastoMensual(body);
        }

        // Ingresos Puntuales
        if (url === '/add/ingreso_puntual' && method === 'POST') {
            return await window.electronAPI.addIngresoPuntual(body);
        }
        if (url === '/delete/ingreso_puntual' && method === 'POST') {
            return await window.electronAPI.deleteIngresoPuntual(body);
        }
        if (url === '/update/ingreso_puntual' && method === 'POST') {
            return await window.electronAPI.updateIngresoPuntual(body);
        }

        // Ingresos Reales
        if (url === '/add/ingreso_real' && method === 'POST') {
            return await window.electronAPI.addIngresoReal(body);
        }
        if (url === '/delete/ingreso_real' && method === 'POST') {
            return await window.electronAPI.deleteIngresoReal(body);
        }
        if (url === '/update/ingreso_real' && method === 'POST') {
            return await window.electronAPI.updateIngresoReal(body);
        }

        // Ingresos Mensuales
        if (url === '/add/ingreso_mensual' && method === 'POST') {
            return await window.electronAPI.addIngresoMensual(body);
        }
        if (url === '/delete/ingreso_mensual' && method === 'POST') {
            return await window.electronAPI.deleteIngresoMensual(body);
        }
        if (url === '/update/ingreso_mensual' && method === 'POST') {
            return await window.electronAPI.updateIngresoMensual(body);
        }

        // Import Puntuales (Banco)
        if (url === '/import/gasto_puntual' && method === 'POST') {
            return await window.electronAPI.importGastosPuntuales(body);
        }
        if (url === '/import/ingreso_puntual' && method === 'POST') {
            return await window.electronAPI.importIngresosPuntuales(body);
        }
        if (url === '/import/gasto_real' && method === 'POST') {
            return await window.electronAPI.importGastosReales(body);
        }
        if (url === '/import/ingreso_real' && method === 'POST') {
            return await window.electronAPI.importIngresosReales(body);
        }

        // Impuestos Puntuales
        if (url === '/add/impuesto_puntual' && method === 'POST') {
            return await window.electronAPI.addImpuestoPuntual(body);
        }
        if (url === '/delete/impuesto_puntual' && method === 'POST') {
            return await window.electronAPI.deleteImpuestoPuntual(body);
        }
        if (url === '/update/impuesto_puntual' && method === 'POST') {
            return await window.electronAPI.updateImpuestoPuntual(body);
        }

        // Impuestos Mensuales
        if (url === '/add/impuesto_mensual' && method === 'POST') {
            return await window.electronAPI.addImpuestoMensual(body);
        }
        if (url === '/delete/impuesto_mensual' && method === 'POST') {
            return await window.electronAPI.deleteImpuestoMensual(body);
        }
        if (url === '/update/impuesto_mensual' && method === 'POST') {
            return await window.electronAPI.updateImpuestoMensual(body);
        }

        // Hucha
        if (url === '/hucha' && method === 'GET') {
            return await window.electronAPI.getHucha();
        }
        if (url === '/add/hucha' && method === 'POST') {
            return await window.electronAPI.addHucha(body);
        }
        if (url === '/update/hucha' && method === 'POST') {
            return await window.electronAPI.updateHucha(body);
        }
        if (url === '/delete/hucha' && method === 'POST') {
            return await window.electronAPI.deleteHucha(body);
        }

        // Cuenta Remunerada
        if (url === '/cuenta_remunerada' && method === 'GET') {
            return await window.electronAPI.getCuentaRemunerada();
        }
        if (url === '/add/cuenta_remunerada' && method === 'POST') {
            return await window.electronAPI.addCuentaRemunerada(body);
        }
        if (url === '/update/cuenta_remunerada' && method === 'POST') {
            return await window.electronAPI.updateCuentaRemunerada(body);
        }
        if (url === '/delete/cuenta_remunerada' && method === 'POST') {
            return await window.electronAPI.deleteCuentaRemunerada(body);
        }

        // Assets
        if (url === '/assets' && method === 'GET') {
            return await window.electronAPI.getAssets();
        }
        if (url === '/add/asset' && method === 'POST') {
            return await window.electronAPI.addAsset(body);
        }
        if (url === '/update/asset' && method === 'POST') {
            return await window.electronAPI.updateAsset(body);
        }
        if (url === '/delete/asset' && method === 'POST') {
            return await window.electronAPI.deleteAsset(body);
        }
        if (url === '/sell/asset' && method === 'POST') {
            return await window.electronAPI.sellAsset(body);
        }
        if (url.startsWith('/asset-price/') && method === 'GET') {
            const ticker = url.replace('/asset-price/', '');
            return await window.electronAPI.getAssetPrice(ticker);
        }

        // Dashboard
        if (url === '/dashboard' && method === 'GET') {
            return await window.electronAPI.getDashboard();
        }
        if (url === '/dashboard-real' && method === 'GET') {
            return await window.electronAPI.getDashboardReal();
        }
        if (url.startsWith('/impuestos-mes?') && method === 'GET') {
            const params = new URLSearchParams(url.split('?')[1]);
            return await window.electronAPI.getImpuestosMes({
                desde: params.get('desde'),
                hasta: params.get('hasta')
            });
        }
        if (url.startsWith('/impuestos-mes-real?') && method === 'GET') {
            const params = new URLSearchParams(url.split('?')[1]);
            return await window.electronAPI.getImpuestosMesReal({
                desde: params.get('desde'),
                hasta: params.get('hasta')
            });
        }
        if (url.startsWith('/ahorros-mes?') && method === 'GET') {
            const params = new URLSearchParams(url.split('?')[1]);
            return await window.electronAPI.getAhorrosMes({
                desde: params.get('desde'),
                hasta: params.get('hasta'),
                categoria_id: params.get('categoria_id')
            });
        }
        if (url.startsWith('/ahorros-mes-real?') && method === 'GET') {
            const params = new URLSearchParams(url.split('?')[1]);
            return await window.electronAPI.getAhorrosMesReal({
                desde: params.get('desde'),
                hasta: params.get('hasta'),
                categoria_id: params.get('categoria_id')
            });
        }
        if (url.startsWith('/categorias-periodo?') && method === 'GET') {
            const params = new URLSearchParams(url.split('?')[1]);
            return await window.electronAPI.getCategoriasPeriodo({
                desde: params.get('desde'),
                hasta: params.get('hasta')
            });
        }
        if (url.startsWith('/categorias-periodo-real?') && method === 'GET') {
            const params = new URLSearchParams(url.split('?')[1]);
            return await window.electronAPI.getCategoriasPeriodoReal({
                desde: params.get('desde'),
                hasta: params.get('hasta')
            });
        }
        if (url.startsWith('/gastos-categoria-mes?') && method === 'GET') {
            const params = new URLSearchParams(url.split('?')[1]);
            return await window.electronAPI.getGastosCategoriaMes({
                desde: params.get('desde'),
                hasta: params.get('hasta')
            });
        }
        if (url.startsWith('/gastos-categoria-mes-real?') && method === 'GET') {
            const params = new URLSearchParams(url.split('?')[1]);
            return await window.electronAPI.getGastosCategoriaMesReal({
                desde: params.get('desde'),
                hasta: params.get('hasta')
            });
        }
        if (url === '/resumen-periodos' && method === 'GET') {
            return await window.electronAPI.getResumenPeriodos();
        }

        // Importación Bancaria
        if (url === '/api/importacion/listar' && method === 'GET') {
            return await window.electronAPI.importList();
        }
        if (url.startsWith('/api/importacion/contenido/') && method === 'GET') {
            const id = url.replace('/api/importacion/contenido/', '');
            return await window.electronAPI.importContent(id);
        }
        if (url.startsWith('/api/importacion/eliminar/') && (method === 'POST' || method === 'DELETE')) {
            const id = url.replace('/api/importacion/eliminar/', '');
            return await window.electronAPI.importDelete(id);
        }
        if (url === '/api/importacion/guardar' && method === 'POST') {
            return await window.electronAPI.importSave(body);
        }

        // Yahoo Finance - Assets
        if (url.startsWith('/asset-price/') && method === 'GET') {
            const ticker = url.replace('/asset-price/', '');
            return await window.electronAPI.getAssetPrice(ticker);
        }
        if (url.startsWith('/asset-history/') && method === 'GET') {
            const parts = url.split('?');
            const ticker = parts[0].replace('/asset-history/', '');
            const params = new URLSearchParams(parts[1] || '');
            const period = params.get('period') || '1y';
            return await window.electronAPI.getAssetHistory(ticker, period);
        }

        // Usuarios
        if (url === '/users' && method === 'GET') {
            return await window.electronAPI.listUsers();
        }
        if (url === '/users/current' && method === 'GET') {
            return await window.electronAPI.getCurrentUser();
        }
        if (url === '/users/create' && method === 'POST') {
            return await window.electronAPI.createUser(body);
        }
        if (url === '/users/select' && method === 'POST') {
            return await window.electronAPI.setCurrentUser(body);
        }

        throw new Error(`Ruta no implementada: ${method} ${url}`);
    }
};

// Reemplazar fetch global con nuestro adaptador
window.fetch = window.API.fetch.bind(window.API);

console.log('✅ API Adapter cargado - fetch redirigido a IPC');
