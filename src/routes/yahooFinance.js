const express = require('express');
const { getAssetPrice } = require('../services/yahooFinanceService');

const router = express.Router();

/**
 * GET /asset-price/:ticker - Obtener precio de un activo
 */
router.get('/asset-price/:ticker', async (req, res) => {
    try {
        const result = await getAssetPrice(req.params.ticker);
        res.json(result);
    } catch (e) {
        console.error('Error obteniendo precio:', e);
        res.status(500).json({ 
            error: 'No se pudo obtener el precio', 
            ticker: req.params.ticker,
            mensaje: 'Verifica que el ticker sea válido (ej: AAPL, MSFT, etc.)'
        });
    }
});

module.exports = router;
