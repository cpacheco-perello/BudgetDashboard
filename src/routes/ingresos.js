const PuntualService = require('../services/PuntualService');
const MensualService = require('../services/MensualService');
const { createEntityRoutes } = require('./routeFactory');

// Servicios
const ingresosPuntualesService = new PuntualService('ingresos_puntuales');
const ingresosMensualesService = new MensualService('ingresos_mensuales');

// Create routes using factory pattern (eliminates 70+ lines of duplication)
const router = createEntityRoutes('ingreso', ingresosPuntualesService, ingresosMensualesService);

module.exports = router;
