const express = require('express');
const SubHuchaService = require('../services/SubHuchaService');

const router = express.Router();
const service = new SubHuchaService();

// --- Sub-huchas CRUD ---

router.get('/sub_huchas', async (req, res) => {
    try {
        const rows = await service.getAll();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/add/sub_hucha', async (req, res) => {
    try {
        await service.add(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/update/sub_hucha', async (req, res) => {
    try {
        await service.update(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/delete/sub_hucha', async (req, res) => {
    try {
        await service.delete(req.body.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- Resumen / total (MUST be before :id routes) ---

router.get('/sub_huchas/total', async (req, res) => {
    try {
        const mes = req.query.mes;
        if (!mes) return res.status(400).json({ error: 'Parámetro mes requerido (YYYY-MM)' });
        const total = await service.calcularTotalSubHuchas(mes);
        res.json({ total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Aportaciones puntuales ---

router.get('/sub_huchas/:id/puntuales', async (req, res) => {
    try {
        const rows = await service.getPuntuales(req.params.id);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/add/sub_hucha_puntual', async (req, res) => {
    try {
        await service.addPuntual(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/delete/sub_hucha_puntual', async (req, res) => {
    try {
        await service.deletePuntual(req.body.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
