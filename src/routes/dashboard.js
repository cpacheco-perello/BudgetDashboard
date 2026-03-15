const express = require('express');
const db = require('../config/database');
const config = require('../config/config');
const { dbGet, dbAll } = require('../utils/dbHelpers');
const PuntualService = require('../services/PuntualService');
const MensualService = require('../services/MensualService');
const { 
    calcularInteresGenerado, 
    calcularInteresesMensuales,
    restarFecha,
    contarMesesDesde28,
    generarArrayMeses,
    calcularMontoIpc,
    esMensualActivo,
    agregarPuntualesPorMes,
    agregarMensualesPorMes,
    agregarImpuestosPuntualesPorMes,
    agregarImpuestosMensualesPorMes
} = require('../utils/calculations');

const router = express.Router();

// Servicios
const gastosPuntualesService = new PuntualService('gastos_puntuales');
const gastosMensualesService = new MensualService('gastos_mensuales');
const ingresosPuntualesService = new PuntualService('ingresos_puntuales');
const ingresosMensualesService = new MensualService('ingresos_mensuales');
const gastosRealesService = new PuntualService('gastos_reales');
const ingresosRealesService = new PuntualService('ingresos_reales');
const impuestosPuntualesService = new PuntualService('impuestos_puntuales');
const impuestosMensualesService = new MensualService('impuestos_mensuales');

/**
 * GET /dashboard - Obtener todos los datos para las tablas del dashboard
 */
router.get('/dashboard', async (req, res) => {
    try {
        const hoy = new Date();
        const gastos_puntuales_raw = await gastosPuntualesService.getAll(config.QUERY_LIMIT);
        const gastos_mensuales_raw = await gastosMensualesService.getAll(config.QUERY_LIMIT);
        const ingresos_puntuales = await ingresosPuntualesService.getAll(config.QUERY_LIMIT);
        const ingresos_mensuales = await ingresosMensualesService.getAll(config.QUERY_LIMIT);
        const impuestos_puntuales = await impuestosPuntualesService.getAll(config.QUERY_LIMIT);
        const impuestos_mensuales = await impuestosMensualesService.getAll(config.QUERY_LIMIT);
        const gastos_reales = await gastosRealesService.getAll(config.QUERY_LIMIT);
        const ingresos_reales = await ingresosRealesService.getAll(config.QUERY_LIMIT);

        const cuenta_remunerada = await dbAll(db, `
            SELECT cr.id, cr.descripcion, cr.monto, cr.aportacion_mensual, cr.interes, cr.desde, cr.hasta, c.nombre AS categoria
            FROM cuenta_remunerada cr
            JOIN categorias c ON cr.categoria_id = c.id
            ORDER BY cr.desde DESC
            LIMIT ?
        `, [config.QUERY_LIMIT]);

        const cuenta_remunerada_con_interes = cuenta_remunerada.map(cr => ({
            ...cr,
            interes_generado: cr.interes ? calcularInteresGenerado(cr.monto, cr.aportacion_mensual || 0, cr.interes, cr.desde, cr.hasta) : 0
        }));

        const gastos_puntuales = gastos_puntuales_raw;

        const gastos_mensuales = gastos_mensuales_raw.map(g => ({
            ...g,
            ipc_porcentaje: g.ipc_porcentaje || 0,
            monto_ajustado: calcularMontoIpc(g.monto, g.ipc_porcentaje, g.desde, hoy)
        }));

        res.json({
            gastos_puntuales,
            gastos_mensuales,
            ingresos_puntuales,
            ingresos_mensuales,
            impuestos_puntuales,
            impuestos_mensuales,
            gastos_reales,
            ingresos_reales,
            cuenta_remunerada: cuenta_remunerada_con_interes
        });

    } catch(err) {
        console.error('Error en /dashboard:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /dashboard-rango-fechas - Obtener rango de fechas disponible
 */
router.get('/dashboard-rango-fechas', async (req, res) => {
    const formatDateLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    try {
        const row = await dbGet(db, `
            SELECT MIN(fecha) AS min, MAX(fecha) AS max
            FROM (
                SELECT fecha FROM gastos_puntuales
                UNION ALL SELECT fecha FROM ingresos_puntuales
                UNION ALL SELECT fecha FROM impuestos_puntuales
                UNION ALL SELECT fecha FROM gastos_reales
                UNION ALL SELECT fecha FROM ingresos_reales
                UNION ALL SELECT desde AS fecha FROM gastos_mensuales
                UNION ALL SELECT hasta AS fecha FROM gastos_mensuales
                UNION ALL SELECT desde AS fecha FROM ingresos_mensuales
                UNION ALL SELECT hasta AS fecha FROM ingresos_mensuales
                UNION ALL SELECT desde AS fecha FROM impuestos_mensuales
                UNION ALL SELECT hasta AS fecha FROM impuestos_mensuales
                UNION ALL SELECT desde AS fecha FROM cuenta_remunerada
                UNION ALL SELECT hasta AS fecha FROM cuenta_remunerada
            )
            WHERE fecha IS NOT NULL
        `);

        if (!row || !row.min || !row.max) {
            const hoy = new Date();
            const haceUnAnio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
            return res.json({ min: formatDateLocal(haceUnAnio), max: formatDateLocal(hoy) });
        }

        return res.json({ min: row.min, max: row.max });
    } catch (err) {
        console.error('Error en /dashboard-rango-fechas:', err);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * GET /dashboard-real - Obtener datos base para dashboard real
 */
router.get('/dashboard-real', async (req, res) => {
    try {
        const gastos_reales = await gastosRealesService.getAll(config.QUERY_LIMIT);
        const ingresos_reales = await ingresosRealesService.getAll(config.QUERY_LIMIT);

        res.json({
            gastos_reales,
            ingresos_reales,
            cuenta_remunerada: []
        });
    } catch (err) {
        console.error('Error en /dashboard-real:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /impuestos-mes - Obtener impuestos ingresos  agrupados por mes
 */
router.get('/impuestos-mes', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const hastaDate = new Date(hasta);
        const meses = generarArrayMeses(desde, hasta, { impuestos: 0 });

        const ingresosPBruto = await dbAll(db, `
            SELECT bruto, monto, fecha 
            FROM ingresos_puntuales 
            WHERE fecha BETWEEN ? AND ? AND bruto IS NOT NULL AND bruto != monto
        `, [desde, hasta]);
        
        agregarImpuestosPuntualesPorMes(ingresosPBruto, meses, 'impuestos');

        const ingresosMBruto = await dbAll(db, `
            SELECT bruto, monto, desde, hasta 
            FROM ingresos_mensuales 
            WHERE bruto IS NOT NULL AND bruto != monto
        `);
        
        agregarImpuestosMensualesPorMes(ingresosMBruto, meses, hastaDate, 'impuestos');

        res.json(meses);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /impuestos-mes-real - Impuestos reales (no aplica, retorna cero)
 */
router.get('/impuestos-mes-real', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const meses = generarArrayMeses(desde, hasta, { impuestos: 0 });
        res.json(meses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /ahorros-mes - devuelve  ingresos netos: , 
            cuentas_remuneradas generado intereses: , 
            gastos: tabla gastos mensuales + puntuales, 
            impuestos_ingresos: calculados desde ingresos (bruto - monto), 
            impuestos_otros: tabla impuestos puntuales + mensuales, 
            ahorros:  (ingresos + cuentas_remuneradas) - gastos - impuestos_otros
 */
router.get('/ahorros-mes', async (req, res) => {
    try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const hastaDate = new Date(hasta);
        const meses = generarArrayMeses(desde, hasta, { 
            ingresos: 0, 
            cuentas_remuneradas: 0, 
            gastos: 0, 
            impuestos_ingresos: 0, 
            impuestos_otros: 0, 
            ahorros: 0 
        });

        // Ingresos
        const ingresosP = await ingresosPuntualesService.getByMonth(desde, hasta, categoria_id);
        agregarPuntualesPorMes(ingresosP, meses, 'ingresos');

        const ingresosM = await ingresosMensualesService.getAllForCalculations(categoria_id);
        agregarMensualesPorMes(ingresosM, meses, hastaDate, 'ingresos');

        // Cuenta remunerada
        const cuentasRemuneradas = await dbAll(db, "SELECT monto, aportacion_mensual, interes, desde, hasta FROM cuenta_remunerada");
        cuentasRemuneradas.forEach(cr => {
            const interesesMensuales = calcularInteresesMensuales(cr.monto, cr.aportacion_mensual || 0, cr.interes || 0, cr.desde, cr.hasta);
            meses.forEach(m => {
                if (esMensualActivo(m.mes, hastaDate, cr.desde, cr.hasta)) {
                    m.cuentas_remuneradas += interesesMensuales[m.mes] || 0;
                }
            });
        });

        // Gastos puntuales (sin IPC)
        const gastosP = await gastosPuntualesService.getByMonth(desde, hasta, categoria_id);
        agregarPuntualesPorMes(gastosP, meses, 'gastos');

        let gastosMQuery = `SELECT monto, desde, hasta, ipc_porcentaje FROM gastos_mensuales`;
        const gastosMParams = [];
        if (categoria_id) {
            gastosMQuery += ' WHERE categoria_id = ?';
            gastosMParams.push(categoria_id);
        }
        const gastosM = await dbAll(db, gastosMQuery, gastosMParams);
        gastosM.forEach(g => {
            meses.forEach(m => {
                if (esMensualActivo(m.mes, hastaDate, g.desde, g.hasta)) {
                    const targetDate = new Date(`${m.mes}-01`);
                    m.gastos += calcularMontoIpc(g.monto, g.ipc_porcentaje, g.desde, targetDate);
                }
            });
        });

        // Impuestos desde ingresos (bruto - monto)
        const ingresosPBruto = await dbAll(db, `
            SELECT bruto, monto, fecha 
            FROM ingresos_puntuales 
            WHERE fecha BETWEEN ? AND ? AND bruto IS NOT NULL AND bruto != monto
        `, [desde, hasta]);
        agregarImpuestosPuntualesPorMes(ingresosPBruto, meses, 'impuestos_ingresos');

        const ingresosMBruto = await dbAll(db, `
            SELECT bruto, monto, desde, hasta 
            FROM ingresos_mensuales 
            WHERE bruto IS NOT NULL AND bruto != monto
        `);
        agregarImpuestosMensualesPorMes(ingresosMBruto, meses, hastaDate, 'impuestos_ingresos');

        // Impuestos otros (tabla impuestos)
        const impuestosP = await dbAll(db, `
            SELECT monto, fecha
            FROM impuestos_puntuales
            WHERE fecha BETWEEN ? AND ?
        `, [desde, hasta]);
        agregarPuntualesPorMes(impuestosP, meses, 'impuestos_otros');

        const impuestosM = await dbAll(db, `
            SELECT monto, desde, hasta
            FROM impuestos_mensuales
        `);
        agregarMensualesPorMes(impuestosM, meses, hastaDate, 'impuestos_otros');

        // Calcular ahorros
        meses.forEach(m => m.ahorros = (m.ingresos + m.cuentas_remuneradas) - m.gastos - m.impuestos_otros);

        res.json(meses);

    } catch(err) {
        console.error('❌ Error en /ahorros-mes:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /ahorros-mes-real - Ahorros usando ingresos/gastos reales
 */
router.get('/ahorros-mes-real', async (req, res) => {
    try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const meses = generarArrayMeses(desde, hasta, {
            ingresos: 0,
            cuentas_remuneradas: 0,
            gastos: 0,
            impuestos_ingresos: 0,
            impuestos_otros: 0,
            ahorros: 0
        });

        const ingresosP = await ingresosRealesService.getByMonth(desde, hasta, categoria_id);
        agregarPuntualesPorMes(ingresosP, meses, 'ingresos');

        const gastosP = await gastosRealesService.getByMonth(desde, hasta, categoria_id);
        agregarPuntualesPorMes(gastosP, meses, 'gastos');

        meses.forEach(m => {
            m.ahorros = (m.ingresos + m.cuentas_remuneradas) - m.gastos - m.impuestos_otros;
        });

        res.json(meses);
    } catch (err) {
        console.error('❌ Error en /ahorros-mes-real:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /categorias-periodo - Obtener gastos e ingresos por categoría en un período
 */
router.get('/categorias-periodo', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const gastosCat = {};
        const ingresosCat = {};

        const gastosP = await dbAll(db, `
            SELECT g.monto, c.nombre AS categoria
            FROM gastos_puntuales g
            JOIN categorias c ON g.categoria_id = c.id
            WHERE g.fecha BETWEEN ? AND ?
        `, [desde, hasta]);
        gastosP.forEach(g => {
            gastosCat[g.categoria] = (gastosCat[g.categoria] || 0) + g.monto;
        });

        const gastosM = await dbAll(db, `
            SELECT g.monto, g.desde, g.hasta, g.ipc_porcentaje, c.nombre AS categoria
            FROM gastos_mensuales g
            JOIN categorias c ON g.categoria_id = c.id
        `);
        gastosM.forEach(g => {
            const gDesde = new Date(g.desde + "-28");
            const gHasta = g.hasta ? new Date(g.hasta + "-28") : new Date(9999,11,31);
            let current = new Date(Math.max(gDesde, desdeDate));
            current.setDate(28);
            const end = new Date(Math.min(gHasta, hastaDate));
            while(current <= end){
                const targetDate = new Date(current.getFullYear(), current.getMonth(), 1);
                const montoAdj = calcularMontoIpc(g.monto, g.ipc_porcentaje, g.desde, targetDate);
                gastosCat[g.categoria] = (gastosCat[g.categoria] || 0) + montoAdj;
                current.setMonth(current.getMonth() + 1);
            }
        });

        const ingresosP = await dbAll(db, `
            SELECT i.monto, c.nombre AS categoria
            FROM ingresos_puntuales i
            JOIN categorias c ON i.categoria_id = c.id
            WHERE i.fecha BETWEEN ? AND ?
        `, [desde, hasta]);
        ingresosP.forEach(i => ingresosCat[i.categoria] = (ingresosCat[i.categoria] || 0) + i.monto);

        const ingresosM = await dbAll(db, `
            SELECT i.monto, i.desde, i.hasta, c.nombre AS categoria
            FROM ingresos_mensuales i
            JOIN categorias c ON i.categoria_id = c.id
        `);
        ingresosM.forEach(i => {
            const iDesde = new Date(i.desde + "-28");
            const iHasta = i.hasta ? new Date(i.hasta + "-28") : new Date(9999,11,31);
            let current = new Date(Math.max(iDesde, desdeDate));
            current.setDate(28);
            const end = new Date(Math.min(iHasta, hastaDate));
            while(current <= end){
                ingresosCat[i.categoria] = (ingresosCat[i.categoria] || 0) + i.monto;
                current.setMonth(current.getMonth() + 1);
            }
        });

        res.json({ gastos: gastosCat, ingresos: ingresosCat });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /categorias-periodo-real - Obtener gastos e ingresos reales por categoria
 */
router.get('/categorias-periodo-real', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const gastos = await dbAll(db, `
            SELECT c.nombre AS categoria, SUM(gr.monto) AS total
            FROM gastos_reales gr
            JOIN categorias c ON gr.categoria_id = c.id
            WHERE gr.fecha BETWEEN ? AND ?
            GROUP BY c.nombre
        `, [desde, hasta]);

        const ingresos = await dbAll(db, `
            SELECT c.nombre AS categoria, SUM(ir.monto) AS total
            FROM ingresos_reales ir
            JOIN categorias c ON ir.categoria_id = c.id
            WHERE ir.fecha BETWEEN ? AND ?
            GROUP BY c.nombre
        `, [desde, hasta]);

        const gastosCat = {};
        const ingresosCat = {};
        gastos.forEach(g => gastosCat[g.categoria] = g.total);
        ingresos.forEach(i => ingresosCat[i.categoria] = i.total);

        res.json({ gastos: gastosCat, ingresos: ingresosCat });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /gastos-categoria-mes - Obtener gastos por categoría y mes (se añade impuestos tabla standalone)
 */
router.get('/gastos-categoria-mes', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const hastaDate = new Date(hasta);
        const meses = generarArrayMeses(desde, hasta);
        
        // Crear objeto para datos de categorías por mes
        const dataMesCat = {};
        meses.forEach(m => dataMesCat[m.mes] = {});

        // Gastos puntuales
        const gastosP = await dbAll(db, `
            SELECT g.monto, c.nombre AS categoria, g.fecha
            FROM gastos_puntuales g
            JOIN categorias c ON g.categoria_id = c.id
            WHERE g.fecha BETWEEN ? AND ?
        `, [desde, hasta]);
        gastosP.forEach(g => {
            const mes = g.fecha.slice(0,7);
            if(dataMesCat[mes]) dataMesCat[mes][g.categoria] = (dataMesCat[mes][g.categoria] || 0) + g.monto;
        });

        // Gastos mensuales
        const gastosM = await dbAll(db, `
            SELECT g.monto, g.desde, g.hasta, g.ipc_porcentaje, c.nombre AS categoria
            FROM gastos_mensuales g
            JOIN categorias c ON g.categoria_id = c.id
        `);
        gastosM.forEach(g => {
            meses.forEach(m => {
                if (esMensualActivo(m.mes, hastaDate, g.desde, g.hasta)) {
                    const targetDate = new Date(`${m.mes}-01`);
                    const montoAdj = calcularMontoIpc(g.monto, g.ipc_porcentaje, g.desde, targetDate);
                    dataMesCat[m.mes][g.categoria] = (dataMesCat[m.mes][g.categoria] || 0) + montoAdj;
                }
            });
        });

        // Impuestos puntuales como categoría "taxes"
        const impuestosP = await dbAll(db, `
            SELECT i.monto, i.fecha
            FROM impuestos_puntuales i
            WHERE i.fecha BETWEEN ? AND ?
        `, [desde, hasta]);
        impuestosP.forEach(i => {
            const mes = i.fecha.slice(0,7);
            if(dataMesCat[mes]) dataMesCat[mes]['taxes'] = (dataMesCat[mes]['taxes'] || 0) + i.monto;
        });

        // Impuestos mensuales
        const impuestosM = await dbAll(db, `
            SELECT i.monto, i.desde, i.hasta
            FROM impuestos_mensuales i
        `);
        impuestosM.forEach(i => {
            meses.forEach(m => {
                if(esMensualActivo(m.mes, hastaDate, i.desde, i.hasta)){
                    dataMesCat[m.mes]['taxes'] = (dataMesCat[m.mes]['taxes'] || 0) + i.monto;
                }
            });
        });

        res.json(dataMesCat);

    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /gastos-categoria-mes-real - Gastos reales por categoria y mes
 */
router.get('/gastos-categoria-mes-real', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const meses = generarArrayMeses(desde, hasta);
        const dataMesCat = {};
        meses.forEach(m => dataMesCat[m.mes] = {});

        const gastosP = await dbAll(db, `
            SELECT gr.monto, c.nombre AS categoria, gr.fecha
            FROM gastos_reales gr
            JOIN categorias c ON gr.categoria_id = c.id
            WHERE gr.fecha BETWEEN ? AND ?
        `, [desde, hasta]);

        gastosP.forEach(g => {
            const mes = g.fecha.slice(0, 7);
            if (dataMesCat[mes]) {
                dataMesCat[mes][g.categoria] = (dataMesCat[mes][g.categoria] || 0) + g.monto;
            }
        });

        res.json(dataMesCat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cache para resumen
let resumenCache = null;
let resumenCacheTime = 0;

/**
 * GET /resumen-periodos - Obtener resumen de múltiples períodos (con caché)
 */
router.get('/resumen-periodos', async (req,res) => {
    try {
        const ahora = Date.now();
        if (resumenCache && (ahora - resumenCacheTime) < config.CACHE_DURATION) {
            return res.json(resumenCache);
        }

        const hoy = new Date();
        const periodos = {
            '1mes': restarFecha(hoy, 1, 'months'),
            '3meses': restarFecha(hoy, 3, 'months'),
            '6meses': restarFecha(hoy, 6, 'months'),
            '1año': restarFecha(hoy, 1, 'years'),
            '5años': restarFecha(hoy, 5, 'years'),
            '10años': restarFecha(hoy, 10, 'years')
        };
        const resultado = {};

        const sumarMensualConIpc = (registro, desdeStr, hastaStr) => {
            const desdeDate = new Date(desdeStr);
            const hastaDate = new Date(hastaStr);
            const rDesde = new Date(registro.desde + "-28");
            const rHasta = registro.hasta ? new Date(registro.hasta + "-28") : new Date(9999, 11, 31);
            let current = new Date(Math.max(rDesde, desdeDate));
            current.setDate(28);
            const end = new Date(Math.min(rHasta, hastaDate));
            let total = 0;

            while (current <= end) {
                const targetDate = new Date(current.getFullYear(), current.getMonth(), 1);
                total += calcularMontoIpc(registro.monto, registro.ipc_porcentaje, registro.desde, targetDate);
                current.setMonth(current.getMonth() + 1);
            }

            return total;
        };

        const ingresosM = await dbAll(db, `SELECT monto, desde, hasta FROM ingresos_mensuales LIMIT 1000`);
        const cuentasRemuneradas = await dbAll(db, `SELECT monto, desde, hasta FROM cuenta_remunerada LIMIT 1000`);
        const gastosM = await dbAll(db, `SELECT monto, desde, hasta, ipc_porcentaje FROM gastos_mensuales LIMIT 1000`);
        const ingresosMBruto = await dbAll(db, `SELECT bruto, monto, desde, hasta FROM ingresos_mensuales WHERE bruto IS NOT NULL AND bruto != monto LIMIT 1000`);
        const impuestosMensuales = await dbAll(db, `SELECT monto, desde, hasta FROM impuestos_mensuales LIMIT 1000`);

        for(const [periodo, desde] of Object.entries(periodos)){
            const hasta = hoy;
            const desdeStr = desde.toISOString().slice(0,10);
            const hastaStr = hasta.toISOString().slice(0,10);

            const ingresosP = (await dbGet(db, `SELECT IFNULL(SUM(monto),0) as total FROM ingresos_puntuales WHERE fecha BETWEEN ? AND ? LIMIT 1000`, [desdeStr, hastaStr])).total;

            let totalIngresosMensuales = 0;
            ingresosM.forEach(i => totalIngresosMensuales += i.monto * contarMesesDesde28(desdeStr, hastaStr, i.desde, i.hasta));

            let totalCuentaRemunerada = 0;
            cuentasRemuneradas.forEach(cr => totalCuentaRemunerada += cr.monto * contarMesesDesde28(desdeStr, hastaStr, cr.desde, cr.hasta));

            const totalIngresos = ingresosP + totalIngresosMensuales + totalCuentaRemunerada;

            const gastosP = (await dbAll(db, `SELECT IFNULL(SUM(monto),0) as total FROM gastos_puntuales WHERE fecha BETWEEN ? AND ? LIMIT 1000`, [desdeStr, hastaStr]))[0]?.total || 0;

            let totalGastosMensuales = 0;
            gastosM.forEach(g => {
                totalGastosMensuales += sumarMensualConIpc(g, desdeStr, hastaStr);
            });

            const totalGastos = gastosP + totalGastosMensuales;

            const ingresosPBruto = await dbAll(db, `SELECT bruto, monto FROM ingresos_puntuales WHERE fecha BETWEEN ? AND ? AND bruto IS NOT NULL AND bruto != monto LIMIT 1000`, [desdeStr, hastaStr]);
            let totalImpuestosPuntuales = 0;
            ingresosPBruto.forEach(i => totalImpuestosPuntuales += i.bruto - i.monto);

            let totalImpuestosMensuales = 0;
            ingresosMBruto.forEach(i => {
                const meses = contarMesesDesde28(desdeStr, hastaStr, i.desde, i.hasta);
                totalImpuestosMensuales += (i.bruto - i.monto) * meses;
            });

            const impuestosPuntuales = (await dbGet(db, `SELECT IFNULL(SUM(monto),0) as total FROM impuestos_puntuales WHERE fecha BETWEEN ? AND ? LIMIT 1000`, [desdeStr, hastaStr])).total;
            
            let totalImpuestosStandaloneMensuales = 0;
            impuestosMensuales.forEach(i => totalImpuestosStandaloneMensuales += i.monto * contarMesesDesde28(desdeStr, hastaStr, i.desde, i.hasta));

            const totalImpuestos = totalImpuestosPuntuales + totalImpuestosMensuales + impuestosPuntuales + totalImpuestosStandaloneMensuales;

            resultado[periodo] = {
                ingresos: parseFloat(totalIngresos.toFixed(2)),
                gastos: parseFloat(totalGastos.toFixed(2)),
                ahorro: parseFloat((totalIngresos - totalGastos).toFixed(2)),
                impuestos: parseFloat(totalImpuestos.toFixed(2))
            };
        }

        resumenCache = resultado;
        resumenCacheTime = ahora;

        res.json(resultado);

    } catch(err) {
        console.error('Error en /resumen-periodos:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
