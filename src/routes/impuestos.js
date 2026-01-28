const PuntualService = require('../services/PuntualService');
const MensualService = require('../services/MensualService');
const { createEntityRoutes } = require('./routeFactory');

// Servicios
const impuestosPuntualesService = new PuntualService('impuestos_puntuales');
const impuestosMensualesService = new MensualService('impuestos_mensuales');

// Create routes using factory pattern (eliminates 70+ lines of duplication)
const router = createEntityRoutes('impuesto', impuestosPuntualesService, impuestosMensualesService);

/**
 * GET /impuestos-puntuales - Get all one-time taxes
 */
router.get('/impuestos-puntuales', async (req, res) => {
    try {
        const impuestos = await impuestosPuntualesService.getAll();
        res.json(impuestos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /impuestos-mensuales - Get all monthly taxes
 */
router.get('/impuestos-mensuales', async (req, res) => {
    try {
        const impuestos = await impuestosMensualesService.getAll();
        res.json(impuestos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
