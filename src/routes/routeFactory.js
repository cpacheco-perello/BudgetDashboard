/**
 * Factory for creating CRUD routes
 * Eliminates duplication in gastos.js, ingresos.js, impuestos.js routes
 */

const express = require('express');

/**
 * Create standard CRUD routes for a given entity type
 * @param {string} entityName - Entity name (e.g., 'gasto', 'ingreso')
 * @param {PuntualService} puntualService - Service instance for punctual operations
 * @param {MensualService} mensualService - Service instance for monthly operations
 * @returns {express.Router} Configured router
 */
function createEntityRoutes(entityName, puntualService, mensualService) {
    const router = express.Router();

    /**
     * Add puntual (one-time) entity
     */
    router.post(`/add/${entityName}_puntual`, async (req, res) => {
        try {
            await puntualService.add(req.body);
            res.sendStatus(200);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    /**
     * Delete puntual entity
     */
    router.post(`/delete/${entityName}_puntual`, async (req, res) => {
        try {
            await puntualService.delete(req.body.id);
            res.json({ ok: true });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    /**
     * Update puntual entity
     */
    router.post(`/update/${entityName}_puntual`, async (req, res) => {
        try {
            await puntualService.update(req.body);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message || 'Error al actualizar' });
        }
    });

    /**
     * Add mensual (monthly) entity
     */
    router.post(`/add/${entityName}_mensual`, async (req, res) => {
        try {
            await mensualService.add(req.body);
            res.sendStatus(200);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    /**
     * Delete mensual entity
     */
    router.post(`/delete/${entityName}_mensual`, async (req, res) => {
        try {
            await mensualService.delete(req.body.id);
            res.json({ ok: true });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    /**
     * Update mensual entity
     */
    router.post(`/update/${entityName}_mensual`, async (req, res) => {
        try {
            await mensualService.update(req.body);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message || 'Error al actualizar' });
        }
    });

    return router;
}

module.exports = { createEntityRoutes };
