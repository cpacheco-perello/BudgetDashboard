const express = require('express');
const db = require('../config/database');
const { dbRun, dbGet, dbAll } = require('../utils/dbHelpers');
const { calcularInteresGenerado, generarDescripcionRandom } = require('../utils/calculations');

const router = express.Router();

/**
 * POST /add/cuenta_remunerada - Agregar cuenta remunerada
 */
router.post('/add/cuenta_remunerada', async (req, res) => {
    const { monto, aportacion_mensual, interes, categoria_id, desde, hasta } = req.body;
    try {
        const interesGenerado = calcularInteresGenerado(monto, aportacion_mensual || 0, interes || 0, desde, hasta);
        const descripcion = generarDescripcionRandom();
        
        await dbRun(db, `
            INSERT INTO cuenta_remunerada (descripcion, monto, aportacion_mensual, interes, interes_generado, categoria_id, desde, hasta)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [descripcion, monto, aportacion_mensual || null, interes || null, interesGenerado, categoria_id, desde, hasta]);
          
        res.sendStatus(200);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * POST /delete/cuenta_remunerada - Eliminar cuenta remunerada
 */
router.post('/delete/cuenta_remunerada', async (req, res) => {
    try {
        await dbRun(db, "DELETE FROM cuenta_remunerada WHERE id = ?", [req.body.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * POST /update/cuenta_remunerada - Actualizar cuenta remunerada
 */
router.post('/update/cuenta_remunerada', async (req, res) => {
    const { id, desde, hasta, monto, aportacion_mensual, interes, categoria } = req.body;
    try {
        const cat = await dbGet(db, "SELECT id FROM categorias WHERE nombre = ? AND tipo = 'ingreso'", [categoria]);
        if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
        
        const descripcion = generarDescripcionRandom();
        const interesGenerado = calcularInteresGenerado(monto, aportacion_mensual, interes, desde, hasta);
        
        await dbRun(db, `
            UPDATE cuenta_remunerada 
            SET descripcion = ?, desde = ?, hasta = ?, monto = ?, aportacion_mensual = ?, interes = ?, interes_generado = ?, categoria_id = ?
            WHERE id = ?
        `, [descripcion, desde, hasta, monto, aportacion_mensual || null, interes || null, interesGenerado, cat.id, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
