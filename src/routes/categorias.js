const express = require('express');
const db = require('../config/database');
const { dbRun, dbGet, dbAll } = require('../utils/dbHelpers');

const router = express.Router();

/**
 * POST /add/categoria - Agregar nueva categoría
 */
router.post('/add/categoria', async (req, res) => {
    try {
        const { nombre, tipo } = req.body;
        
        if (!nombre || !tipo) {
            return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
        }
        
        if (!['gasto', 'ingreso', 'impuestos'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo de categoría inválido' });
        }
        
        await dbRun(db, "INSERT INTO categorias (nombre, tipo) VALUES (?, ?)", [nombre.trim(), tipo]);
        res.status(200).json({ success: true, message: 'Categoría agregada' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            res.status(400).json({ error: 'La categoría ya existe para este tipo' });
        } else {
            res.status(400).json({ error: err.message });
        }
    }
});

/**
 * GET /categorias - Obtener todas las categorías
 */
router.get('/categorias', async (req, res) => {
    try {
        const gastos = await dbAll(db, "SELECT * FROM categorias WHERE tipo='gasto' ORDER BY nombre");
        const ingresos = await dbAll(db, "SELECT * FROM categorias WHERE tipo='ingreso' ORDER BY nombre");
        const impuestos = await dbAll(db, "SELECT * FROM categorias WHERE tipo='impuestos' ORDER BY nombre");
        res.json({ 
            gastos: gastos || [], 
            ingresos: ingresos || [], 
            impuestos: impuestos || [] 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /delete/categoria - Eliminar categoría
 */
router.post('/delete/categoria', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'ID de categoría requerido' });
        }
        
        await dbRun(db, "DELETE FROM categorias WHERE id = ?", [id]);
        res.json({ ok: true });
    } catch (err) {
        console.error('Error eliminando categoría:', err);
        if (err.message && err.message.includes('FOREIGN KEY')) {
            res.status(400).json({ error: "No se puede borrar: categoría en uso" });
        } else {
            res.status(400).json({ error: err.message || "Error al eliminar categoría" });
        }
    }
});

/**
 * POST /update/categoria - Actualizar categoría
 */
router.post('/update/categoria', async (req, res) => {
    const { id, nombre } = req.body;
    try {
        await dbRun(db, "UPDATE categorias SET nombre = ? WHERE id = ?", [nombre, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
