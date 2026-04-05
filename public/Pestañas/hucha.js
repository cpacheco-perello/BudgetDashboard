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
                    const labelCuenta = this.t('ingresos.cuenta_remunerada', 'Cuenta remunerada');
                    const descripcion = cr.descripcion || cr.categoria || `${labelCuenta} #${cr.id}`;
                    const saldoActual = this.calcularSaldoCuentaRemunerada(cr, mesActual);
                    tr.innerHTML = `
                        <td>${descripcion}</td>
                        <td><strong>${this.formatCurrency(saldoActual)}</strong></td>
                        <td>—</td>
                    `;
                    this.tbody.appendChild(tr);
                });

            // Calcular total de assets en paralelo para mejorar tiempos de carga.
            const totalAssets = (await Promise.all(
                assets.map(async (asset) => {
                    try {
                        const currentPrice = await window.getAssetPrice(asset.ticker);
                        return currentPrice ? (asset.shares * currentPrice) : 0;
                    } catch (e) {
                        console.error(`Error obteniendo precio para ${asset.ticker}:`, e);
                        return 0;
                    }
                })
            )).reduce((acc, value) => acc + (Number(value) || 0), 0);

            // Agregar fila sumada de assets si hay
            if (totalAssets > 0) {
                const trAssets = document.createElement('tr');
                trAssets.dataset.auto = 'true';
                const assetsLabel = this.t('ingresos.assets', 'Assets');
                trAssets.innerHTML = `
                    <td>${assetsLabel} (sumado)</td>
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

                    try {
                        const res = await fetch('/delete/hucha', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: btn.dataset.id })
                        });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        this.loadData();
                        if (typeof notifySuccess === 'function') {
                            notifySuccess(this.t('mensajes.elementoEliminado', 'Elemento eliminado'));
                        }
                    } catch (error) {
                        console.error('Error eliminando hucha:', error);
                        if (typeof notifyError === 'function') {
                            notifyError(this.t('mensajes.errorEliminando', 'Error eliminando datos'));
                        }
                    }
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
                
                try {
                    const res = await fetch('/update/hucha', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, concepto: newConcepto, cantidad: newCantidad })
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);

                    this.loadData();
                    if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
                    if (typeof notifySuccess === 'function') {
                        notifySuccess(this.t('mensajes.elementoActualizado', 'Cambios guardados'));
                    }
                } catch (error) {
                    console.error('Error actualizando hucha:', error);
                    if (typeof notifyError === 'function') {
                        notifyError(this.t('mensajes.errorGuardando', 'Error guardando datos'));
                    }
                }
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
            
            try {
                const res = await fetch('/add/hucha', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ concepto, cantidad })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                this.loadData();
                if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
                if (typeof notifySuccess === 'function') {
                    notifySuccess(this.t('mensajes.elementoCreado', 'Hucha guardada'));
                }
            } catch (error) {
                console.error('Error agregando hucha:', error);
                if (typeof notifyError === 'function') {
                    notifyError(this.t('mensajes.errorGuardando', 'Error guardando datos'));
                }
            }
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

    // ===== SUBPESTAÑAS =====
    const botonesSubtab = document.querySelectorAll('#hucha .subtab-btn');
    const subtabs = document.querySelectorAll('#hucha .subtab');

    botonesSubtab.forEach(btn => {
        btn.addEventListener('click', () => {
            botonesSubtab.forEach(b => b.classList.remove('active'));
            subtabs.forEach(st => st.style.display = 'none');
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).style.display = 'block';
        });
    });

    if (botonesSubtab.length > 0) {
        botonesSubtab[0].classList.add('active');
    }

    // ===== SUB-HUCHAS =====
    await cargarSubHuchas();
}

/**
 * Sub-huchas: huchas secundarias con aportación inicial, mensual y puntual
 */
async function cargarSubHuchas() {
    const t = (key, fallback = '') => {
        if (typeof gestorIdiomas !== 'undefined') {
            const text = gestorIdiomas.obtenerTexto(key);
            if (text !== key) return text;
        }
        return fallback || key;
    };

    const fmt = (monto) => {
        if (typeof window.formatCurrency === 'function') return window.formatCurrency(monto, { convert: false });
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(monto);
    };

    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Calcular saldo local (igual que SubHuchaService.calcularSaldo)
    function calcularSaldo(sh, puntuales) {
        const inicial = Number(sh.aportacion_inicial) || 0;
        const mensual = Number(sh.aportacion_mensual) || 0;
        const [dY, dM] = sh.desde.split('-').map(Number);
        const [hY, hM] = sh.hasta.split('-').map(Number);
        const [rY, rM] = mesActual.split('-').map(Number);
        const desdeD = new Date(dY, dM - 1);
        const hastaD = new Date(hY, hM - 1);
        const refD = new Date(rY, rM - 1);
        if (refD < desdeD) return 0;
        const limD = refD < hastaD ? refD : hastaD;
        const meses = Math.max(0, (limD.getFullYear() - desdeD.getFullYear()) * 12 + (limD.getMonth() - desdeD.getMonth()));
        const totalPuntual = (puntuales || [])
            .filter(p => p.fecha.substring(0, 7) <= mesActual)
            .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
        return inicial + meses * mensual + totalPuntual;
    }

    async function loadSubHuchas() {
        const [resSH, resPunt] = await Promise.all([
            fetch('/sub_huchas'),
            fetch('/sub_huchas/0/puntuales').catch(() => ({ ok: false }))
        ]);
        // Get all puntuales across all sub-huchas
        const huchas = resSH.ok ? await resSH.json() : [];

        // Fetch all puntuales per sub-hucha in parallel
        const allPuntuales = [];
        await Promise.all(huchas.map(async (sh) => {
            try {
                const r = await fetch(`/sub_huchas/${sh.id}/puntuales`);
                if (r.ok) {
                    const items = await r.json();
                    items.forEach(i => allPuntuales.push(i));
                }
            } catch (e) { /* ignore */ }
        }));

        // Render sub-huchas table
        const tbody = document.getElementById('tbodySubHuchas');
        if (tbody) {
            tbody.innerHTML = '';
            huchas.forEach(sh => {
                const puntH = allPuntuales.filter(p => p.sub_hucha_id === sh.id);
                const saldo = calcularSaldo(sh, puntH);
                const tr = document.createElement('tr');
                tr.dataset.id = sh.id;
                tr.innerHTML = `
                    <td class="editable" data-field="nombre">${sh.nombre}</td>
                    <td class="editable" data-field="aportacion_inicial"><strong>${fmt(sh.aportacion_inicial)}</strong></td>
                    <td class="editable" data-field="aportacion_mensual"><strong>${fmt(sh.aportacion_mensual)}</strong></td>
                    <td class="editable" data-field="desde">${sh.desde}</td>
                    <td class="editable" data-field="hasta">${sh.hasta}</td>
                    <td><strong>${fmt(saldo)}</strong></td>
                    <td>
                        <button class="editSubHuchaBtn btn-editar" title="${t('formularios.editar', 'Editar')}" style="margin-right:8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-id="${sh.id}" class="delSubHuchaBtn btn-eliminar" title="${t('formularios.eliminar', 'Eliminar')}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Populate select for puntual contributions
        const select = document.getElementById('subHuchaPuntualSelect');
        if (select) {
            select.innerHTML = '';
            huchas.forEach(sh => {
                const opt = document.createElement('option');
                opt.value = sh.id;
                opt.textContent = sh.nombre;
                select.appendChild(opt);
            });
        }

        // Render puntuales table
        const tbodyP = document.getElementById('tbodySubHuchaPuntuales');
        if (tbodyP) {
            tbodyP.innerHTML = '';
            const huchaMap = Object.fromEntries(huchas.map(h => [h.id, h.nombre]));
            allPuntuales.sort((a, b) => b.fecha.localeCompare(a.fecha));
            allPuntuales.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${huchaMap[p.sub_hucha_id] || '#' + p.sub_hucha_id}</td>
                    <td>${p.fecha}</td>
                    <td>${p.descripcion || '—'}</td>
                    <td><strong>${fmt(p.monto)}</strong></td>
                    <td>
                        <button data-id="${p.id}" class="delSubHuchaPuntualBtn btn-eliminar" title="${t('formularios.eliminar', 'Eliminar')}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbodyP.appendChild(tr);
            });
        }

        attachSubHuchaEvents(huchas);
    }

    function attachSubHuchaEvents(huchas) {
        // Delete sub-hucha
        document.querySelectorAll('.delSubHuchaBtn').forEach(btn => {
            btn.onclick = async () => {
                const confirmed = await showConfirm(t('formularios.confirmarEliminar', '¿Eliminar este elemento?'));
                if (!confirmed) return;
                try {
                    const res = await fetch('/delete/sub_hucha', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: btn.dataset.id })
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    loadSubHuchas();
                    if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
                    if (typeof notifySuccess === 'function') notifySuccess(t('mensajes.elementoEliminado', 'Elemento eliminado'));
                } catch (e) {
                    console.error('Error eliminando sub-hucha:', e);
                    if (typeof notifyError === 'function') notifyError(t('mensajes.errorEliminando', 'Error eliminando'));
                }
            };
        });

        // Edit sub-hucha
        document.querySelectorAll('.editSubHuchaBtn').forEach(btn => {
            btn.onclick = () => {
                const tr = btn.closest('tr');
                const id = tr.dataset.id;
                const sh = huchas.find(h => String(h.id) === String(id));
                if (!sh) return;

                tr.querySelector('[data-field="nombre"]').innerHTML = `<input type="text" value="${sh.nombre}" style="width:120px;">`;
                tr.querySelector('[data-field="aportacion_inicial"]').innerHTML = `€ <input type="number" step="0.01" value="${sh.aportacion_inicial}" style="width:80px;">`;
                tr.querySelector('[data-field="aportacion_mensual"]').innerHTML = `€ <input type="number" step="0.01" value="${sh.aportacion_mensual}" style="width:80px;">`;
                tr.querySelector('[data-field="desde"]').innerHTML = `<input type="text" value="${sh.desde}" maxlength="7" pattern="\\d{4}-\\d{2}" title="Formato: YYYY-MM">`;
                tr.querySelector('[data-field="hasta"]').innerHTML = `<input type="text" value="${sh.hasta}" maxlength="7" pattern="\\d{4}-\\d{2}" title="Formato: YYYY-MM">`;

                const actions = tr.querySelector('td:last-child');
                actions.innerHTML = `
                    <button class="saveSubHuchaBtn btn-success" style="margin-right:8px;"><i class="fas fa-check"></i></button>
                    <button class="cancelSubHuchaBtn btn-secondary"><i class="fas fa-times"></i></button>
                `;
                actions.querySelector('.saveSubHuchaBtn').onclick = async () => {
                    const nombre = tr.querySelector('[data-field="nombre"] input').value;
                    const aportacion_inicial = parseFloat(tr.querySelector('[data-field="aportacion_inicial"] input').value) || 0;
                    const aportacion_mensual = parseFloat(tr.querySelector('[data-field="aportacion_mensual"] input').value) || 0;
                    const desde = tr.querySelector('[data-field="desde"] input').value;
                    const hasta = tr.querySelector('[data-field="hasta"] input').value;
                    if (!nombre || !desde || !hasta) { showAlert(t('subHucha.camposRequeridos', 'Nombre, desde y hasta son requeridos')); return; }
                    try {
                        const res = await fetch('/update/sub_hucha', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, nombre, aportacion_inicial, aportacion_mensual, desde, hasta })
                        });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        loadSubHuchas();
                        if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
                        if (typeof notifySuccess === 'function') notifySuccess(t('mensajes.elementoActualizado', 'Guardado'));
                    } catch (e) {
                        console.error('Error actualizando sub-hucha:', e);
                        if (typeof notifyError === 'function') notifyError(t('mensajes.errorGuardando', 'Error guardando'));
                    }
                };
                actions.querySelector('.cancelSubHuchaBtn').onclick = () => loadSubHuchas();
            };
        });

        // Delete puntual
        document.querySelectorAll('.delSubHuchaPuntualBtn').forEach(btn => {
            btn.onclick = async () => {
                const confirmed = await showConfirm(t('formularios.confirmarEliminar', '¿Eliminar?'));
                if (!confirmed) return;
                try {
                    const res = await fetch('/delete/sub_hucha_puntual', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: btn.dataset.id })
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    loadSubHuchas();
                    if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
                    if (typeof notifySuccess === 'function') notifySuccess(t('mensajes.elementoEliminado', 'Eliminado'));
                } catch (e) {
                    console.error('Error eliminando aportación puntual:', e);
                    if (typeof notifyError === 'function') notifyError(t('mensajes.errorEliminando', 'Error'));
                }
            };
        });
    }

    // Add new sub-hucha
    const btnAddSH = document.getElementById('btnAgregarSubHucha');
    if (btnAddSH) {
        btnAddSH.onclick = async () => {
            const nombre = document.getElementById('subHuchaNombre').value;
            const aportacion_inicial = parseFloat(document.getElementById('subHuchaInicial').value) || 0;
            const aportacion_mensual = parseFloat(document.getElementById('subHuchaMensual').value) || 0;
            const desde = document.getElementById('subHuchaDesde').value.trim();
            const hasta = document.getElementById('subHuchaHasta').value.trim();
            const formatoMes = /^\d{4}-\d{2}$/;
            if (!nombre || !desde || !hasta) {
                showAlert(t('subHucha.camposRequeridos', 'Nombre, desde y hasta son requeridos'));
                return;
            }
            if (!formatoMes.test(desde) || !formatoMes.test(hasta)) {
                showAlert(t('subHucha.formatoFecha', 'Formato de fecha: YYYY-MM (ej: 2026-01)'));
                return;
            }
            try {
                const res = await fetch('/add/sub_hucha', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, aportacion_inicial, aportacion_mensual, desde, hasta })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                document.getElementById('subHuchaNombre').value = '';
                document.getElementById('subHuchaInicial').value = '0';
                document.getElementById('subHuchaMensual').value = '0';
                document.getElementById('subHuchaDesde').value = '';
                document.getElementById('subHuchaHasta').value = '';
                loadSubHuchas();
                if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
                if (typeof notifySuccess === 'function') notifySuccess(t('mensajes.elementoCreado', 'Hucha creada'));
            } catch (e) {
                console.error('Error creando sub-hucha:', e);
                if (typeof notifyError === 'function') notifyError(t('mensajes.errorGuardando', 'Error'));
            }
        };
    }

    // Add puntual contribution
    const btnAddP = document.getElementById('btnAgregarSubHuchaPuntual');
    if (btnAddP) {
        btnAddP.onclick = async () => {
            const sub_hucha_id = document.getElementById('subHuchaPuntualSelect').value;
            const fecha = document.getElementById('subHuchaPuntualFecha').value;
            const descripcion = document.getElementById('subHuchaPuntualDesc').value;
            const monto = parseFloat(document.getElementById('subHuchaPuntualMonto').value);
            if (!sub_hucha_id || !fecha || !monto || isNaN(monto)) {
                showAlert(t('subHucha.camposPuntualRequeridos', 'Hucha, fecha y monto son requeridos'));
                return;
            }
            try {
                const res = await fetch('/add/sub_hucha_puntual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sub_hucha_id, fecha, descripcion, monto })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                document.getElementById('subHuchaPuntualFecha').value = '';
                document.getElementById('subHuchaPuntualDesc').value = '';
                document.getElementById('subHuchaPuntualMonto').value = '';
                loadSubHuchas();
                if (typeof cargarResumenPeriodos === 'function') cargarResumenPeriodos();
                if (typeof notifySuccess === 'function') notifySuccess(t('mensajes.elementoCreado', 'Aportación guardada'));
            } catch (e) {
                console.error('Error añadiendo aportación:', e);
                if (typeof notifyError === 'function') notifyError(t('mensajes.errorGuardando', 'Error'));
            }
        };
    }

    await loadSubHuchas();
}

// Inicialización al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tablaHucha')) {
        cargarHucha();
    }
});
