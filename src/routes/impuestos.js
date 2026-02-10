const PuntualService = require('../services/PuntualService');
const MensualService = require('../services/MensualService');
const { createEntityRoutes } = require('./routeFactory');

// Servicios
const impuestosPuntualesService = new PuntualService('impuestos_puntuales');
const impuestosMensualesService = new MensualService('impuestos_mensuales');

// Create routes using factory pattern (eliminates 70+ lines of duplication)
const router = createEntityRoutes('impuesto', impuestosPuntualesService, impuestosMensualesService);

module.exports = router;
