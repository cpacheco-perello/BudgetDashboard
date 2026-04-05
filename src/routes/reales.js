const express = require('express');
const PuntualService = require('../services/PuntualService');
const db = require('../config/database');
const { dbRun, dbAll } = require('../utils/dbHelpers');

const router = express.Router();

const gastosRealesService = new PuntualService('gastos_reales');
const ingresosRealesService = new PuntualService('ingresos_reales');

function normalizarItemImportacion(item) {
    const descripcion = String(item?.descripcion || '').trim();
    const fecha = String(item?.fecha || '').trim().slice(0, 10);
    const monto = Number(item?.monto);
    const categoria_id = Number(item?.categoria_id);
    const archivo_origen = String(item?.archivo_origen || 'importacion_bancaria').trim();

    const errores = [];
    if (!descripcion) errores.push('Descripcion vacia');
    if (!fecha) errores.push('Fecha vacia');
    if (!Number.isFinite(monto) || monto <= 0) errores.push('Monto invalido');
    if (!Number.isInteger(categoria_id) || categoria_id <= 0) errores.push('Categoria invalida');

    return {
        ok: errores.length === 0,
        errores,
        data: {
            descripcion,
            fecha,
            monto,
            categoria_id,
            archivo_origen
        }
    };
}

function generarClaveImportacion(item, includeArchivo = false) {
    const descNorm = String(item.descripcion || '').trim().toLowerCase();
    const montoNorm = Number(item.monto || 0).toFixed(2);
    const base = [item.fecha, descNorm, montoNorm, item.categoria_id];
    if (includeArchivo) {
        base.push(item.archivo_origen || '');
    }
    return base.join('|');
}

async function obtenerClavesExistentes(tableName, candidatos = []) {
    if (!candidatos.length) return new Set();

    const fechasUnicas = [...new Set(candidatos.map((item) => item.fecha).filter(Boolean))];
    let rows = [];

    if (fechasUnicas.length > 0 && fechasUnicas.length <= 365) {
        const placeholders = fechasUnicas.map(() => '?').join(', ');
        rows = await dbAll(
            db,
            `SELECT fecha, descripcion, monto, categoria_id FROM ${tableName} WHERE fecha IN (${placeholders})`,
            fechasUnicas
        );
    } else {
        const fechasOrdenadas = fechasUnicas.sort();
        const desde = fechasOrdenadas[0];
        const hasta = fechasOrdenadas[fechasOrdenadas.length - 1];
        if (!desde || !hasta) return new Set();
        rows = await dbAll(
            db,
            `SELECT fecha, descripcion, monto, categoria_id FROM ${tableName} WHERE fecha BETWEEN ? AND ?`,
            [desde, hasta]
        );
    }

    const keys = new Set();
    rows.forEach((row) => keys.add(generarClaveImportacion(row)));
    return keys;
}

async function insertarBatchConFallback(tableName, batch, resultados) {
    if (!batch.length) return;

    const placeholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const params = [];
    batch.forEach((item) => {
        params.push(item.fecha, item.descripcion, item.monto, item.categoria_id, item.archivo_origen);
    });

    try {
        await dbRun(
            db,
            `INSERT INTO ${tableName} (fecha, descripcion, monto, categoria_id, archivo_origen) VALUES ${placeholders}`,
            params
        );
        batch.forEach((item) => resultados.push({ ...item, ok: true }));
    } catch (_) {
        for (const item of batch) {
            try {
                await dbRun(
                    db,
                    `INSERT INTO ${tableName} (fecha, descripcion, monto, categoria_id, archivo_origen) VALUES (?, ?, ?, ?, ?)`,
                    [item.fecha, item.descripcion, item.monto, item.categoria_id, item.archivo_origen]
                );
                resultados.push({ ...item, ok: true });
            } catch (err) {
                resultados.push({ ...item, ok: false, error: err.message || 'Error insertando registro' });
            }
        }
    }
}

async function importarPuntuales(service, req, res) {
    try {
        const { datos } = req.body;
        if (!Array.isArray(datos) || datos.length === 0) {
            return res.status(400).json({ error: 'No hay datos para importar' });
        }

        const resultados = [];
        const candidatos = [];
        const keysPayload = new Set();
        let duplicadosPayload = 0;

        datos.forEach((item) => {
            const validado = normalizarItemImportacion(item);
            if (!validado.ok) {
                resultados.push({ ...item, ok: false, error: validado.errores.join(', ') });
                return;
            }

            const key = generarClaveImportacion(validado.data);
            if (keysPayload.has(key)) {
                duplicadosPayload += 1;
                resultados.push({ ...validado.data, ok: false, error: 'Duplicado dentro del lote' });
                return;
            }

            keysPayload.add(key);
            candidatos.push(validado.data);
        });

        const existentes = await obtenerClavesExistentes(service.tableName, candidatos);

        const pendientes = [];
        let duplicadosExistentes = 0;
        candidatos.forEach((item) => {
            const key = generarClaveImportacion(item);
            if (existentes.has(key)) {
                duplicadosExistentes += 1;
                resultados.push({ ...item, ok: false, error: 'Registro ya importado' });
                return;
            }
            pendientes.push(item);
        });

        if (pendientes.length > 0) {
            await dbRun(db, 'BEGIN TRANSACTION');
            try {
                const batchSize = 250;
                for (let i = 0; i < pendientes.length; i += batchSize) {
                    const batch = pendientes.slice(i, i + batchSize);
                    await insertarBatchConFallback(service.tableName, batch, resultados);
                }
                await dbRun(db, 'COMMIT');
            } catch (txError) {
                await dbRun(db, 'ROLLBACK');
                throw txError;
            }
        }

        const exitosos = resultados.filter(r => r.ok).length;
        const fallidos = resultados.filter(r => !r.ok).length;

        res.json({
            success: true,
            total: datos.length,
            exitosos,
            fallidos,
            duplicadosPayload,
            duplicadosExistentes,
            detalles: resultados
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Error en la importación' });
    }
}

// Importación de gastos/ingresos reales
router.post('/import/gasto_real', (req, res) => importarPuntuales(gastosRealesService, req, res));
router.post('/import/ingreso_real', (req, res) => importarPuntuales(ingresosRealesService, req, res));

// CRUD de gastos reales
router.post('/add/gasto_real', async (req, res) => {
    try {
        await gastosRealesService.add(req.body);
        res.sendStatus(200);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/delete/gasto_real', async (req, res) => {
    try {
        await gastosRealesService.delete(req.body.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/update/gasto_real', async (req, res) => {
    try {
        await gastosRealesService.update(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Error al actualizar' });
    }
});

// CRUD de ingresos reales
router.post('/add/ingreso_real', async (req, res) => {
    try {
        await ingresosRealesService.add(req.body);
        res.sendStatus(200);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/delete/ingreso_real', async (req, res) => {
    try {
        await ingresosRealesService.delete(req.body.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/update/ingreso_real', async (req, res) => {
    try {
        await ingresosRealesService.update(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Error al actualizar' });
    }
});

module.exports = router;