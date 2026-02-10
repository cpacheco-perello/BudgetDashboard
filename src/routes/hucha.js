const express = require('express');
const HuchaService = require('../services/HuchaService');

const router = express.Router();
const huchaService = new HuchaService();

/**
 * GET /hucha - Obtener todos los registros de hucha
 */
router.get('/hucha', async (req, res) => {
    try {
        const rows = await huchaService.getAll();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /add/hucha - Agregar registro a hucha
 */
router.post('/add/hucha', async (req, res) => {
    try {
        await huchaService.add(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * POST /delete/hucha - Eliminar registro de hucha
 */
router.post('/delete/hucha', async (req, res) => {
    try {
        await huchaService.delete(req.body.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * POST /update/hucha - Actualizar registro de hucha
 */
router.post('/update/hucha', async (req, res) => {
    try {
        await huchaService.update(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
