const express = require('express');
const db = require('../config/database');
const { dbRun, dbGet, dbAll } = require('../utils/dbHelpers');
const { calcularInteresGenerado, generarDescripcionRandom } = require('../utils/calculations');

const router = express.Router();

/**
 * POST /add/cuenta_remunerada - Agregar cuenta remunerada
 */
router.post('/add/cuenta_remunerada', async (req, res) => {
    const { descripcion, monto, aportacion_mensual, interes, retencion, categoria_id, desde, hasta } = req.body;
    try {
        const interesGenerado = calcularInteresGenerado(monto, aportacion_mensual || 0, interes || 0, desde, hasta);
        const descripcionFinal = (descripcion || '').trim() || generarDescripcionRandom();
        
        await dbRun(db, `
            INSERT INTO cuenta_remunerada (descripcion, monto, aportacion_mensual, interes, retencion, interes_generado, categoria_id, desde, hasta)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [descripcionFinal, monto, aportacion_mensual || null, interes || null, retencion || 0, interesGenerado, categoria_id, desde, hasta]);
          
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
    const { id, desde, hasta, monto, aportacion_mensual, interes, retencion, categoria, categoria_id, descripcion } = req.body;
    try {
        let catId = categoria_id;
        if (!catId && categoria) {
            const cat = await dbGet(db, "SELECT id FROM categorias WHERE nombre = ? AND tipo = 'ingreso'", [categoria]);
            if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
            catId = cat.id;
        }
        if (!catId) return res.status(400).json({ error: "Categoría es requerida" });
        
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
        
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
