const express = require('express');
const db = require('../config/database');
const { dbRun, dbGet, dbAll } = require('../utils/dbHelpers');

const router = express.Router();

/**
 * Obtiene o crea la categoría "Assets"
 */
async function getAssetsCategoryId() {
    let cat = await dbGet(db, 'SELECT id FROM categorias WHERE nombre=? AND tipo="ingreso"', ['Assets']);
    if (cat && cat.id) return cat.id;
    await dbRun(db, 'INSERT INTO categorias (nombre, tipo) VALUES (?, ?)', ['Assets', 'ingreso']);
    cat = await dbGet(db, 'SELECT id FROM categorias WHERE nombre=? AND tipo="ingreso"', ['Assets']);
    return cat.id;
}

/**
 * GET /assets - Obtener todos los assets
 */
router.get('/assets', async (req, res) => {
    try {
        const rows = await dbAll(db, `
            SELECT a.*, c.nombre as categoria
            FROM assets a
            JOIN categorias c ON a.categoria_id = c.id
            ORDER BY a.created_at DESC
        `);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /add/asset - Agregar nuevo asset
 */
router.post('/add/asset', async (req, res) => {
    try {
        const { company, ticker, shares, purchase_price } = req.body;
        const categoria_id = await getAssetsCategoryId();
        await dbRun(db, `
            INSERT INTO assets (company, ticker, shares, purchase_price, categoria_id)
            VALUES (?, ?, ?, ?, ?)
        `, [company, ticker, shares, purchase_price, categoria_id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /delete/asset - Eliminar asset
 */
router.post('/delete/asset', async (req, res) => {
    try {
        await dbRun(db, 'DELETE FROM assets WHERE id=?', [req.body.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /update/asset - Actualizar asset
 */
router.post('/update/asset', async (req, res) => {
    try {
        const { id, company, ticker, shares, purchase_price } = req.body;
        const categoria_id = await getAssetsCategoryId();
        await dbRun(db, `
            UPDATE assets 
            SET company=?, ticker=?, shares=?, purchase_price=?, categoria_id=?
            WHERE id=?
        `, [company, ticker, shares, purchase_price, categoria_id, id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /sell/asset - Vender asset y registrar ganancia/pérdida
 */
router.post('/sell/asset', async (req, res) => {
    try {
        const { id, sale_price } = req.body;
        
        const asset = await dbGet(db, `SELECT * FROM assets WHERE id=?`, [id]);
        if (!asset) {
            return res.status(404).json({ error: 'Asset no encontrado' });
        }
        
        const totalInvested = asset.shares * asset.purchase_price;
        const totalSale = asset.shares * sale_price;
        const profit = totalSale - totalInvested;
        
        const categoryId = await getAssetsCategoryId();
        const fecha = new Date().toISOString().split('T')[0];
        const descripcion = `Venta ${asset.shares} acciones ${asset.company} (${asset.ticker}) @ €${sale_price.toFixed(2)}`;
        
        if (profit >= 0) {
            await dbRun(db,
                `INSERT INTO ingresos_puntuales (fecha, descripcion, monto, bruto, categoria_id) VALUES (?, ?, ?, ?, ?)`,
                [fecha, descripcion, profit, profit, categoryId]
            );
        } else {
            let gastoCategoryId = await dbGet(db,
                `SELECT id FROM categorias WHERE nombre = 'Assets' AND tipo = 'gasto'`
            );
            
            if (!gastoCategoryId) {
                await dbRun(db,
                    `INSERT INTO categorias (nombre, tipo) VALUES ('Assets', 'gasto')`
                );
                gastoCategoryId = await dbGet(db,
                    `SELECT id FROM categorias WHERE nombre = 'Assets' AND tipo = 'gasto'`
                );
            }
            
            await dbRun(db,
                `INSERT INTO gastos_puntuales (fecha, descripcion, monto, categoria_id) VALUES (?, ?, ?, ?)`,
                [fecha, descripcion, Math.abs(profit), gastoCategoryId.id]
            );
        }
        
        await dbRun(db, `DELETE FROM assets WHERE id=?`, [id]);
        
        res.json({ 
            ok: true, 
            profit: profit,
            total_invested: totalInvested,
            total_sale: totalSale
        });
    } catch (err) {
        console.error('Error selling asset:', err);
        res.status(500).json({ error: 'Error procesando la venta' });
    }
});

module.exports = router;
