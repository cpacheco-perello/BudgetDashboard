/**
 * Generic table management for CRUD operations
 * Handles loading, displaying, editing, and deleting rows
 */

class DataTableManager {
    constructor(config) {
        this.tableBodySelector = config.tableBodySelector;
        this.entityType = config.entityType; // 'gasto', 'ingreso', 'impuesto'
        this.subType = config.subType; // 'puntual', 'mensual'
        this.columns = config.columns; // Array of column definitions
        this.onDelete = config.onDelete || (() => {});
        this.onEdit = config.onEdit || (() => {});
        this.filterOldItems = config.filterOldItems !== false;
        this.filterFlagKey = config.filterFlagKey || `showOld${this.entityType}`;
    }

    /**
     * Render table rows from data
     * @param {Array} data - Data rows to render
     * @param {Function} filterFn - Optional filter function
     */
    renderTable(data, filterFn = null) {
        const tbody = document.querySelector(this.tableBodySelector);
        tbody.innerHTML = '';

        let filteredData = data;
        if (filterFn) {
            filteredData = data.filter(filterFn);
        }

        filteredData.forEach(row => this.addRow(tbody, row));
        this.attachEventListeners();
    }

    /**
     * Add single row to table
     * @param {HTMLTableSectionElement} tbody - Table body element
     * @param {Object} row - Row data
     */
    addRow(tbody, row) {
        const tr = document.createElement('tr');
        tr.dataset.id = row.id;
        tr.dataset.type = this.subType;

        let html = '';
        
        // Add data cells
        this.columns.forEach(col => {
            let content = row[col.field] || '—';
            
            if (col.formatter) {
                content = col.formatter(content);
            }
            
            html += `<td class="editable" data-field="${col.field}">${content}</td>`;
        });

        // Add action buttons
        html += `
            <td>
                <button class="editBtn btn-editar" title="${getLocalizedTitle('formularios.editar', 'Editar')}" style="margin-right:8px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button data-id="${row.id}" class="delBtn btn-eliminar" title="${getLocalizedTitle('formularios.eliminar', 'Eliminar')}" style="display:inline-block;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tr.innerHTML = html;
        tbody.appendChild(tr);
    }

    /**
     * Attach event listeners to table buttons
     */
    attachEventListeners() {
        const tbody = document.querySelector(this.tableBodySelector);
        
        // Delete button listeners
        tbody.querySelectorAll('.delBtn').forEach(btn => {
            btn.onclick = () => this.handleDelete(btn.dataset.id);
        });

        // Edit button listeners
        tbody.querySelectorAll('.editBtn').forEach(btn => {
            btn.onclick = () => this.handleEdit(btn.closest('tr'));
        });
    }

    /**
     * Handle delete operation
     * @param {number|string} id - Item ID to delete
     */
    async handleDelete(id) {
        const confirmKey = `${this.entityType}.confirmarEliminar${this.subType.charAt(0).toUpperCase() + this.subType.slice(1)}`;
        const defaultMsg = `¿Eliminar este ${this.entityType}?`;
        
        const confirmed = await showConfirm(getLocalizedTitle(confirmKey, defaultMsg));
        if (!confirmed) return;

        try {
            const endpoint = `/delete/${this.entityType}_${this.subType}`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                this.onDelete(id);
            }
        } catch (err) {
            console.error('Error deleting item:', err);
        }
    }

    /**
     * Handle edit operation
     * @param {HTMLTableRowElement} tr - Table row to edit
     */
    handleEdit(tr) {
        const id = tr.dataset.id;
        const editableCells = tr.querySelectorAll('td.editable');
        const originalData = {};
        const inputs = {};

        // Convert cells to inputs
        editableCells.forEach(cell => {
            const field = cell.dataset.field;
            const column = this.columns.find(c => c.field === field);
            
            if (!column) return;

            originalData[field] = cell.textContent.trim();
            
            let input;
            if (column.inputType === 'date') {
                input = document.createElement('input');
                input.type = 'date';
                input.value = originalData[field];
            } else if (column.inputType === 'select' && column.options) {
                input = document.createElement('select');
                column.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.id;
                    option.textContent = opt.nombre;
                    if (opt.nombre === originalData[field]) option.selected = true;
                    input.appendChild(option);
                });
            } else if (column.inputType === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                input.step = '0.01';
                input.value = parseAmount(originalData[field]);
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = originalData[field];
            }

            input.style.width = '100%';
            inputs[field] = input;
            cell.innerHTML = '';
            cell.appendChild(input);
        });

        // Replace action buttons
        const actionTd = tr.querySelector('td:last-child');
        actionTd.innerHTML = `
            <button class="saveBtn" style="background:#4CAF50;color:white;padding:5px 10px;border:none;cursor:pointer;border-radius:3px;margin-right:5px;">
                <i class="fas fa-save"></i>
            </button>
            <button class="cancelBtn" style="background:#f44336;color:white;padding:5px 10px;border:none;cursor:pointer;border-radius:3px;">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Save button
        actionTd.querySelector('.saveBtn').onclick = async () => {
            const formData = { id };
            this.columns.forEach(col => {
                const input = inputs[col.field];
                if (input) {
                    if (input.type === 'select') {
                        formData[col.field] = input.selectedOptions[0].textContent;
                    } else if (input.type === 'number') {
                        formData[col.field] = parseFloat(input.value);
                    } else {
                        formData[col.field] = input.value;
                    }
                }
            });

            await this.onEdit(formData);
        };

        // Cancel button
        actionTd.querySelector('.cancelBtn').onclick = () => {
            // Reload table
            this.onDelete(); // Trigger reload
        };
    }
}

// Helper function (must be available globally)
function parseAmount(str) {
    if (!str) return 0;
    let cleaned = str.replace(/[^\d.,-]/g, '');
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
        cleaned = cleaned.replace(/,/g, '');
    }
    return parseFloat(cleaned) || 0;
}

export { DataTableManager };
