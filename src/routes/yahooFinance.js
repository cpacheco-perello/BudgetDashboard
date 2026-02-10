const express = require('express');
const { getAssetPrice, getHistoricalData } = require('../services/yahooFinanceService');

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

/**
 * GET /asset-history/:ticker - Obtener datos históricos de un activo
 * Query params: period (1mo, 3mo, 6mo, 1y, 2y, 5y)
 */
router.get('/asset-history/:ticker', async (req, res) => {
    try {
        const { period = '1y' } = req.query;
        const result = await getHistoricalData(req.params.ticker, period);
        res.json(result);
    } catch (e) {
        console.error('Error obteniendo datos históricos:', e);
        res.status(500).json({ 
            error: 'No se pudieron obtener datos históricos', 
            ticker: req.params.ticker,
            mensaje: e.message || 'Verifica que el ticker sea válido'
        });
    }
});

module.exports = router;
