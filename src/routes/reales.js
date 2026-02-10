const express = require('express');
const PuntualService = require('../services/PuntualService');

const router = express.Router();

const gastosRealesService = new PuntualService('gastos_reales');
const ingresosRealesService = new PuntualService('ingresos_reales');

async function importarPuntuales(service, req, res) {
    try {
        const { datos } = req.body;
        if (!Array.isArray(datos) || datos.length === 0) {
            return res.status(400).json({ error: 'No hay datos para importar' });
        }

        const resultados = [];
        for (const item of datos) {
            try {
                await service.add(item);
                resultados.push({ ...item, ok: true });
            } catch (err) {
                resultados.push({ ...item, ok: false, error: err.message });
            }
        }

        const exitosos = resultados.filter(r => r.ok).length;
        const fallidos = resultados.filter(r => !r.ok).length;

        res.json({
            success: true,
            total: datos.length,
            exitosos,
            fallidos,
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