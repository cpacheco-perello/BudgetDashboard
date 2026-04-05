/**
 * IPC Handlers - Maneja todas las comunicaciones entre renderer y main process
 */

const { ipcMain, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { dbRun, dbGet, dbAll } = require('../utils/dbHelpers');
const { calcularInteresGenerado, generarDescripcionRandom } = require('../utils/calculations');
const { runMigrations } = require('../database/migrationRunner');
const {
    normalizeUserName,
    listUsers,
    ensureUserFolders,
    readLastUser,
    saveLastUser,
    readUserProfile,
    setUserIcon
} = require('../config/userManager');

// Services
const PuntualService = require('../services/PuntualService');
const MensualService = require('../services/MensualService');
const HuchaService = require('../services/HuchaService');
const SubHuchaService = require('../services/SubHuchaService');
const yahooFinanceService = require('../services/yahooFinanceService');
const {
    getDashboardData,
    getDashboardRealData,
    getDashboardRangoFechas,
    getImpuestosMes,
    getImpuestosMesReal,
    getAhorrosMes,
    getAhorrosMesReal,
    getCategoriasPeriodo,
    getCategoriasPeriodoReal,
    getGastosCategoriaMes,
    getGastosCategoriaMesReal,
    getResumenPeriodos
} = require('../services/dashboardService');

// Inicializar servicios
const gastosPuntualesService = new PuntualService('gastos_puntuales');
const gastosMensualesService = new MensualService('gastos_mensuales');
const ingresosPuntualesService = new PuntualService('ingresos_puntuales');
const ingresosMensualesService = new MensualService('ingresos_mensuales');
const impuestosPuntualesService = new PuntualService('impuestos_puntuales');
const impuestosMensualesService = new MensualService('impuestos_mensuales');
const huchaService = new HuchaService();
    const subHuchaService = new SubHuchaService();
const gastosRealesService = new PuntualService('gastos_reales');
const ingresosRealesService = new PuntualService('ingresos_reales');

let currentUser = readLastUser();

function getActiveUser() {
    return currentUser || readLastUser();
}

function setActiveUser(name) {
    currentUser = name;
    saveLastUser(name);
}

function getUploadsDir() {
    const user = getActiveUser();
    if (!user) {
        throw new Error('Usuario no seleccionado');
    }
    const paths = ensureUserFolders(user);
    return paths.uploadsDir;
}

async function importBatchWithTransaction(service, datos) {
    if (!Array.isArray(datos) || datos.length === 0) {
        throw new Error('No hay datos para importar');
    }

    const resultados = [];
    let exitosos = 0;
    let fallidos = 0;

    await dbRun(db, 'BEGIN TRANSACTION');
    try {
        for (const item of datos) {
            try {
                await service.add(item);
                resultados.push({ ...item, ok: true });
                exitosos += 1;
            } catch (err) {
                resultados.push({ ...item, ok: false, error: err.message });
                fallidos += 1;
                throw err;
            }
        }

        await dbRun(db, 'COMMIT');
        return {
            success: true,
            total: datos.length,
            exitosos,
            fallidos,
            detalles: resultados
        };
    } catch (error) {
        try {
            await dbRun(db, 'ROLLBACK');
        } catch (rollbackError) {
            console.warn('No se pudo revertir la transacción de importación:', rollbackError.message);
        }

        return {
            success: false,
            total: datos.length,
            exitosos,
            fallidos: fallidos || Math.max(0, datos.length - exitosos),
            error: error.message,
            detalles: resultados
        };
    }
}

/**
 * Registrar todos los handlers IPC
 */
function registerIpcHandlers() {
        // Limpiar caché de dashboardService al iniciar la app
        try {
            const dashboardService = require('../services/dashboardService');
            if ('resumenCache' in dashboardService) dashboardService.resumenCache = null;
            if ('resumenCacheTime' in dashboardService) dashboardService.resumenCacheTime = 0;
            if ('resumenCacheKey' in dashboardService) dashboardService.resumenCacheKey = null;
        } catch (e) {
            console.warn('No se pudo limpiar caché de dashboardService:', e.message);
        }
    // ============= USUARIOS =============

    // ============= WINDOW CONTROLS =============
    ipcMain.handle('window-minimize', async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return { success: false };
        win.minimize();
        return { success: true };
    });

    ipcMain.handle('window-maximize-toggle', async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return { success: false, isMaximized: false };

        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }

        return { success: true, isMaximized: win.isMaximized() };
    });

    ipcMain.handle('window-close', async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return { success: false };
        win.close();
        return { success: true };
    });

    ipcMain.handle('window-is-maximized', async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        return { isMaximized: !!win && win.isMaximized() };
    });

    ipcMain.handle('list-users', async () => {
        return { users: listUsers(), currentUser: getActiveUser() || null };
    });

    ipcMain.handle('create-user', async (event, data) => {
        const name = normalizeUserName(data?.name);
        ensureUserFolders(name);
        return { success: true, name };
    });

    ipcMain.handle('get-current-user', async () => {
        return { name: getActiveUser() || null };
    });

    ipcMain.handle('set-current-user', async (event, data) => {
        const name = normalizeUserName(data?.name);
        const paths = ensureUserFolders(name);
        await db.__setDbPath(paths.dbPath);
        await runMigrations();
        setActiveUser(name);
        return { success: true, name, paths };
    });

    ipcMain.handle('get-user-profile', async (event, data) => {
        const name = normalizeUserName(data?.name);
        return { profile: readUserProfile(name) };
    });

    ipcMain.handle('set-user-icon', async (event, data) => {
        const name = normalizeUserName(data?.name);
        const icon = typeof data?.icon === 'string' ? data.icon.trim() : '';
        if (!icon) {
            throw new Error('Icono de usuario requerido');
        }
        ensureUserFolders(name);
        const profile = setUserIcon(name, icon);
        return { success: true, profile };
    });

    // ============= CATEGORIAS =============
    
    ipcMain.handle('add-categoria', async (event, data) => {
        const { nombre, tipo } = data;
        
        if (!nombre || !tipo) {
            throw new Error('Nombre y tipo son requeridos');
        }
        
        if (!['gasto', 'ingreso', 'impuestos'].includes(tipo)) {
            throw new Error('Tipo de categoría inválido');
        }
        
        try {
            await dbRun(db, "INSERT INTO categorias (nombre, tipo) VALUES (?, ?)", [nombre.trim(), tipo]);
            return { success: true, message: 'Categoría agregada' };
        } catch (err) {
            if (err.message.includes('UNIQUE')) {
                throw new Error('La categoría ya existe para este tipo');
            }
            throw err;
        }
    });

    ipcMain.handle('get-categorias', async () => {
        const gastos = await dbAll(db, "SELECT * FROM categorias WHERE tipo='gasto' ORDER BY nombre");
        const ingresos = await dbAll(db, "SELECT * FROM categorias WHERE tipo='ingreso' ORDER BY nombre");
        const impuestos = await dbAll(db, "SELECT * FROM categorias WHERE tipo='impuestos' ORDER BY nombre");
        return { 
            gastos: gastos || [], 
            ingresos: ingresos || [], 
            impuestos: impuestos || [] 
        };
    });

    ipcMain.handle('update-categoria', async (event, data) => {
        const { id, nombre } = data;
        if (!id || !nombre) {
            throw new Error('ID y nombre son requeridos');
        }
        await dbRun(db, "UPDATE categorias SET nombre = ? WHERE id = ?", [nombre.trim(), id]);
        return { success: true, message: 'Categoría actualizada' };
    });

    ipcMain.handle('delete-categoria', async (event, data) => {
        const { id } = data;
        if (!id) {
            throw new Error('ID es requerido');
        }
        await dbRun(db, "DELETE FROM categorias WHERE id = ?", [id]);
        return { success: true, message: 'Categoría eliminada' };
    });

    // ============= GASTOS =============
    
    ipcMain.handle('add-gasto-puntual', async (event, data) => {
        await gastosPuntualesService.add(data);
        return { success: true };
    });

    ipcMain.handle('delete-gasto-puntual', async (event, data) => {
        await gastosPuntualesService.delete(data.id);
        return { success: true };
    });

    ipcMain.handle('update-gasto-puntual', async (event, data) => {
        await gastosPuntualesService.update(data);
        return { success: true };
    });

    ipcMain.handle('add-gasto-mensual', async (event, data) => {
        await gastosMensualesService.add(data);
        return { success: true };
    });

    ipcMain.handle('delete-gasto-mensual', async (event, data) => {
        await gastosMensualesService.delete(data.id);
        return { success: true };
    });

    ipcMain.handle('update-gasto-mensual', async (event, data) => {
        await gastosMensualesService.update(data);
        return { success: true };
    });

    // ============= INGRESOS =============
    
    ipcMain.handle('add-ingreso-puntual', async (event, data) => {
        await ingresosPuntualesService.add(data);
        return { success: true };
    });

    ipcMain.handle('delete-ingreso-puntual', async (event, data) => {
        await ingresosPuntualesService.delete(data.id);
        return { success: true };
    });

    ipcMain.handle('update-ingreso-puntual', async (event, data) => {
        await ingresosPuntualesService.update(data);
        return { success: true };
    });

    ipcMain.handle('add-ingreso-mensual', async (event, data) => {
        await ingresosMensualesService.add(data);
        return { success: true };
    });

    ipcMain.handle('delete-ingreso-mensual', async (event, data) => {
        await ingresosMensualesService.delete(data.id);
        return { success: true };
    });

    ipcMain.handle('update-ingreso-mensual', async (event, data) => {
        await ingresosMensualesService.update(data);
        return { success: true };
    });

    // ============= GASTOS REALES =============

    ipcMain.handle('add-gasto-real', async (event, data) => {
        await gastosRealesService.add(data);
        return { success: true };
    });

    ipcMain.handle('delete-gasto-real', async (event, data) => {
        await gastosRealesService.delete(data.id);
        return { success: true };
    });

    ipcMain.handle('update-gasto-real', async (event, data) => {
        await gastosRealesService.update(data);
        return { success: true };
    });

    // ============= INGRESOS REALES =============

    ipcMain.handle('add-ingreso-real', async (event, data) => {
        await ingresosRealesService.add(data);
        return { success: true };
    });

    ipcMain.handle('delete-ingreso-real', async (event, data) => {
        await ingresosRealesService.delete(data.id);
        return { success: true };
    });

    ipcMain.handle('update-ingreso-real', async (event, data) => {
        await ingresosRealesService.update(data);
        return { success: true };
    });

    // ============= IMPORT BANCO =============
    
    ipcMain.handle('import-gastos-puntuales', async (event, data) => {
        return importBatchWithTransaction(gastosPuntualesService, data?.datos);
    });

    ipcMain.handle('import-ingresos-puntuales', async (event, data) => {
        return importBatchWithTransaction(ingresosPuntualesService, data?.datos);
    });

    // ============= IMPORT REAL (BANCO) =============

    ipcMain.handle('import-gastos-reales', async (event, data) => {
        return importBatchWithTransaction(gastosRealesService, data?.datos);
    });

    ipcMain.handle('import-ingresos-reales', async (event, data) => {
        return importBatchWithTransaction(ingresosRealesService, data?.datos);
    });

    // ============= IMPUESTOS =============
    
    ipcMain.handle('add-impuesto-puntual', async (event, data) => {
        await impuestosPuntualesService.add(data);
        return { success: true };
    });

    ipcMain.handle('delete-impuesto-puntual', async (event, data) => {
        await impuestosPuntualesService.delete(data.id);
        return { success: true };
    });

    ipcMain.handle('update-impuesto-puntual', async (event, data) => {
        await impuestosPuntualesService.update(data);
        return { success: true };
    });

    ipcMain.handle('add-impuesto-mensual', async (event, data) => {
        await impuestosMensualesService.add(data);
        return { success: true };
    });

    ipcMain.handle('delete-impuesto-mensual', async (event, data) => {
        await impuestosMensualesService.delete(data.id);
        return { success: true };
    });

    ipcMain.handle('update-impuesto-mensual', async (event, data) => {
        await impuestosMensualesService.update(data);
        return { success: true };
    });

    // ============= HUCHA =============
    
    ipcMain.handle('get-hucha', async () => {
        return await huchaService.getAll();
    });

    ipcMain.handle('add-hucha', async (event, data) => {
        await huchaService.add(data);
        return { success: true };
    });

    ipcMain.handle('update-hucha', async (event, data) => {
        await huchaService.update(data);
        return { success: true };
    });

    ipcMain.handle('delete-hucha', async (event, data) => {
        await huchaService.delete(data.id);
        return { success: true };
    });

    // ============= SUB-HUCHAS =============

    ipcMain.handle('get-sub-huchas', async () => {
        return await subHuchaService.getAll();
    });

    ipcMain.handle('add-sub-hucha', async (event, data) => {
        await subHuchaService.add(data);
        return { success: true };
    });

    ipcMain.handle('update-sub-hucha', async (event, data) => {
        await subHuchaService.update(data);
        return { success: true };
    });

    ipcMain.handle('delete-sub-hucha', async (event, data) => {
        await subHuchaService.delete(data.id);
        return { success: true };
    });

    ipcMain.handle('get-sub-hucha-puntuales', async (event, id) => {
        return await subHuchaService.getPuntuales(id);
    });

    ipcMain.handle('add-sub-hucha-puntual', async (event, data) => {
        await subHuchaService.addPuntual(data);
        return { success: true };
    });

    ipcMain.handle('delete-sub-hucha-puntual', async (event, data) => {
        await subHuchaService.deletePuntual(data.id);
        return { success: true };
    });

    ipcMain.handle('get-sub-huchas-total', async (event, mes) => {
        const total = await subHuchaService.calcularTotalSubHuchas(mes);
        return { total };
    });

    // ============= CUENTA REMUNERADA =============
    
    ipcMain.handle('get-cuenta-remunerada', async () => {
        const rows = await dbAll(db, "SELECT * FROM cuenta_remunerada ORDER BY created_at DESC");
        return rows || [];
    });

    ipcMain.handle('add-cuenta-remunerada', async (event, data) => {
        const { descripcion, monto, aportacion_mensual, interes, retencion, categoria_id, desde, hasta } = data;
        if (monto === undefined || categoria_id === undefined || !desde || !hasta) {
            throw new Error('Monto, categoría, desde y hasta son requeridos');
        }

        const descripcionFinal = (descripcion || '').trim() || generarDescripcionRandom();
        const interesGenerado = calcularInteresGenerado(monto, aportacion_mensual || 0, interes || 0, desde, hasta);

        await dbRun(db, `
            INSERT INTO cuenta_remunerada (descripcion, monto, aportacion_mensual, interes, retencion, interes_generado, categoria_id, desde, hasta)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [descripcionFinal, monto, aportacion_mensual || null, interes || null, retencion || 0, interesGenerado, categoria_id, desde, hasta]);
        return { success: true };
    });

    ipcMain.handle('update-cuenta-remunerada', async (event, data) => {
        const { id, desde, hasta, monto, aportacion_mensual, interes, retencion, categoria_id, categoria, descripcion } = data;
        if (!id) {
            throw new Error('ID es requerido');
        }

        let catId = categoria_id;
        if (!catId && categoria) {
            const cat = await dbGet(db, "SELECT id FROM categorias WHERE nombre = ? AND tipo = 'ingreso'", [categoria]);
            if (!cat) {
                throw new Error('Categoría no encontrada');
            }
            catId = cat.id;
        }

        if (!catId) {
            throw new Error('Categoría es requerida');
        }

        let descripcionFinal = (descripcion || '').trim();
        if (!descripcionFinal) {
            const existing = await dbGet(db, "SELECT descripcion FROM cuenta_remunerada WHERE id = ?", [id]);
            descripcionFinal = existing?.descripcion || generarDescripcionRandom();
        }
        const interesGenerado = calcularInteresGenerado(monto, aportacion_mensual, interes, desde, hasta);

        await dbRun(db, `
            UPDATE cuenta_remunerada 
            SET descripcion = ?, desde = ?, hasta = ?, monto = ?, aportacion_mensual = ?, interes = ?, retencion = ?, interes_generado = ?, categoria_id = ?
            WHERE id = ?
        `, [descripcionFinal, desde, hasta, monto, aportacion_mensual || null, interes || null, retencion !== undefined ? (parseFloat(retencion) || 0) : 0, interesGenerado, catId, id]);

        return { success: true };
    });

    ipcMain.handle('delete-cuenta-remunerada', async (event, data) => {
        const { id } = data;
        if (!id) {
            throw new Error('ID es requerido');
        }
        await dbRun(db, "DELETE FROM cuenta_remunerada WHERE id = ?", [id]);
        return { success: true };
    });

    // ============= ASSETS (Yahoo Finance) =============
    
    ipcMain.handle('get-assets', async () => {
        const rows = await dbAll(db, `
            SELECT a.*, c.nombre as categoria
            FROM assets a
            JOIN categorias c ON a.categoria_id = c.id
            ORDER BY a.created_at DESC
        `);
        return rows || [];
    });

    ipcMain.handle('add-asset', async (event, data) => {
        const { company, ticker, shares, purchase_price } = data;
        if (!company || !ticker || !shares || !purchase_price) {
            throw new Error('Todos los campos son requeridos');
        }
        
        // Obtener o crear categoría Assets
        let cat = await dbGet(db, 'SELECT id FROM categorias WHERE nombre=? AND tipo="ingreso"', ['Assets']);
        if (!cat || !cat.id) {
            await dbRun(db, 'INSERT INTO categorias (nombre, tipo) VALUES (?, ?)', ['Assets', 'ingreso']);
            cat = await dbGet(db, 'SELECT id FROM categorias WHERE nombre=? AND tipo="ingreso"', ['Assets']);
        }
        
        await dbRun(db, 
            "INSERT INTO assets (company, ticker, shares, purchase_price, categoria_id) VALUES (?, ?, ?, ?, ?)",
            [company, ticker, parseFloat(shares), parseFloat(purchase_price), cat.id]
        );
        return { success: true };
    });

    ipcMain.handle('update-asset', async (event, data) => {
        const { id, company, ticker, shares, purchase_price } = data;
        if (!id) {
            throw new Error('ID es requerido');
        }
        
        // Obtener o crear categoría Assets
        let cat = await dbGet(db, 'SELECT id FROM categorias WHERE nombre=? AND tipo="ingreso"', ['Assets']);
        if (!cat || !cat.id) {
            await dbRun(db, 'INSERT INTO categorias (nombre, tipo) VALUES (?, ?)', ['Assets', 'ingreso']);
            cat = await dbGet(db, 'SELECT id FROM categorias WHERE nombre=? AND tipo="ingreso"', ['Assets']);
        }
        
        await dbRun(db,
            "UPDATE assets SET company=?, ticker=?, shares=?, purchase_price=?, categoria_id=? WHERE id=?",
            [company, ticker, parseFloat(shares), parseFloat(purchase_price), cat.id, id]
        );
        return { success: true };
    });

    ipcMain.handle('delete-asset', async (event, data) => {
        const { id } = data;
        if (!id) {
            throw new Error('ID es requerido');
        }
        await dbRun(db, "DELETE FROM assets WHERE id = ?", [id]);
        return { success: true };
    });

    ipcMain.handle('sell-asset', async (event, data) => {
        const { id, sale_price } = data;
        if (!id || !sale_price) {
            throw new Error('ID y precio de venta son requeridos');
        }

        const asset = await dbGet(db, "SELECT * FROM assets WHERE id = ?", [id]);
        if (!asset) {
            throw new Error('Asset no encontrado');
        }

        const totalInvested = asset.shares * asset.purchase_price;
        const totalSale = asset.shares * sale_price;
        const profit = totalSale - totalInvested;

        // Eliminar el asset
        await dbRun(db, "DELETE FROM assets WHERE id = ?", [id]);

        // Registrar la ganancia o pérdida como ingreso/gasto puntual
        const categoria_id = asset.categoria_id;
        const fecha = new Date().toISOString().slice(0, 10);
        
        if (profit >= 0) {
            // Registrar como ingreso
            await dbRun(db,
                "INSERT INTO ingresos_puntuales (fecha, descripcion, monto, categoria_id) VALUES (?, ?, ?, ?)",
                [fecha, `Venta ${asset.ticker}: Ganancia`, profit, categoria_id]
            );
        } else {
            // Registrar como gasto
            await dbRun(db,
                "INSERT INTO gastos_puntuales (fecha, descripcion, monto, categoria_id) VALUES (?, ?, ?, ?)",
                [fecha, `Venta ${asset.ticker}: Pérdida`, Math.abs(profit), categoria_id]
            );
        }

        return { success: true, profit };
    });

    ipcMain.handle('get-asset-price', async (event, ticker) => {
        const safeTicker = String(ticker || '').trim().toUpperCase();
        if (!safeTicker) {
            return { ticker: safeTicker, currentPrice: null, currency: 'EUR', unavailable: true };
        }

        try {
            return await yahooFinanceService.getAssetPrice(safeTicker);
        } catch (err) {
            console.warn(`⚠️ get-asset-price sin datos para ${safeTicker}: ${err.message}`);
            return { ticker: safeTicker, currentPrice: null, currency: 'EUR', unavailable: true };
        }
    });

    ipcMain.handle('get-asset-history', async (event, ticker, period) => {
        const safeTicker = String(ticker || '').trim().toUpperCase();
        const safePeriod = String(period || '1y').trim() || '1y';
        try {
            return await yahooFinanceService.getHistoricalData(safeTicker, safePeriod);
        } catch (err) {
            console.warn(`WARN get-asset-history sin datos para ${safeTicker} (${safePeriod}): ${err.message}`);
            return {
                ticker: safeTicker,
                period: safePeriod,
                currency: 'EUR',
                data: [],
                unavailable: true,
                mensaje: err.message || 'No se pudieron obtener datos historicos'
            };
        }
    });

    // ============= DASHBOARD =============
    
    ipcMain.handle('get-dashboard-data', async () => {
        return await getDashboardData();
    });

    ipcMain.handle('get-dashboard-real-data', async () => {
        return await getDashboardRealData();
    });

    ipcMain.handle('get-dashboard-rango-fechas', async () => {
        return await getDashboardRangoFechas();
    });

    ipcMain.handle('get-impuestos-mes', async (event, params) => {
        return await getImpuestosMes(params.desde, params.hasta);
    });

    ipcMain.handle('get-impuestos-mes-real', async (event, params) => {
        return await getImpuestosMesReal(params.desde, params.hasta);
    });

    ipcMain.handle('get-ahorros-mes', async (event, params) => {
        return await getAhorrosMes(params.desde, params.hasta, params.categoria_id);
    });

    ipcMain.handle('get-ahorros-mes-real', async (event, params) => {
        return await getAhorrosMesReal(params.desde, params.hasta, params.categoria_id);
    });

    ipcMain.handle('get-categorias-periodo', async (event, params) => {
        return await getCategoriasPeriodo(params.desde, params.hasta);
    });

    ipcMain.handle('get-categorias-periodo-real', async (event, params) => {
        return await getCategoriasPeriodoReal(params.desde, params.hasta);
    });

    ipcMain.handle('get-gastos-categoria-mes', async (event, params) => {
        return await getGastosCategoriaMes(params.desde, params.hasta);
    });

    ipcMain.handle('get-gastos-categoria-mes-real', async (event, params) => {
        return await getGastosCategoriaMesReal(params.desde, params.hasta);
    });

    ipcMain.handle('get-resumen-periodos', async () => {
        return await getResumenPeriodos();
    });

    // ============= IMPORTACION BANCARIA =============
    
    ipcMain.handle('import-list', async () => {
        try {
            const uploadsDir = getUploadsDir();
            
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const archivos = fs.readdirSync(uploadsDir);
            
            const lista = archivos.map(archivo => {
                const rutaCompleta = path.join(uploadsDir, archivo);
                const stats = fs.statSync(rutaCompleta);
                
                // Intentar extraer timestamp del nombre (formato: timestamp_nombre.ext)
                const parts = archivo.split('_');
                const timestamp = parseInt(parts[0]);
                
                let nombre, fechaGuardado;
                
                // Si el primer segmento es un timestamp válido (número de 13 dígitos)
                if (!isNaN(timestamp) && timestamp.toString().length === 13) {
                    nombre = archivo.substring(timestamp.toString().length + 1); // Sin timestamp
                    fechaGuardado = new Date(timestamp).toISOString();
                } else {
                    // Archivo sin timestamp, usar nombre completo y fecha de modificación
                    nombre = archivo;
                    fechaGuardado = stats.mtime.toISOString();
                }
                
                return {
                    id: archivo,
                    nombre,
                    archivo: archivo,
                    fechaGuardado,
                    tamaño: stats.size,
                    tipo: path.extname(archivo).toLowerCase()
                };
            }).sort((a, b) => new Date(b.fechaGuardado) - new Date(a.fechaGuardado));
            
            console.log(`📋 Se listaron ${lista.length} archivos guardados`);
            return { success: true, archivos: lista };
        } catch (error) {
            console.error('❌ Error listando archivos:', error);
            throw error;
        }
    });

    ipcMain.handle('import-content', async (event, id) => {
        console.log('📖 import-content llamado con id:', id, 'tipo:', typeof id);
        
        // Asegurar que id es un string
        const idStr = String(id);
        const rutaArchivo = path.join(getUploadsDir(), idStr);
        
        if (!fs.existsSync(rutaArchivo)) {
            throw new Error('Archivo no encontrado: ' + idStr);
        }
        
        const contenido = fs.readFileSync(rutaArchivo, 'base64');
        
        // Extraer nombre sin timestamp si existe
        let nombreSinTimestamp = idStr;
        const parts = idStr.split('_');
        const timestamp = parseInt(parts[0]);
        
        // Si tiene timestamp válido, quitarlo del nombre
        if (!isNaN(timestamp) && timestamp.toString().length === 13) {
            nombreSinTimestamp = idStr.substring(timestamp.toString().length + 1);
        }
        
        console.log('✅ Contenido del archivo enviado:', idStr);
        return { success: true, nombre: nombreSinTimestamp, contenido };
    });

    ipcMain.handle('import-delete', async (event, id) => {
        console.log('🗑️ import-delete llamado con id:', id, 'tipo:', typeof id);
        
        // Asegurar que id es un string
        const idStr = String(id);
        const rutaArchivo = path.join(getUploadsDir(), idStr);
        
        if (!fs.existsSync(rutaArchivo)) {
            throw new Error('Archivo no encontrado: ' + idStr);
        }
        
        fs.unlinkSync(rutaArchivo);
        console.log('✅ Archivo eliminado:', idStr);
        return { success: true };
    });

    ipcMain.handle('import-save', async (event, data) => {
        const { filename, contenido } = data;
        if (!filename || !contenido) {
            throw new Error('Filename y contenido son requeridos');
        }

        const uploadsDir = getUploadsDir();
        
        // Asegurar que el directorio existe
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const sanitizedName = filename.replace(/\s+/g, '_');
        const uniqueFilename = `${timestamp}_${sanitizedName}`;
        const filePath = path.join(uploadsDir, uniqueFilename);
        
        // Guardar archivo físico
        const buffer = Buffer.from(contenido, 'base64');
        fs.writeFileSync(filePath, buffer);
        console.log(`💾 Archivo guardado físicamente: ${uniqueFilename}`);
        
        return { success: true, message: 'Archivo guardado correctamente', filename: uniqueFilename };
    });

    console.log('✅ IPC Handlers registrados');
}

module.exports = { registerIpcHandlers };
