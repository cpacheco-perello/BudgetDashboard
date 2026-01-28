const db = require('../config/database');
const { dbRun, dbGet, dbAll } = require('../utils/dbHelpers');
const BaseService = require('./BaseService');

/**
 * Service for CRUD operations on punctual (one-time) entities
 * Eliminates duplication: gastos_puntuales, ingresos_puntuales, impuestos_puntuales
 */
class PuntualService extends BaseService {
    constructor(tableName) {
        super(tableName, 'fecha'); // 'fecha' is the date field for puntual records
    }

    /**
     * Get total amount for a date range
     * @param {string} desde - Start date
     * @param {string} hasta - End date
     * @param {number} categoria_id - Optional category filter
     * @returns {Promise<number>} Total amount
     */
    async getByPeriod(desde, hasta, categoria_id = null) {
        let query = `SELECT IFNULL(SUM(monto),0) as total FROM ${this.tableName} WHERE fecha BETWEEN ? AND ?`;
        const params = [desde, hasta];
        
        if (categoria_id) {
            query += " AND categoria_id = ?";
            params.push(categoria_id);
        }
        
        return (await dbGet(db, query, params)).total;
    }

    /**
     * Get aggregated data by month
     * @param {string} desde - Start month (YYYY-MM)
     * @param {string} hasta - End month (YYYY-MM)
     * @param {number} categoria_id - Optional category filter
     * @returns {Promise<Array>} Monthly aggregated data (returns raw records to be processed)
     */
    async getByMonth(desde, hasta, categoria_id = null) {
        // For SQLite, return raw records grouped by date month
        let query = `
            SELECT 
                fecha,
                IFNULL(SUM(monto), 0) as monto
            FROM ${this.tableName}
            WHERE fecha BETWEEN ? AND ?
        `;
        const params = [desde, hasta];
        
        if (categoria_id) {
            query += " AND categoria_id = ?";
            params.push(categoria_id);
        }
        
        query += " GROUP BY SUBSTR(fecha, 1, 7) ORDER BY fecha DESC";
        return await dbAll(db, query, params);
    }
}

module.exports = PuntualService;
