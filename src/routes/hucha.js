const express = require('express');
const db = require('../config/database');
const { dbRun, dbGet, dbAll } = require('../utils/dbHelpers');

const router = express.Router();

/**
 * GET /hucha - Obtener todos los registros de hucha
 */
router.get('/hucha', async (req, res) => {
    try {
        const rows = await dbAll(db, 'SELECT * FROM hucha ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /add/hucha - Agregar registro a hucha
 */
router.post('/add/hucha', async (req, res) => {
    const { concepto, cantidad } = req.body;
    if (!concepto || !cantidad || isNaN(cantidad)) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }
    try {
        await dbRun(db, 'INSERT INTO hucha (concepto, cantidad) VALUES (?, ?)', [concepto, cantidad]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /delete/hucha - Eliminar registro de hucha
 */
router.post('/delete/hucha', async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    try {
        await dbRun(db, 'DELETE FROM hucha WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /update/hucha - Actualizar registro de hucha
 */
router.post('/update/hucha', async (req, res) => {
    const { id, concepto, cantidad } = req.body;
    if (!id || !concepto || !cantidad || isNaN(cantidad)) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }
    try {
        await dbRun(db, 'UPDATE hucha SET concepto = ?, cantidad = ? WHERE id = ?', [concepto, cantidad, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
