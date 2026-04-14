(function initHuchaSubhuchasModule(global) {
    if (global.HuchaSubhuchasModule) return;

    function createSubhuchasController(deps) {
        const { showAlert, showConfirm, notifySuccess, notifyError, cargarResumenPeriodos } = deps;
        const uiUtils = global.TabUiCommonUtils || {};

        const t = (key, fallback = '') => {
            if (typeof uiUtils.getText === 'function') {
                return uiUtils.getText(key, fallback);
            }
            return fallback || key;
        };

        const fmt = (monto) => {
            if (typeof uiUtils.formatCurrencyNoConvert === 'function') return uiUtils.formatCurrencyNoConvert(monto);
            return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(monto);
        };

        const now = new Date();
        const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

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
            const [resSH] = await Promise.all([
                fetch('/sub_huchas'),
                fetch('/sub_huchas/0/puntuales').catch(() => ({ ok: false }))
            ]);
            const huchas = resSH.ok ? await resSH.json() : [];

            const allPuntuales = [];
            await Promise.all(huchas.map(async (sh) => {
                try {
                    const r = await fetch(`/sub_huchas/${sh.id}/puntuales`);
                    if (r.ok) {
                        const items = await r.json();
                        items.forEach(i => allPuntuales.push(i));
                    }
                } catch (_) {}
            }));

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
                        if (typeof notifyError === 'function') notifyError(t('mensajes.errorEliminando', 'Error eliminando'));
                    }
                };
            });

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
                            if (typeof notifyError === 'function') notifyError(t('mensajes.errorGuardando', 'Error guardando'));
                        }
                    };
                    actions.querySelector('.cancelSubHuchaBtn').onclick = () => loadSubHuchas();
                };
            });

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
                        if (typeof notifyError === 'function') notifyError(t('mensajes.errorEliminando', 'Error'));
                    }
                };
            });
        }

        async function cargarSubHuchas() {
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
                        if (typeof notifyError === 'function') notifyError(t('mensajes.errorGuardando', 'Error'));
                    }
                };
            }

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
                        if (typeof notifyError === 'function') notifyError(t('mensajes.errorGuardando', 'Error'));
                    }
                };
            }

            await loadSubHuchas();
        }

        return {
            cargarSubHuchas,
            calcularSaldo
        };
    }

    global.HuchaSubhuchasModule = {
        createSubhuchasController
    };
}(window));
