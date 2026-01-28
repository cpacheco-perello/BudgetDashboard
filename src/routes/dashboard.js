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
    contarMesesDesde28 
} = require('../utils/calculations');

const router = express.Router();

// Servicios
const gastosPuntualesService = new PuntualService('gastos_puntuales');
const gastosMensualesService = new MensualService('gastos_mensuales');
const ingresosPuntualesService = new PuntualService('ingresos_puntuales');
const ingresosMensualesService = new MensualService('ingresos_mensuales');
const impuestosPuntualesService = new PuntualService('impuestos_puntuales');
const impuestosMensualesService = new MensualService('impuestos_mensuales');

/**
 * GET /dashboard - Obtener todos los datos para el dashboard
 */
router.get('/dashboard', async (req, res) => {
    try {
        const gastos_puntuales = await gastosPuntualesService.getAll(config.QUERY_LIMIT);
        const gastos_mensuales = await gastosMensualesService.getAll(config.QUERY_LIMIT);
        const ingresos_puntuales = await ingresosPuntualesService.getAll(config.QUERY_LIMIT);
        const ingresos_mensuales = await ingresosMensualesService.getAll(config.QUERY_LIMIT);
        const impuestos_puntuales = await impuestosPuntualesService.getAll(config.QUERY_LIMIT);
        const impuestos_mensuales = await impuestosMensualesService.getAll(config.QUERY_LIMIT);

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

        res.json({
            gastos_puntuales,
            gastos_mensuales,
            ingresos_puntuales,
            ingresos_mensuales,
            impuestos_puntuales,
            impuestos_mensuales,
            cuenta_remunerada: cuenta_remunerada_con_interes
        });

    } catch(err) {
        console.error('Error en /dashboard:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /gastos-periodo - Obtener gastos por período
 */
router.get('/gastos-periodo', async (req, res) => {
    try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const totalPuntuales = await gastosPuntualesService.getByPeriod(desde, hasta, categoria_id);
        const gastosMensuales = await gastosMensualesService.getAllForCalculations(categoria_id);

        let totalMensuales = 0;
        gastosMensuales.forEach(g => {
            const gDesde = new Date(g.desde + "-28");
            const gHasta = g.hasta ? new Date(g.hasta + "-28") : new Date(9999,11,31);
            const end = hastaDate < gHasta ? hastaDate : gHasta;
            let current = new Date(gDesde > desdeDate ? gDesde : desdeDate);

            while (current <= end) {
                totalMensuales += g.monto;
                current.setMonth(current.getMonth() + 1);
            }
        });

        res.json({
            totalPuntuales,
            totalMensuales,
            totalGastos: totalPuntuales + totalMensuales
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /ingresos-periodo - Obtener ingresos por período
 */
router.get('/ingresos-periodo', async (req, res) => {
    try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const totalPuntuales = await ingresosPuntualesService.getByPeriod(desde, hasta, categoria_id);
        const ingresosMensuales = await ingresosMensualesService.getAllForCalculations(categoria_id);

        let totalMensuales = 0;
        ingresosMensuales.forEach(i => {
            const iDesde = new Date(i.desde + "-28");
            const iHasta = i.hasta ? new Date(i.hasta + "-28") : new Date(9999,11,31);
            const end = hastaDate < iHasta ? hastaDate : iHasta;
            let current = new Date(iDesde > desdeDate ? iDesde : desdeDate);

            while (current <= end) {
                totalMensuales += i.monto;
                current.setMonth(current.getMonth() + 1);
            }
        });

        const cuentaRemunerada = await dbAll(db, "SELECT monto, desde, hasta FROM cuenta_remunerada");

        let totalCuentaRemunerada = 0;
        cuentaRemunerada.forEach(cr => {
            const crDesde = new Date(cr.desde + "-28");
            const crHasta = cr.hasta ? new Date(cr.hasta + "-28") : new Date(9999,11,31);
            const end = hastaDate < crHasta ? hastaDate : crHasta;
            let current = new Date(crDesde > desdeDate ? crDesde : desdeDate);

            while (current <= end) {
                totalCuentaRemunerada += cr.monto;
                current.setMonth(current.getMonth() + 1);
            }
        });

        res.json({
            totalPuntuales,
            totalMensuales,
            totalCuentaRemunerada,
            totalIngresos: totalPuntuales + totalMensuales + totalCuentaRemunerada
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /gastos-mes - Obtener gastos agrupados por mes
 */
router.get('/gastos-mes', async (req,res) => {
    try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const meses = [];
        let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
        const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
        while(current <= end){
            const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
            meses.push({ mes: mesStr, total: 0 });
            current.setMonth(current.getMonth()+1);
        }

        const gastosP = await gastosPuntualesService.getByMonth(desde, hasta, categoria_id);
        gastosP.forEach(g => {
            const mes = g.fecha.slice(0,7);
            const m = meses.find(x=>x.mes===mes);
            if(m) m.total += g.monto;
        });

        const gastosMensuales = await gastosMensualesService.getAllForCalculations(categoria_id);
        gastosMensuales.forEach(g=>{
            const start = new Date(g.desde + "-28");
            const finish = g.hasta ? new Date(g.hasta + "-28") : new Date(9999,11,31);
            const endRef = hastaDate < finish ? hastaDate : finish;

            meses.forEach(m=>{
                const mes28 = new Date(m.mes + "-28");
                if(mes28 >= start && mes28 <= endRef){
                    m.total += g.monto;
                }
            });
        });

        res.json(meses);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /ingresos-mes - Obtener ingresos agrupados por mes
 */
router.get('/ingresos-mes', async (req,res) => {  
    try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const meses = [];
        let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
        const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
        while(current <= end){
            const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
            meses.push({ mes: mesStr, total: 0 });
            current.setMonth(current.getMonth()+1);
        }

        const ingresosP = await ingresosPuntualesService.getByMonth(desde, hasta, categoria_id);
        ingresosP.forEach(i=>{
            const mes = i.fecha.slice(0,7);
            const m = meses.find(x=>x.mes===mes);
            if(m) m.total += i.monto;
        });

        const ingresosMensuales = await ingresosMensualesService.getAllForCalculations(categoria_id);
        ingresosMensuales.forEach(i=>{
            const start = new Date(i.desde + "-28");
            const finish = i.hasta ? new Date(i.hasta + "-28") : new Date(9999,11,31);
            const endRef = hastaDate < finish ? hastaDate : finish;

            meses.forEach(m=>{
                const mes28 = new Date(m.mes + "-28");
                if(mes28 >= start && mes28 <= endRef){
                    m.total += i.monto;
                }
            });
        });

        res.json(meses);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /impuestos-mes - Obtener impuestos agrupados por mes
 */
router.get('/impuestos-mes', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const meses = [];
        let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
        const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
        while(current <= end){
            const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
            meses.push({ mes: mesStr, impuestos: 0 });
            current.setMonth(current.getMonth()+1);
        }

        const ingresosPBruto = await dbAll(db, `
            SELECT bruto, monto, fecha 
            FROM ingresos_puntuales 
            WHERE fecha BETWEEN ? AND ? AND bruto IS NOT NULL AND bruto != monto
        `, [desde, hasta]);
        
        ingresosPBruto.forEach(i => {
            const mes = i.fecha.slice(0, 7);
            const m = meses.find(x => x.mes === mes);
            if(m) m.impuestos += i.bruto - i.monto;
        });

        const ingresosMBruto = await dbAll(db, `
            SELECT bruto, monto, desde, hasta 
            FROM ingresos_mensuales 
            WHERE bruto IS NOT NULL AND bruto != monto
        `);
        
        ingresosMBruto.forEach(i => {
            meses.forEach(m => {
                const mes28 = new Date(m.mes + "-28");
                const inicio28 = new Date(i.desde + "-28");
                const fin28 = i.hasta ? new Date(i.hasta + "-28") : new Date(9999, 11, 31);
                
                if(mes28 >= inicio28 && mes28 <= fin28 && mes28 <= hastaDate) {
                    m.impuestos += i.bruto - i.monto;
                }
            });
        });

        res.json(meses);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /ahorros-mes - Obtener ahorros agrupados por mes
 */
router.get('/ahorros-mes', async (req, res) => {
    try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const meses = [];
        let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
        const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
        while(current <= end){
            const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
            meses.push({ mes: mesStr, ingresos: 0, cuentas_remuneradas: 0, gastos: 0, impuestos_ingresos: 0, impuestos_otros: 0, ahorros: 0 });
            current.setMonth(current.getMonth()+1);
        }

        // Ingresos puntuales
        const ingresosP = await ingresosPuntualesService.getByMonth(desde, hasta, categoria_id);
        ingresosP.forEach(i => {
            const mes = i.fecha.slice(0,7);
            const m = meses.find(x => x.mes === mes);
            if(m) m.ingresos += i.monto;
        });

        // Ingresos mensuales
        const ingresosM = await ingresosMensualesService.getAllForCalculations(categoria_id);
        ingresosM.forEach(i => {
            const start = new Date(i.desde + "-28");
            const finish = i.hasta ? new Date(i.hasta + "-28") : new Date(9999,11,31);
            const endRef = hastaDate < finish ? hastaDate : finish;

            meses.forEach(m => {
                const mes28 = new Date(m.mes + "-28");
                if(mes28 >= start && mes28 <= endRef) m.ingresos += i.monto;
            });
        });

        // Cuenta remunerada
        const cuentasRemuneradas = await dbAll(db, "SELECT monto, aportacion_mensual, interes, desde, hasta FROM cuenta_remunerada");
        cuentasRemuneradas.forEach(cr => {
            const start = new Date(cr.desde + "-28");
            const finish = cr.hasta ? new Date(cr.hasta + "-28") : new Date(9999,11,31);
            const endRef = hastaDate < finish ? hastaDate : finish;

            const interesesMensuales = calcularInteresesMensuales(cr.monto, cr.aportacion_mensual || 0, cr.interes || 0, cr.desde, cr.hasta);

            meses.forEach(m => {
                const mes28 = new Date(m.mes + "-28");
                if(mes28 >= start && mes28 <= endRef) {
                    m.cuentas_remuneradas += interesesMensuales[m.mes] || 0;
                }
            });
        });

        // Gastos puntuales
        const gastosP = await gastosPuntualesService.getByMonth(desde, hasta, categoria_id);
        gastosP.forEach(g => {
            const mes = g.fecha.slice(0,7);
            const m = meses.find(x => x.mes === mes);
            if(m) m.gastos += g.monto;
        });

        // Gastos mensuales
        const gastosM = await gastosMensualesService.getAllForCalculations(categoria_id);
        gastosM.forEach(g => {
            const start = new Date(g.desde + "-28");
            const finish = g.hasta ? new Date(g.hasta + "-28") : new Date(9999,11,31);
            const endRef = hastaDate < finish ? hastaDate : finish;

            meses.forEach(m => {
                const mes28 = new Date(m.mes + "-28");
                if(mes28 >= start && mes28 <= endRef) m.gastos += g.monto;
            });
        });

        // Impuestos desde ingresos (bruto - monto) - INGRESOS PUNTUALES
        const ingresosPBruto = await dbAll(db, `
            SELECT bruto, monto, fecha 
            FROM ingresos_puntuales 
            WHERE fecha BETWEEN ? AND ? AND bruto IS NOT NULL AND bruto != monto
        `, [desde, hasta]);
        
        ingresosPBruto.forEach(i => {
            const mes = i.fecha.slice(0, 7);
            const m = meses.find(x => x.mes === mes);
            if(m) m.impuestos_ingresos += i.bruto - i.monto;
        });

        // Impuestos desde ingresos (bruto - monto) - INGRESOS MENSUALES
        const ingresosMBruto = await dbAll(db, `
            SELECT bruto, monto, desde, hasta 
            FROM ingresos_mensuales 
            WHERE bruto IS NOT NULL AND bruto != monto
        `);
        
        ingresosMBruto.forEach(i => {
            meses.forEach(m => {
                const mes28 = new Date(m.mes + "-28");
                const inicio28 = new Date(i.desde + "-28");
                const fin28 = i.hasta ? new Date(i.hasta + "-28") : new Date(9999, 11, 31);
                
                if(mes28 >= inicio28 && mes28 <= fin28 && mes28 <= hastaDate) {
                    m.impuestos_ingresos += i.bruto - i.monto;
                }
            });
        });

        // Impuestos OTROS - PUNTUALES (tabla impuestos_puntuales)
        const impuestosP = await dbAll(db, `
            SELECT monto, fecha
            FROM impuestos_puntuales
            WHERE fecha BETWEEN ? AND ?
        `, [desde, hasta]);
        
        impuestosP.forEach(i => {
            const mes = i.fecha.slice(0, 7);
            const m = meses.find(x => x.mes === mes);
            if(m) m.impuestos_otros += i.monto;
        });

        // Impuestos OTROS - MENSUALES (tabla impuestos_mensuales)
        const impuestosM = await dbAll(db, `
            SELECT monto, desde, hasta
            FROM impuestos_mensuales
        `);
        
        impuestosM.forEach(i => {
            meses.forEach(m => {
                const mes28 = new Date(m.mes + "-28");
                const inicio28 = new Date(i.desde + "-28");
                const fin28 = i.hasta ? new Date(i.hasta + "-28") : new Date(9999, 11, 31);
                
                if(mes28 >= inicio28 && mes28 <= fin28 && mes28 <= hastaDate) {
                    m.impuestos_otros += i.monto;
                }
            });
        });

        // Calcular ahorros
        meses.forEach(m => m.ahorros = (m.ingresos + m.cuentas_remuneradas) - m.gastos - m.impuestos_otros);

        res.json(meses);

    } catch(err) {
        console.error('❌ Error en /ahorros-mes:', err);
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
        gastosP.forEach(g => gastosCat[g.categoria] = (gastosCat[g.categoria] || 0) + g.monto);

        const gastosM = await dbAll(db, `
            SELECT g.monto, g.desde, g.hasta, c.nombre AS categoria
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
                gastosCat[g.categoria] = (gastosCat[g.categoria] || 0) + g.monto;
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
 * GET /gastos-categoria-mes - Obtener gastos por categoría y mes
 */
router.get('/gastos-categoria-mes', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const meses = [];
        let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
        const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
        while(current <= end){
            const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
            meses.push(mesStr);
            current.setMonth(current.getMonth() + 1);
        }

        const dataMesCat = {};
        meses.forEach(m => dataMesCat[m] = {});

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

        const gastosM = await dbAll(db, `
            SELECT g.monto, g.desde, g.hasta, c.nombre AS categoria
            FROM gastos_mensuales g
            JOIN categorias c ON g.categoria_id = c.id
        `);
        gastosM.forEach(g => {
            meses.forEach(m => {
                const mes28 = new Date(m + "-28");
                const gDesde = new Date(g.desde + "-28");
                const gHasta = g.hasta ? new Date(g.hasta + "-28") : new Date(9999,11,31);
                if(mes28 >= gDesde && mes28 <= gHasta && mes28 <= hastaDate){
                    dataMesCat[m][g.categoria] = (dataMesCat[m][g.categoria] || 0) + g.monto;
                }
            });
        });

        // Impuestos como categoría "taxes"
        const impuestosP = await dbAll(db, `
            SELECT i.monto, i.fecha
            FROM impuestos_puntuales i
            WHERE i.fecha BETWEEN ? AND ?
        `, [desde, hasta]);
        impuestosP.forEach(i => {
            const mes = i.fecha.slice(0,7);
            if(dataMesCat[mes]) dataMesCat[mes]['taxes'] = (dataMesCat[mes]['taxes'] || 0) + i.monto;
        });

        const impuestosM = await dbAll(db, `
            SELECT i.monto, i.desde, i.hasta
            FROM impuestos_mensuales i
        `);
        impuestosM.forEach(i => {
            meses.forEach(m => {
                const mes28 = new Date(m + "-28");
                const iDesde = new Date(i.desde + "-28");
                const iHasta = i.hasta ? new Date(i.hasta + "-28") : new Date(9999,11,31);
                if(mes28 >= iDesde && mes28 <= iHasta && mes28 <= hastaDate){
                    dataMesCat[m]['taxes'] = (dataMesCat[m]['taxes'] || 0) + i.monto;
                }
            });
        });

        res.json(dataMesCat);

    } catch(err) {
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

        const ingresosM = await dbAll(db, `SELECT monto, desde, hasta FROM ingresos_mensuales LIMIT 1000`);
        const cuentasRemuneradas = await dbAll(db, `SELECT monto, desde, hasta FROM cuenta_remunerada LIMIT 1000`);
        const gastosM = await dbAll(db, `SELECT monto, desde, hasta FROM gastos_mensuales LIMIT 1000`);
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

            const gastosP = (await dbGet(db, `SELECT IFNULL(SUM(monto),0) as total FROM gastos_puntuales WHERE fecha BETWEEN ? AND ? LIMIT 1000`, [desdeStr, hastaStr])).total;

            let totalGastosMensuales = 0;
            gastosM.forEach(g => totalGastosMensuales += g.monto * contarMesesDesde28(desdeStr, hastaStr, g.desde, g.hasta));

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
