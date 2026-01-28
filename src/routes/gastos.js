const PuntualService = require('../services/PuntualService');
const MensualService = require('../services/MensualService');
const { createEntityRoutes } = require('./routeFactory');

// Servicios
const gastosPuntualesService = new PuntualService('gastos_puntuales');
const gastosMensualesService = new MensualService('gastos_mensuales');

// Create routes using factory pattern (eliminates 70+ lines of duplication)
const router = createEntityRoutes('gasto', gastosPuntualesService, gastosMensualesService);

module.exports = router;
