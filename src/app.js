const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config/config');
const { runMigrations } = require('./database/migrationRunner');
const { 
    securityMiddleware, 
    timeoutMiddleware, 
    errorHandler, 
    notFoundHandler 
} = require('./middleware');

// Importar rutas
const categoriasRoutes = require('./routes/categorias');
const gastosRoutes = require('./routes/gastos');
const ingresosRoutes = require('./routes/ingresos');
const impuestosRoutes = require('./routes/impuestos');
const huchaRoutes = require('./routes/hucha');
const cuentaRemuneradaRoutes = require('./routes/cuentaRemunerada');
const assetsRoutes = require('./routes/assets');
const yahooFinanceRoutes = require('./routes/yahooFinance');
const dashboardRoutes = require('./routes/dashboard');
const importacionBancariaRoutes = require('./routes/importacionBancaria');
const realesRoutes = require('./routes/reales');

const app = express();

// ================ MIDDLEWARE ================
app.use(bodyParser.json({ limit: config.BODY_LIMIT }));
app.use(bodyParser.urlencoded({ limit: config.BODY_LIMIT, extended: true }));
app.use(timeoutMiddleware);
app.use(securityMiddleware);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// ================ RUTAS ================
app.use(categoriasRoutes);
app.use(gastosRoutes);
app.use(ingresosRoutes);
app.use(impuestosRoutes);
app.use(huchaRoutes);
app.use(cuentaRemuneradaRoutes);
app.use(assetsRoutes);
app.use(yahooFinanceRoutes);
app.use(dashboardRoutes);
app.use(importacionBancariaRoutes);
app.use(realesRoutes);

// ================ MANEJO DE ERRORES ================
app.use(errorHandler);
app.use(notFoundHandler);

// ================ INICIALIZACIÓN ================
// Ejecutar migraciones al iniciar
runMigrations().catch(err => {
    console.error('❌ Error al ejecutar migraciones:', err);
    process.exit(1);
});

module.exports = app;
