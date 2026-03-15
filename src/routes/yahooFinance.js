const express = require('express');
const { getAssetPrice, getHistoricalData } = require('../services/yahooFinanceService');

const router = express.Router();

/**
 * GET /asset-price/:ticker - Obtener precio de un activo
 */
router.get('/asset-price/:ticker', async (req, res) => {
    const ticker = String(req.params.ticker || '').trim().toUpperCase();
    try {
        const result = await getAssetPrice(ticker);
        res.json(result);
    } catch (e) {
        console.warn(`⚠️ /asset-price sin datos para ${ticker}: ${e.message}`);
        res.json({
            ticker,
            currentPrice: null,
            currency: 'EUR',
            unavailable: true,
            mensaje: 'No se pudo obtener el precio para este ticker'
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
