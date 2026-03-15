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

        isCuentaRemuneradaActiva(cr, mesActual) {
            if (!cr || !cr.desde || !cr.hasta) return false;
            return cr.desde <= mesActual && mesActual <= cr.hasta;
        },

        calcularSaldoCuentaRemunerada(cr, mesActual) {
            const monto = parseFloat(cr.monto) || 0;
            const aportacion = parseFloat(cr.aportacion_mensual) || 0;
            const interes = parseFloat(cr.interes) || 0;
            const retencion = parseFloat(cr.retencion) || 0;
            if (!cr.desde || !mesActual) return monto;

            const [desdeY, desdeM] = cr.desde.split('-').map(Number);
            const [actualY, actualM] = mesActual.split('-').map(Number);

            const desdeDate = new Date(desdeY, desdeM - 1, 1);
            const actualMonthDate = new Date(actualY, actualM - 1, 1);
            const mesInteresDate = new Date(actualY, actualM - 2, 1); // interés hasta fin del mes anterior

            const monthsDiff =
                (actualMonthDate.getFullYear() - desdeDate.getFullYear()) * 12 +
                (actualMonthDate.getMonth() - desdeDate.getMonth());

            const aportacionesAcumuladas = Math.max(0, monthsDiff) * aportacion;

            let totalInteres = 0;
            if (interes > 0 && mesInteresDate >= desdeDate) {
                let saldoInteres = monto;
                const current = new Date(desdeDate);

                totalInteres += saldoInteres * (interes / 100) / 12;
                current.setMonth(current.getMonth() + 1);

                while (current <= mesInteresDate) {
                    saldoInteres += aportacion;
                    totalInteres += saldoInteres * (interes / 100) / 12;
                    current.setMonth(current.getMonth() + 1);
                }
            }

            // Aplicar retención: solo se recibe el interés neto
            const interesNeto = totalInteres * (1 - retencion / 100);
            return monto + aportacionesAcumuladas + interesNeto;
        },
        
        async loadData() {
            const [resHucha, resCR, resAssets] = await Promise.all([
                fetch('/hucha'),
                fetch('/cuenta_remunerada'),
                fetch('/assets')
            ]);

            const data = resHucha.ok ? await resHucha.json() : [];
            const cuentasRemuneradas = resCR.ok ? await resCR.json() : [];
            const assets = resAssets.ok ? await resAssets.json() : [];
            const now = new Date();
            const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            
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

            // Agregar cuentas remuneradas activas como filas solo lectura
            cuentasRemuneradas
                .filter(cr => this.isCuentaRemuneradaActiva(cr, mesActual))
                .forEach(cr => {
                    const tr = document.createElement('tr');
                    tr.dataset.auto = 'true';
                    const descripcion = cr.descripcion || cr.categoria || `Cuenta remunerada #${cr.id}`;
                    const saldoActual = this.calcularSaldoCuentaRemunerada(cr, mesActual);
                    tr.innerHTML = `
                        <td>${descripcion}</td>
                        <td><strong>${this.formatCurrency(saldoActual)}</strong></td>
                        <td>—</td>
                    `;
                    this.tbody.appendChild(tr);
                });

            // Calcular total de assets
            let totalAssets = 0;
            for (const asset of assets) {
                try {
                    const currentPrice = await window.getAssetPrice(asset.ticker);
                    if (currentPrice) {
                        totalAssets += asset.shares * currentPrice;
                    }
                } catch (e) {
                    console.error(`Error obteniendo precio para ${asset.ticker}:`, e);
                }
            }

            // Agregar fila sumada de assets si hay
            if (totalAssets > 0) {
                const trAssets = document.createElement('tr');
                trAssets.dataset.auto = 'true';
                trAssets.innerHTML = `
                    <td>Assets (Sumado)</td>
                    <td><strong>${this.formatCurrency(totalAssets)}</strong></td>
                    <td>—</td>
                `;
                this.tbody.appendChild(trAssets);
            }
            
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
