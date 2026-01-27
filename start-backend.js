#!/usr/bin/env node
/**
 * Backend startup script for DashboardEconomic
 * Runs the Express server directly without Electron
 * Requires Node.js 22 or higher
 */

const app = require('./app');

const PORT = 3000;

const server = app.listen(PORT, () => {
    console.log(`✅ Backend escuchando en http://localhost:${PORT}`);
    console.log(`📊 Abre http://localhost:${PORT} en tu navegador`);
});

// Error handling
server.on('error', (err) => {
    console.error('❌ Server error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⛔ Cerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⛔ Cerrando servidor...');
    process.exit(0);
});

// Catch unhandled exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

