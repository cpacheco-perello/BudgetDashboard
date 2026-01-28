/**
 * Hucha Real - Versión simplificada usando TransactionManager
 * Gestión de fondos de ahorro físico
 */
async function cargarHucha() {
    // Crear TransactionManager simplificado para Hucha (sin categorías)
    const huchaManager = {
        tbody: document.querySelector('#tablaHucha tbody'),
        
        formatCurrency(monto) {
            if (typeof window.formatCurrency === 'function') {
                return window.formatCurrency(monto, { convert: false });
            }
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR'
            }).format(monto);
        },
        
        parseAmount(str) {
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
        },
        
        t(key, fallback = '') {
            if (typeof gestorIdiomas !== 'undefined') {
                const text = gestorIdiomas.obtenerTexto(key);
                if (text !== key) return text;
            }
            return fallback || key;
        },
        
        async loadData() {
            const res = await fetch('/hucha');
            const data = await res.json();
            
            this.tbody.innerHTML = '';
            data.forEach(item => {
                const tr = document.createElement('tr');
                tr.dataset.id = item.id;
                tr.innerHTML = `
                    <td class="editable" data-field="concepto">${item.concepto}</td>
                    <td class="editable" data-field="cantidad"><strong>${this.formatCurrency(item.cantidad)}</strong></td>
                    <td>
                        <button class="editBtn btn-editar" title="${this.t('formularios.editar', 'Editar')}" style="margin-right:8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-id="${item.id}" class="delBtn btn-eliminar" title="${this.t('formularios.eliminar', 'Eliminar')}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                this.tbody.appendChild(tr);
            });
            
            this.attachEvents();
        },
        
        attachEvents() {
            // Eliminar
            document.querySelectorAll('.delBtn').forEach(btn => {
                btn.onclick = async () => {
                    const confirmed = await showConfirm(this.t('formularios.confirmarEliminar', '¿Eliminar este elemento?'));
                    if (!confirmed) return;
                    
                    await fetch('/delete/hucha', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: btn.dataset.id })
                    });
                    this.loadData();
                };
            });
            
            // Editar
            document.querySelectorAll('.editBtn').forEach(btn => {
                btn.onclick = () => this.editRow(btn.closest('tr'));
            });
        },
        
        editRow(tr) {
            const id = tr.dataset.id;
            const conceptoTd = tr.querySelector('[data-field="concepto"]');
            const cantidadTd = tr.querySelector('[data-field="cantidad"]');
            
            const oldConcepto = conceptoTd.textContent;
            const oldCantidad = this.parseAmount(cantidadTd.textContent);
            
            // Convertir a inputs
            conceptoTd.innerHTML = `<input type="text" value="${oldConcepto}" style="width:200px;">`;
            cantidadTd.innerHTML = `€ <input type="number" step="0.01" value="${oldCantidad}" style="width:100px;">`;
            
            // Cambiar botones
            const actionsCell = tr.querySelector('td:last-child');
            actionsCell.innerHTML = `
                <button class="saveBtn btn-success" title="${this.t('formularios.guardar', 'Guardar')}" style="margin-right:8px;">
                    <i class="fas fa-check"></i>
                </button>
                <button class="cancelBtn btn-secondary" title="${this.t('formularios.cancelar', 'Cancelar')}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Guardar
            actionsCell.querySelector('.saveBtn').onclick = async () => {
                const newConcepto = conceptoTd.querySelector('input').value;
                const newCantidad = parseFloat(cantidadTd.querySelector('input').value);
                
                if (!newConcepto) {
                    showAlert(this.t('hucha.conceptoRequerido', 'El concepto es requerido'));
                    return;
                }
                if (isNaN(newCantidad) || newCantidad <= 0) {
                    showAlert(this.t('hucha.cantidadInvalida', 'La cantidad debe ser mayor a 0'));
                    return;
                }
                
                await fetch('/update/hucha', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, concepto: newConcepto, cantidad: newCantidad })
                });
                
                this.loadData();
                if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
            };
            
            // Cancelar
            actionsCell.querySelector('.cancelBtn').onclick = () => {
                this.loadData();
            };
        },
        
        async add(concepto, cantidad) {
            if (!concepto) {
                showAlert(this.t('hucha.conceptoRequerido', 'El concepto es requerido'));
                return;
            }
            if (isNaN(cantidad) || cantidad <= 0) {
                showAlert(this.t('hucha.cantidadInvalida', 'La cantidad debe ser mayor a 0'));
                return;
            }
            
            await fetch('/add/hucha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concepto, cantidad })
            });
            
            this.loadData();
            if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
        }
    };
    
    // ===== AGREGAR NUEVO ITEM =====
    const btnAgregar = document.getElementById('btnAgregarHucha');
    if (btnAgregar) {
        btnAgregar.onclick = async () => {
            const concepto = document.getElementById('conceptoHucha').value;
            const cantidad = parseFloat(document.getElementById('cantidadHucha').value);
            
            await huchaManager.add(concepto, cantidad);
            
            // Limpiar formulario
            document.getElementById('conceptoHucha').value = '';
            document.getElementById('cantidadHucha').value = '';
        };
    }
    
    // Cargar datos iniciales y esperar a que termine
    await huchaManager.loadData();
}

// Inicialización al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tablaHucha')) {
        cargarHucha();
    }
});
