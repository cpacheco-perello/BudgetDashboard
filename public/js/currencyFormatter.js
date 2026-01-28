/**
 * Centralized currency formatting utilities
 * Eliminates duplication across all tab modules
 */

/**
 * Format amount according to current currency
 * @param {number} monto - Amount to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.convert - Whether to apply currency conversion
 * @returns {string} Formatted currency string
 */
function formatearEuro(monto, { convert = false } = {}) {
    if (typeof window.formatCurrency === 'function') {
        return window.formatCurrency(monto, { convert });
    }
    if (monto === null || monto === undefined) return '€0,00';
    return '€' + parseFloat(monto).toLocaleString('es-ES', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

/**
 * Parse amount from formatted string (handles both EUR and USD formats)
 * @param {string} str - Formatted amount string
 * @returns {number} Parsed numeric value
 */
function parseAmount(str) {
    if (!str) return 0;
    
    // Remove currency symbols and whitespace
    let cleaned = str.replace(/[^\d.,-]/g, '');
    
    // Handle both formats: 1.234,56 (EUR) and 1,234.56 (USD)
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
        // EUR format: 1.234,56 -> remove dots, replace comma with dot
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
        // USD format: 1,234.56 -> remove commas
        cleaned = cleaned.replace(/,/g, '');
    }
    
    return parseFloat(cleaned) || 0;
}

/**
 * Parse date range endpoint (handles YYYY-MM or YYYY-MM-DD format)
 * @param {string} dateStr - Date string to parse
 * @returns {Date} Parsed date object
 */
function parseEndDate(dateStr) {
    if (!dateStr) return new Date(0);
    
    // Handle YYYY-MM format (last day of month)
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
        const [y, m] = dateStr.split('-').map(Number);
        return new Date(y, m, 0);
    }
    
    return new Date(dateStr);
}

/**
 * Get localized button titles
 * @param {string} key - Translation key
 * @param {string} defaultText - Default text if translation unavailable
 * @returns {string} Translated or default text
 */
function getLocalizedTitle(key, defaultText) {
    if (typeof gestorIdiomas !== 'undefined') {
        return gestorIdiomas.obtenerTexto(key);
    }
    return defaultText;
}

/**
 * Create delete confirmation dialog
 * @param {string} key - Translation key for confirmation message
 * @param {string} defaultMessage - Default message if translation unavailable
 * @returns {Promise<boolean>} User confirmation result
 */
async function confirmarEliminar(key, defaultMessage = '¿Eliminar este elemento?') {
    const message = getLocalizedTitle(key, defaultMessage);
    return await showConfirm(message);
}

/**
 * Create table row element with standard structure
 * @param {Object} data - Row data
 * @param {string|number} data.id - Row ID
 * @param {string} data.type - Row type (puntual/mensual)
 * @param {Array<Object>} data.cells - Array of cell definitions
 * @param {string} cells[].content - Cell content
 * @param {string} cells[].field - Data field name
 * @returns {HTMLTableRowElement} Constructed row
 */
function createTableRow(data) {
    const tr = document.createElement('tr');
    tr.dataset.id = data.id;
    if (data.type) tr.dataset.type = data.type;
    
    let html = '';
    data.cells.forEach(cell => {
        html += `<td class="editable" data-field="${cell.field}">${cell.content}</td>`;
    });
    
    tr.innerHTML = html;
    return tr;
}

export { formatearEuro, parseAmount, parseEndDate, getLocalizedTitle, confirmarEliminar, createTableRow };
