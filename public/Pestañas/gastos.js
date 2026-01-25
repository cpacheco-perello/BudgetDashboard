function cargarGastosForm() {
    const tbodyP = document.querySelector('#tablaGastosPuntuales tbody');
    const tbodyM = document.querySelector('#tablaGastosMensuales tbody');

    const selectCatP = document.getElementById('categoriaGasto');
    const selectCatM = document.getElementById('categoriaMensual');

    async function cargarCategorias() {
        const res = await fetch('/categorias');
        const data = await res.json();

        selectCatP.innerHTML = '';
        selectCatM.innerHTML = '';

        data.gastos.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.nombre;
            selectCatP.appendChild(opt);
            selectCatM.appendChild(opt.cloneNode(true));
        });
    }

    // Función para formatear montos con símbolo Euro
    function formatearEuro(monto) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(monto);
    }

    async function cargarGastos() {
        const res = await fetch('/dashboard');
        const data = await res.json();

        // fecha de hoy (inicio del día) para filtrar antiguos
        const today = new Date();
        today.setHours(0,0,0,0);

        // Puntuales
        tbodyP.innerHTML = '';
        data.gastos_puntuales.forEach(g => {
            const gDate = new Date(g.fecha);
            if (!window.showOldGastos && gDate < today) return; // ocultar antiguos si flag desactivado
            const tr = document.createElement('tr');
            tr.dataset.id = g.id;
            tr.dataset.type = 'puntual';
            tr.innerHTML = `
                <td class="editable" data-field="fecha">${g.fecha}</td>
                <td class="editable" data-field="descripcion">${g.descripcion}</td>
                <td class="editable" data-field="monto"><strong>${formatearEuro(g.monto)}</strong></td>
                <td class="editable" data-field="categoria">${g.categoria}</td>
                <td>
                    <button class="editBtn btn-editar" title="Editar" style="margin-right:8px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button data-id="${g.id}" class="delP btn-eliminar" title="Eliminar" style="display:inline-block;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbodyP.appendChild(tr);
        });

        // Mensuales
        tbodyM.innerHTML = '';
        data.gastos_mensuales.forEach(g => {
            // 'hasta' puede venir como YYYY-MM o YYYY-MM-DD
            function parseEndDate(v) {
                if (!v) return new Date(0);
                if (/^\d{4}-\d{2}$/.test(v)) {
                    const [y,m] = v.split('-').map(Number);
                    return new Date(y, m, 0); // último día del mes
                }
                return new Date(v);
            }
            const endDate = parseEndDate(g.hasta);
            if (!window.showOldGastos && endDate < today) return;
            const tr = document.createElement('tr');
            tr.dataset.id = g.id;
            tr.dataset.type = 'mensual';
            tr.innerHTML = `
                <td class="editable" data-field="desde">${g.desde}</td>
                <td class="editable" data-field="hasta">${g.hasta}</td>
                <td class="editable" data-field="descripcion">${g.descripcion}</td>
                <td class="editable" data-field="monto"><strong>${formatearEuro(g.monto)}</strong></td>
                <td class="editable" data-field="categoria">${g.categoria}</td>
                <td>
                    <button class="editBtn btn-editar" title="Editar" style="margin-right:8px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button data-id="${g.id}" class="delM btn-eliminar" title="Eliminar" style="display:inline-block;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbodyM.appendChild(tr);
        });

        // Eliminar Puntuales
        document.querySelectorAll('.delP').forEach(b => {
            b.onclick = async () => {
                if (!confirm('¿Eliminar este gasto?')) return;
                await fetch('/delete/gasto_puntual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: b.dataset.id })
                });
                cargarGastos();
            };
        });

        // Eliminar Mensuales
        document.querySelectorAll('.delM').forEach(b => {
            b.onclick = async () => {
                if (!confirm('¿Eliminar este gasto mensual?')) return;
                await fetch('/delete/gasto_mensual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: b.dataset.id })
                });
                cargarGastos();
            };
        });

        // Editar filas
        document.querySelectorAll('.editBtn').forEach(btn => {
            btn.onclick = (e) => {
                const tr = btn.closest('tr');
                const tipo = tr.dataset.type;
                const id = tr.dataset.id;
                
                // Obtener datos originales
                const celdas = tr.querySelectorAll('td.editable');
                const datos = {};
                const originales = {};
                
                celdas.forEach(celda => {
                    const field = celda.dataset.field;
                    const valor = celda.textContent.trim();
                    datos[field] = valor;
                    originales[field] = valor;
                });

                // Convertir a modo edición
                const categorias = tipo === 'puntual' 
                    ? Array.from(selectCatP.options).map(o => ({ id: o.value, nombre: o.textContent }))
                    : Array.from(selectCatM.options).map(o => ({ id: o.value, nombre: o.textContent }));

                celdas.forEach(celda => {
                    const field = celda.dataset.field;
                    const valor = datos[field];
                    
                    if (field === 'categoria') {
                        const select = document.createElement('select');
                        categorias.forEach(cat => {
                            const opt = document.createElement('option');
                            opt.value = cat.nombre;
                            opt.textContent = cat.nombre;
                            if (cat.nombre === valor) opt.selected = true;
                            select.appendChild(opt);
                        });
                        celda.innerHTML = '';
                        celda.appendChild(select);
                    } else if (field === 'monto') {
                        const input = document.createElement('input');
                        input.type = 'number';
                        input.step = '0.01';
                        input.value = parseFloat(valor.replace(/[€\s.]/g, '').replace(',', '.')) || 0;
                        input.style.width = '100px';
                        celda.innerHTML = '€ ';
                        celda.appendChild(input);
                    } else if (field === 'fecha' || field === 'desde' || field === 'hasta') {
                        const input = document.createElement('input');
                        input.type = field === 'monto' ? 'number' : 'text';
                        input.value = valor;
                        if (field === 'desde' || field === 'hasta') {
                            input.placeholder = 'YYYY-MM';
                            input.maxLength = '7';
                        }
                        input.style.width = field === 'fecha' || field === 'desde' || field === 'hasta' ? '120px' : '200px';
                        celda.innerHTML = '';
                        celda.appendChild(input);
                    } else {
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = valor;
                        input.style.width = '200px';
                        celda.innerHTML = '';
                        celda.appendChild(input);
                    }
                });

                // Reemplazar botones por Guardar/Cancelar
                const tdAcciones = tr.querySelector('td:last-child');
                tdAcciones.innerHTML = `
                    <button class="saveBtn" style="background:#4CAF50;color:white;padding:5px 10px;border:none;cursor:pointer;border-radius:3px;margin-right:5px;">
                        <i class="fas fa-save"></i>
                    </button>
                    <button class="cancelBtn" style="background:#f44336;color:white;padding:5px 10px;border:none;cursor:pointer;border-radius:3px;">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                // Guardar
                tdAcciones.querySelector('.saveBtn').onclick = async () => {
                    const nuevos = {};
                    let cambios = false;

                    tr.querySelectorAll('td.editable').forEach(celda => {
                        const field = celda.dataset.field;
                        const input = celda.querySelector('input, select');
                        if (input) {
                            nuevos[field] = input.value;
                            if (input.value !== originales[field]) cambios = true;
                        }
                    });

                    if (!cambios) {
                        alert('No hay cambios');
                        cargarGastos();
                        return;
                    }

                    // Validaciones
                    if (!nuevos.descripcion) return alert('Descripción requerida');
                    if (!nuevos.categoria) return alert('Categoría requerida');
                    if (isNaN(parseFloat(nuevos.monto)) || parseFloat(nuevos.monto) <= 0) {
                        return alert('Monto inválido');
                    }

                    if (tipo === 'puntual') {
                        if (!nuevos.fecha) return alert('Fecha requerida');
                        await fetch('/update/gasto_puntual', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: id,
                                fecha: nuevos.fecha,
                                descripcion: nuevos.descripcion,
                                monto: parseFloat(nuevos.monto),
                                categoria: nuevos.categoria
                            })
                        });
                    } else {
                        if (!validarYYYYMM(nuevos.desde)) return alert("El campo 'Desde' debe tener formato YYYY-MM");
                        if (!validarYYYYMM(nuevos.hasta)) return alert("El campo 'Hasta' debe tener formato YYYY-MM");
                        await fetch('/update/gasto_mensual', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: id,
                                desde: nuevos.desde,
                                hasta: nuevos.hasta,
                                descripcion: nuevos.descripcion,
                                monto: parseFloat(nuevos.monto),
                                categoria: nuevos.categoria
                            })
                        });
                    }

                    cargarGastos();
                };

                // Cancelar
                tdAcciones.querySelector('.cancelBtn').onclick = () => {
                    cargarGastos();
                };
            };
        });
    }

    // Agregar gasto puntual
    document.getElementById('btnAgregarGastoPuntual').onclick = async () => {
        const fecha = document.getElementById('fechaGasto').value;
        const desc = document.getElementById('descGasto').value;
        const monto = parseFloat(document.getElementById('montoGasto').value);

        const fraccionar = document.getElementById('fraccionarGasto')?.checked;
        const partes = parseInt(document.getElementById('partesGasto')?.value || '1', 10) || 1;

        if (!fecha) return alert("Selecciona una fecha");
        if (!desc) return alert("Ingresa una descripción");
        if (isNaN(monto) || monto <= 0) return alert("Monto inválido");
        // Si no se fracciona, enviar una sola entrada
        if (!fraccionar || partes <= 1) {
            await fetch('/add/gasto_puntual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fecha: fecha,
                    descripcion: desc,
                    monto: monto,
                    categoria_id: selectCatP.value
                })
            });
        } else {
            // Distribuir el monto en 'partes' respetando dos decimales
            const totalCents = Math.round(monto * 100);
            const base = Math.floor(totalCents / partes);
            const remainder = totalCents - base * partes;

            function addMonthsToDate(dateStr, months) {
                const d = new Date(dateStr);
                const day = d.getDate();
                d.setMonth(d.getMonth() + months);
                // si el mes cambió y día se desplazó, ajustar al último día del mes
                if (d.getDate() !== day) {
                    d.setDate(0);
                }
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${dd}`;
            }

            const promises = [];
            for (let i = 0; i < partes; i++) {
                let cents = base + (i < remainder ? 1 : 0);
                const partMonto = (cents / 100);
                const partFecha = addMonthsToDate(fecha, i);
                promises.push(fetch('/add/gasto_puntual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fecha: partFecha,
                        descripcion: desc + ` (parte ${i + 1}/${partes})`,
                        monto: partMonto,
                        categoria_id: selectCatP.value
                    })
                }));
            }

            await Promise.all(promises);
        }

        document.getElementById('fechaGasto').value = '';
        document.getElementById('descGasto').value = '';
        document.getElementById('montoGasto').value = '';
        const chk = document.getElementById('fraccionarGasto');
        if (chk) chk.checked = false;
        const partsInput = document.getElementById('partesGasto');
        if (partsInput) partsInput.value = '1';
        cargarGastos();
    };

    // Toggle mostrar/ocultar gastos antiguos (aplica a puntuales y mensuales)
    window.showOldGastos = false;
    const toggleBtns = [
        document.getElementById('toggleGastosAntiguos'),
        document.getElementById('toggleGastosMensualesAntiguos')
    ].filter(Boolean);
    if (toggleBtns.length) {
        const updateAll = () => {
            toggleBtns.forEach(b => b.textContent = window.showOldGastos ? 'Ocultar antiguos' : 'Mostrar antiguos');
        };
        toggleBtns.forEach(b => b.addEventListener('click', () => {
            window.showOldGastos = !window.showOldGastos;
            updateAll();
            cargarGastos();
        }));
        updateAll();
    }

    // Función para validar YYYY-MM
    function validarYYYYMM(valor) {
        return /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
    }

    // Agregar gasto mensual
    document.getElementById('btnAgregarMensual').onclick = async () => {
        const desde = document.getElementById('desdeGasto').value;
        const hasta = document.getElementById('hastaGasto').value;
        const desc = document.getElementById('descMensual').value;
        const monto = parseFloat(document.getElementById('montoMensual').value);
        const categoria = document.getElementById('categoriaMensual').value;

        // Validaciones
        if (!validarYYYYMM(desde)) return alert("El campo 'Desde' debe tener formato YYYY-MM");
        if (!validarYYYYMM(hasta)) return alert("El campo 'Hasta' debe tener formato YYYY-MM");
        if (!desc) return alert("Descripción requerida");
        if (isNaN(monto) || monto <= 0) return alert("Monto inválido");
        if (!categoria) return alert("Selecciona una categoría");

        // Enviar al backend
        await fetch('/add/gasto_mensual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                descripcion: desc,
                monto: monto,
                categoria_id: categoria,
                desde: desde,
                hasta: hasta
            })
        });

        document.getElementById('desdeGasto').value = '';
        document.getElementById('hastaGasto').value = '';
        document.getElementById('descMensual').value = '';
        document.getElementById('montoMensual').value = '';
        cargarGastos();
    };

    // Subpestañas
    const btnPuntuales = document.getElementById('tabGastosPuntualesBtn');
    const btnMensuales = document.getElementById('tabGastosMensualesBtn');
    const tabPuntuales = document.getElementById('tabGastosPuntuales');
    const tabMensuales = document.getElementById('tabGastosMensuales');

    // Toggle visibilidad del campo de partes para fraccionamiento
    const chkFraccionar = document.getElementById('fraccionarGasto');
    const inputPartes = document.getElementById('partesGasto');
    if (chkFraccionar && inputPartes) {
        const setVisible = (visible) => {
            inputPartes.style.display = visible ? 'inline-block' : 'none';
            inputPartes.setAttribute('aria-hidden', visible ? 'false' : 'true');
        };
        setVisible(!!chkFraccionar.checked);
        chkFraccionar.addEventListener('change', () => {
            setVisible(!!chkFraccionar.checked);
            if (!chkFraccionar.checked) inputPartes.value = '1';
        });
    }

    btnPuntuales.onclick = () => {
        tabPuntuales.style.display = 'block';
        tabMensuales.style.display = 'none';
        btnPuntuales.classList.add('active');
        btnMensuales.classList.remove('active');
    };

    btnMensuales.onclick = () => {
        tabPuntuales.style.display = 'none';
        tabMensuales.style.display = 'block';
        btnPuntuales.classList.remove('active');
        btnMensuales.classList.add('active');
    };

    // Establecer active por defecto en Puntuales
    btnPuntuales.classList.add('active');

    cargarCategorias();
    cargarGastos();
}