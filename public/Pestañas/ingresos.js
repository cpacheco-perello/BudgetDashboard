
function cargarIngresosForm() {

    const tbodyP = document.querySelector('#tablaIngresosPuntuales tbody');
    const tbodyM = document.querySelector('#tablaIngresosMensuales tbody');
    const tbodyCR = document.querySelector('#tablaCuentaRemunerada tbody');

    const selectCatP = document.getElementById('categoriaIngresoPuntual');
    const selectCatM = document.getElementById('categoriaIngresoMensual');
    const selectCatCR = document.getElementById('categoriaCuentaRemunerada');

    // Función para formatear montos con símbolo Euro
    function formatearEuro(monto) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(monto);
    }

    // Cargar categorías de ingresos
    async function cargarCategorias() {
        const res = await fetch('/categorias');
        const data = await res.json();

        selectCatP.innerHTML = '';
        selectCatM.innerHTML = '';
        if (selectCatCR) selectCatCR.innerHTML = '';

        data.ingresos.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.nombre;
            selectCatP.appendChild(opt);
            selectCatM.appendChild(opt.cloneNode(true));
            if (selectCatCR) selectCatCR.appendChild(opt.cloneNode(true));
        });
    }

    // Cargar ingresos desde backend
    async function cargarIngresos() {
        const res = await fetch('/dashboard');
        const data = await res.json();

        const today = new Date();
        today.setHours(0,0,0,0);

        // Puntuales
        tbodyP.innerHTML = '';
        data.ingresos_puntuales.forEach(i => {
            const iDate = new Date(i.fecha);
            if (!window.showOldIngresos && iDate <= today) return;
            const tr = document.createElement('tr');
            tr.dataset.id = i.id;
            tr.dataset.type = 'puntual';
            tr.innerHTML = `
                <td class="editable" data-field="fecha">${i.fecha}</td>
                <td class="editable" data-field="descripcion">${i.descripcion}</td>
                <td class="editable" data-field="monto"><strong>${formatearEuro(i.monto)}</strong></td>
                <td class="editable" data-field="bruto"><strong>${i.bruto ? formatearEuro(i.bruto) : '—'}</strong></td>
                <td class="editable" data-field="categoria">${i.categoria}</td>
                <td>
                    <button class="editBtn btn-editar" title="Editar" style="margin-right:8px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button data-id="${i.id}" class="delP btn-eliminar" title="Eliminar" style="display:inline-block;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbodyP.appendChild(tr);
        });

        // Mensuales
        tbodyM.innerHTML = '';
        if (data.ingresos_mensuales) {
            data.ingresos_mensuales.forEach(i => {
                function parseEndDate(v) {
                    if (!v) return new Date(0);
                    if (/^\d{4}-\d{2}$/.test(v)) {
                        const [y,m] = v.split('-').map(Number);
                        return new Date(y, m, 0);
                    }
                    return new Date(v);
                }
                const endDate = parseEndDate(i.hasta);
                if (!window.showOldIngresos && endDate <= today) return;
                const tr = document.createElement('tr');
                tr.dataset.id = i.id;
                tr.dataset.type = 'mensual';
                tr.innerHTML = `
                    <td class="editable" data-field="desde">${i.desde}</td>
                    <td class="editable" data-field="hasta">${i.hasta}</td>
                    <td class="editable" data-field="descripcion">${i.descripcion}</td>
                    <td class="editable" data-field="monto"><strong>${formatearEuro(i.monto)}</strong></td>
                    <td class="editable" data-field="bruto"><strong>${i.bruto ? formatearEuro(i.bruto) : '—'}</strong></td>
                    <td class="editable" data-field="categoria">${i.categoria}</td>
                    <td>
                        <button class="editBtn btn-editar" title="Editar" style="margin-right:8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-id="${i.id}" class="delM btn-eliminar" title="Eliminar" style="display:inline-block;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbodyM.appendChild(tr);
            });
        }

        // Cuenta Remunerada
        if (tbodyCR && data.cuenta_remunerada) {
            tbodyCR.innerHTML = '';
            data.cuenta_remunerada.forEach(i => {
                function parseEndDate(v) {
                    if (!v) return new Date(0);
                    if (/^\d{4}-\d{2}$/.test(v)) {
                        const [y,m] = v.split('-').map(Number);
                        return new Date(y, m, 0);
                    }
                    return new Date(v);
                }
                const endDate = parseEndDate(i.hasta);
                if (!window.showOldCuentaRemunerada && endDate <= today) return;
                
                const tr = document.createElement('tr');
                tr.dataset.id = i.id;
                tr.dataset.type = 'cuenta_remunerada';
                tr.innerHTML = `
                    <td class="editable" data-field="desde">${i.desde}</td>
                    <td class="editable" data-field="hasta">${i.hasta}</td>
                    <td class="editable" data-field="monto"><strong>${formatearEuro(i.monto)}</strong></td>
                    <td class="editable" data-field="aportacion_mensual"><strong>${i.aportacion_mensual ? formatearEuro(i.aportacion_mensual) : '—'}</strong></td>
                    <td class="editable" data-field="interes">${i.interes ? i.interes + '%' : '—'}</td>
                    <td><strong>${formatearEuro(i.interes_generado)}</strong></td>
                    <td class="editable" data-field="categoria">${i.categoria}</td>
                    <td>
                        <button class="editBtn btn-editar" title="Editar" style="margin-right:8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delCR btn-eliminar" data-id="${i.id}" title="Eliminar" style="display:inline-block;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbodyCR.appendChild(tr);
            });
        }

        // Botones eliminar Puntuales
        document.querySelectorAll('.delP').forEach(b => {
            b.onclick = async () => {
                if (!confirm('¿Eliminar este ingreso?')) return;
                await fetch('/delete/ingreso_puntual', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({id: b.dataset.id})
                });
                cargarIngresos();
            };
        });

        // Botones eliminar Mensuales
        document.querySelectorAll('.delM').forEach(b => {
            b.onclick = async () => {
                if (!confirm('¿Eliminar este ingreso mensual?')) return;
                await fetch('/delete/ingreso_mensual', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({id: b.dataset.id})
                });
                cargarIngresos();
            };
        });

        // Botones eliminar Cuenta Remunerada
        document.querySelectorAll('.delCR').forEach(b => {
            b.onclick = async () => {
                if (!confirm('¿Eliminar esta aportación?')) return;
                await fetch('/delete/cuenta_remunerada', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({id: b.dataset.id})
                });
                cargarIngresos();
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
                    : tipo === 'mensual'
                    ? Array.from(selectCatM.options).map(o => ({ id: o.value, nombre: o.textContent }))
                    : Array.from(selectCatCR.options).map(o => ({ id: o.value, nombre: o.textContent }));

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
                    } else if (field === 'monto' || field === 'aportacion_mensual' || field === 'bruto') {
                        const input = document.createElement('input');
                        input.type = 'number';
                        input.step = '0.01';
                        input.value = parseFloat(valor.replace(/[€\s.]/g, '').replace(',', '.')) || '';
                        input.style.width = '100px';
                        celda.innerHTML = '€ ';
                        celda.appendChild(input);
                    } else if (field === 'interes') {
                        const input = document.createElement('input');
                        input.type = 'number';
                        input.step = '0.01';
                        input.value = parseFloat(valor.replace(/[%\s]/g, '')) || '';
                        input.style.width = '80px';
                        celda.innerHTML = '';
                        celda.appendChild(input);
                        const span = document.createElement('span');
                        span.textContent = ' %';
                        celda.appendChild(span);
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
                        cargarIngresos();
                        return;
                    }

                    // Validaciones
                    if (tipo !== 'cuenta_remunerada' && !nuevos.descripcion) return alert('Descripción requerida');
                    if (!nuevos.categoria) return alert('Categoría requerida');
                    if (isNaN(parseFloat(nuevos.monto)) || parseFloat(nuevos.monto) <= 0) {
                        return alert('Monto inválido');
                    }

                    function validarMes(valor) {
                        return /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
                    }

                    if (tipo === 'puntual') {
                        if (!nuevos.fecha) return alert('Fecha requerida');
                        await fetch('/update/ingreso_puntual', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: id,
                                fecha: nuevos.fecha,
                                descripcion: nuevos.descripcion,
                                monto: parseFloat(nuevos.monto),
                                bruto: nuevos.bruto ? parseFloat(nuevos.bruto) : null,
                                categoria: nuevos.categoria
                            })
                        });
                    } else if (tipo === 'mensual') {
                        if (!validarMes(nuevos.desde)) return alert("El campo 'Desde' debe tener formato YYYY-MM");
                        if (!validarMes(nuevos.hasta)) return alert("El campo 'Hasta' debe tener formato YYYY-MM");
                        await fetch('/update/ingreso_mensual', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: id,
                                desde: nuevos.desde,
                                hasta: nuevos.hasta,
                                descripcion: nuevos.descripcion,
                                monto: parseFloat(nuevos.monto),
                                bruto: nuevos.bruto ? parseFloat(nuevos.bruto) : null,
                                categoria: nuevos.categoria
                            })
                        });
                    } else if (tipo === 'cuenta_remunerada') {
                        if (!validarMes(nuevos.desde)) return alert("El campo 'Desde' debe tener formato YYYY-MM");
                        if (!validarMes(nuevos.hasta)) return alert("El campo 'Hasta' debe tener formato YYYY-MM");
                        if (isNaN(parseFloat(nuevos.aportacion_mensual)) && nuevos.aportacion_mensual !== '') {
                            return alert('Aportación mensual inválida');
                        }
                        if (isNaN(parseFloat(nuevos.interes)) && nuevos.interes !== '') {
                            return alert('Interés inválido');
                        }
                        await fetch('/update/cuenta_remunerada', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: id,
                                desde: nuevos.desde,
                                hasta: nuevos.hasta,
                                descripcion: nuevos.descripcion,
                                monto: parseFloat(nuevos.monto),
                                aportacion_mensual: nuevos.aportacion_mensual ? parseFloat(nuevos.aportacion_mensual) : null,
                                interes: nuevos.interes ? parseFloat(nuevos.interes) : null,
                                categoria: nuevos.categoria
                            })
                        });
                    }

                    cargarIngresos();
                };

                // Cancelar
                tdAcciones.querySelector('.cancelBtn').onclick = () => {
                    cargarIngresos();
                };
            };
        });
    }

    // Agregar ingreso puntual
    document.getElementById('btnAgregarIngresoPuntual').onclick = async () => {
        const fecha = document.getElementById('fechaIngresoPuntual').value;
        const descripcion = document.getElementById('descIngresoPuntual').value;
        const monto = parseFloat(document.getElementById('montoIngresoPuntual').value);
        const bruto = parseFloat(document.getElementById('brutoIngresoPuntual').value) || null;
        const categoria_id = selectCatP.value;

        if(!fecha) return alert("Selecciona una fecha");
        if(!descripcion) return alert("Ingresa una descripción");
        if(isNaN(monto) || monto <= 0) return alert("Monto inválido");
        if(!categoria_id) return alert("Selecciona una categoría");

        await fetch('/add/ingreso_puntual', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({fecha, descripcion, monto, bruto, categoria_id})
        });

        // Limpiar inputs
        document.getElementById('fechaIngresoPuntual').value = '';
        document.getElementById('descIngresoPuntual').value = '';
        document.getElementById('montoIngresoPuntual').value = '';
        document.getElementById('brutoIngresoPuntual').value = '';
        cargarIngresos();
    };

    // Toggle mostrar/ocultar ingresos antiguos (aplica a puntuales, mensuales y cuenta remunerada)
    window.showOldIngresos = false;
    window.showOldCuentaRemunerada = false;
    const toggleBtns = [
        document.getElementById('toggleIngresosAntiguos'),
        document.getElementById('toggleIngresosMensualesAntiguos')
    ].filter(Boolean);
    const toggleCRBtn = document.getElementById('toggleCuentaRemuneradaAntiguos');
    if (toggleBtns.length) {
        const updateAll = () => {
            const textoMostrar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.mostrarAntiguos') : 'Mostrar antiguos';
            const textoOcultar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.ocultarAntiguos') : 'Ocultar antiguos';
            toggleBtns.forEach(b => b.textContent = window.showOldIngresos ? textoOcultar : textoMostrar);
            if (toggleCRBtn) toggleCRBtn.textContent = window.showOldCuentaRemunerada ? textoOcultar : textoMostrar;
        };
        toggleBtns.forEach(b => b.addEventListener('click', () => {
            window.showOldIngresos = !window.showOldIngresos;
            updateAll();
            cargarIngresos();
        }));
        if (toggleCRBtn) {
            toggleCRBtn.addEventListener('click', () => {
                window.showOldCuentaRemunerada = !window.showOldCuentaRemunerada;
                updateAll();
                cargarIngresos();
            });
        }
        updateAll();
    }
    const btnAgregarCR = document.getElementById('btnAgregarCuentaRemunerada');
    if (btnAgregarCR) {
        btnAgregarCR.onclick = async () => {
            const desde = document.getElementById('desdeCuentaRemunerada').value;
            const hasta = document.getElementById('hastaCuentaRemunerada').value;
            const monto = parseFloat(document.getElementById('montoCuentaRemunerada').value);
            const aportacion_mensual = parseFloat(document.getElementById('aportacionMensualCR').value) || null;
            const interes = parseFloat(document.getElementById('interesCuentaRemunerada').value) || null;
            const categoria_id = selectCatCR.value;

            function validarMes(valor) {
                return /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
            }

            if(!desde) return alert("Ingresa el mes 'desde' en formato YYYY-MM");
            if(!hasta) return alert("Ingresa el mes 'hasta' en formato YYYY-MM");
            if(isNaN(monto) || monto <= 0) return alert("Monto inicial inválido");
            if(!categoria_id) return alert("Selecciona una categoría");
            if(!validarMes(desde)) return alert("El campo 'Desde' debe tener formato YYYY-MM");
            if(!validarMes(hasta)) return alert("El campo 'Hasta' debe tener formato YYYY-MM");
            if (desde > hasta) return alert("El mes 'desde' no puede ser mayor que 'hasta'");

            await fetch('/add/cuenta_remunerada', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({desde, hasta, monto, aportacion_mensual, interes, categoria_id})
            });

            // Limpiar inputs
            document.getElementById('desdeCuentaRemunerada').value = '';
            document.getElementById('hastaCuentaRemunerada').value = '';
            document.getElementById('montoCuentaRemunerada').value = '';
            document.getElementById('aportacionMensualCR').value = '';
            document.getElementById('interesCuentaRemunerada').value = '';
            cargarIngresos();
        };
    }

    // Agregar ingreso mensual
    document.getElementById('btnAgregarIngresoMensual').onclick = async () => {
        const desde = document.getElementById('desdeIngresoMensual').value;
        const hasta = document.getElementById('hastaIngresoMensual').value;
        const descripcion = document.getElementById('descIngresoMensual').value;
        const monto = parseFloat(document.getElementById('montoIngresoMensual').value);
        const bruto = parseFloat(document.getElementById('brutoIngresoMensual').value) || null;
        const categoria_id = selectCatM.value;

        function validarMes(valor) {
            return /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
        }

        if(!desde) return alert("Ingresa el mes 'desde' en formato YYYY-MM");
        if(!hasta) return alert("Ingresa el mes 'hasta' en formato YYYY-MM");
        if(!descripcion) return alert("Ingresa una descripción");
        if(isNaN(monto) || monto <= 0) return alert("Monto inválido");
        if(!categoria_id) return alert("Selecciona una categoría");

        if(!validarMes(desde)) return alert("El campo 'Desde' debe tener formato YYYY-MM");
        if(!validarMes(hasta)) return alert("El campo 'Hasta' debe tener formato YYYY-MM");

        if (desde > hasta)
            return alert("El mes 'desde' no puede ser mayor que 'hasta'");

        await fetch('/add/ingreso_mensual', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({desde, hasta, descripcion, monto, bruto, categoria_id})
        });

        // Limpiar inputs
        document.getElementById('desdeIngresoMensual').value = '';
        document.getElementById('hastaIngresoMensual').value = '';
        document.getElementById('descIngresoMensual').value = '';
        document.getElementById('montoIngresoMensual').value = '';
        document.getElementById('brutoIngresoMensual').value = '';
        cargarIngresos();
    };

    // ===== Script para subpestañas de ingresos =====

    const botonesSubtab = document.querySelectorAll('#ingresos .subtab-btn');
    const subtabs = document.querySelectorAll('#ingresos .subtab');

    botonesSubtab.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos los botones
            botonesSubtab.forEach(b => b.classList.remove('active'));
            // Remover display de todos los subtabs
            subtabs.forEach(st => st.style.display = 'none');
            // Agregar active al botón clickeado
            btn.classList.add('active');
            // Mostrar el subtab correspondiente
            document.getElementById(btn.dataset.target).style.display = 'block';
        });
    });

    // Establecer active por defecto en el primer botón
    if (botonesSubtab.length > 0) {
        botonesSubtab[0].classList.add('active');
    }

    // Permitir agregar con Enter
    document.getElementById('descIngresoPuntual').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('btnAgregarIngresoPuntual').click();
    });
    document.getElementById('descIngresoMensual').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('btnAgregarIngresoMensual').click();
    });

    // Listener para cambios de idioma
    document.addEventListener('idiomaActualizado', () => {
        const toggleBtns = [
            document.getElementById('toggleIngresosAntiguos'),
            document.getElementById('toggleIngresosMensualesAntiguos')
        ].filter(Boolean);
        const toggleCRBtn = document.getElementById('toggleCuentaRemuneradaAntiguos');
        if (toggleBtns.length) {
            const textoMostrar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.mostrarAntiguos') : 'Mostrar antiguos';
            const textoOcultar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.ocultarAntiguos') : 'Ocultar antiguos';
            toggleBtns.forEach(b => b.textContent = window.showOldIngresos ? textoOcultar : textoMostrar);
            if (toggleCRBtn) toggleCRBtn.textContent = window.showOldCuentaRemunerada ? textoOcultar : textoMostrar;
        }
    });

    // Inicializar
    cargarCategorias();
    cargarIngresos();
}