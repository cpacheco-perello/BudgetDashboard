
function cargarIngresosForm() {

    const tbodyP = document.querySelector('#tablaIngresosPuntuales tbody');
    const tbodyM = document.querySelector('#tablaIngresosMensuales tbody');
    const tbodyCR = document.querySelector('#tablaCuentaRemunerada tbody');
    const tbodyAssets = document.querySelector('#tablaAssets tbody');

    const selectCatP = document.getElementById('categoriaIngresoPuntual');
    const selectCatM = document.getElementById('categoriaIngresoMensual');
    const selectCatCR = document.getElementById('categoriaCuentaRemunerada');
    // Assets usan categoría fija interna; no hay selector visible

    // Función global para formatear montos según moneda seleccionada
    function formatearEuro(monto) {
        if (typeof window.formatCurrency === 'function') return window.formatCurrency(monto);
        if (monto === null || monto === undefined) return '€0,00';
        return '€' + parseFloat(monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    // Parse amount from formatted string (handles both EUR and USD formats)
    function parseAmount(str) {
        if (!str) return 0;
        // Remove currency symbols and whitespace
        let cleaned = str.replace(/[^\d.,-]/g, '');
        // Handle both formats: 1.234,56 (EUR) and 1,234.56 (USD)
        // Find last separator
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
            // No poblar categorías para Assets (categoría interna fija)
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
                    const tituloEditar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('formularios.editar') : 'Editar';
                    const tituloEliminar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('formularios.eliminar') : 'Eliminar';
                    const tituloVender = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.sellAsset') : 'Vender';
            tr.dataset.id = i.id;
            tr.dataset.type = 'puntual';
            tr.innerHTML = `
                <td class="editable" data-field="fecha">${i.fecha}</td>
                <td class="editable" data-field="descripcion">${i.descripcion}</td>
                <td class="editable" data-field="monto"><strong>${formatearEuro(i.monto)}</strong></td>
                <td class="editable" data-field="bruto"><strong>${i.bruto !== undefined && i.bruto !== null ? formatearEuro(i.bruto) : '—'}</strong></td>
                <td class="editable" data-field="categoria">${i.categoria}</td>
                <td>
                        <button class="editBtn btn-editar" title="${tituloEditar}" style="margin-right:8px;">
                        <i class="fas fa-edit"></i>
                    </button>
                        <button data-id="${i.id}" class="delP btn-eliminar" title="${tituloEliminar}" style="display:inline-block;">
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
                    const tituloEditar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('formularios.editar') : 'Editar';
                    const tituloEliminar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('formularios.eliminar') : 'Eliminar';
                tr.dataset.id = i.id;
                tr.dataset.type = 'mensual';
                tr.innerHTML = `
                    <td class="editable" data-field="desde">${i.desde}</td>
                    <td class="editable" data-field="hasta">${i.hasta}</td>
                    <td class="editable" data-field="descripcion">${i.descripcion}</td>
                    <td class="editable" data-field="monto"><strong>${formatearEuro(i.monto)}</strong></td>
                    <td class="editable" data-field="bruto"><strong>${i.bruto !== undefined && i.bruto !== null ? formatearEuro(i.bruto) : '—'}</strong></td>
                    <td class="editable" data-field="categoria">${i.categoria}</td>
                    <td>
                            <button class="editBtn btn-editar" title="${tituloEditar}" style="margin-right:8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                            <button data-id="${i.id}" class="delM btn-eliminar" title="${tituloEliminar}" style="display:inline-block;">
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
                    const tituloEditar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('formularios.editar') : 'Editar';
                    const tituloEliminar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('formularios.eliminar') : 'Eliminar';
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
                            <button class="editBtn btn-editar" title="${tituloEditar}" style="margin-right:8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                            <button class="delCR btn-eliminar" data-id="${i.id}" title="${tituloEliminar}" style="display:inline-block;">
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
                if (!confirm(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.confirmarEliminarPuntual') : '¿Eliminar este ingreso?')) return;
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
                if (!confirm(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.confirmarEliminarMensual') : '¿Eliminar este ingreso mensual?')) return;
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
                if (!confirm(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.confirmarEliminarAportacion') : '¿Eliminar esta aportación?')) return;
                await fetch('/delete/cuenta_remunerada', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({id: b.dataset.id})
                });
                cargarIngresos();
            };
        });

        // Assets
        if (tbodyAssets) {
            cargarAssets();
        }

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
                        input.value = parseAmount(valor);
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
                        alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.noHayCambios') : 'No hay cambios');
                        cargarIngresos();
                        return;
                    }

                    // Validaciones
                    if (tipo !== 'cuenta_remunerada' && !nuevos.descripcion) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.descripcionRequerida') : 'Descripción requerida');
                    if (!nuevos.categoria) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.categoriaRequerida') : 'Categoría requerida');
                    if (isNaN(parseFloat(nuevos.monto)) || parseFloat(nuevos.monto) <= 0) {
                        return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.montoInvalido') : 'Monto inválido');
                    }

                    function validarMes(valor) {
                        return /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
                    }

                    if (tipo === 'puntual') {
                        if (!nuevos.fecha) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.fechaRequerida') : 'Fecha requerida');
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
                        if (!validarMes(nuevos.desde)) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.formatoDesde') : "El campo 'Desde' debe tener formato YYYY-MM");
                        if (!validarMes(nuevos.hasta)) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.formatoHasta') : "El campo 'Hasta' debe tener formato YYYY-MM");
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
                        if (!validarMes(nuevos.desde)) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.formatoDesde') : "El campo 'Desde' debe tener formato YYYY-MM");
                        if (!validarMes(nuevos.hasta)) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.formatoHasta') : "El campo 'Hasta' debe tener formato YYYY-MM");
                        if (isNaN(parseFloat(nuevos.aportacion_mensual)) && nuevos.aportacion_mensual !== '') {
                            return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.aportacionInvalida') : 'Aportación mensual inválida');
                        }
                        if (isNaN(parseFloat(nuevos.interes)) && nuevos.interes !== '') {
                            return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.interesInvalido') : 'Interés inválido');
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

        if(!fecha) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.seleccionaFecha') : 'Selecciona una fecha');
        if(!descripcion) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.ingresaDescripcion') : 'Ingresa una descripción');
        if(isNaN(monto) || monto <= 0) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.montoInvalido') : 'Monto inválido');
        if(!categoria_id) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.seleccionaCategoria') : 'Selecciona una categoría');

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

            if(!desde) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.ingresaDesde') : "Ingresa el mes 'desde' en formato YYYY-MM");
            if(!hasta) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.ingresaHasta') : "Ingresa el mes 'hasta' en formato YYYY-MM");
            if(isNaN(monto) || monto <= 0) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.montoInicialInvalido') : 'Monto inicial inválido');
            if(!categoria_id) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.seleccionaCategoria') : 'Selecciona una categoría');
            if(!validarMes(desde)) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.formatoDesde') : "El campo 'Desde' debe tener formato YYYY-MM");
            if(!validarMes(hasta)) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.formatoHasta') : "El campo 'Hasta' debe tener formato YYYY-MM");
            if (desde > hasta) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.desdeNoMayorHasta') : "El mes 'desde' no puede ser mayor que 'hasta'");

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

        if(!desde) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.ingresaDesde') : "Ingresa el mes 'desde' en formato YYYY-MM");
        if(!hasta) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.ingresaHasta') : "Ingresa el mes 'hasta' en formato YYYY-MM");
        if(!descripcion) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.ingresaDescripcion') : "Ingresa una descripción");
        if(isNaN(monto) || monto <= 0) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.montoInvalido') : "Monto inválido");
        if(!categoria_id) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.seleccionaCategoria') : "Selecciona una categoría");

        if(!validarMes(desde)) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.formatoDesde') : "El campo 'Desde' debe tener formato YYYY-MM");
        if(!validarMes(hasta)) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.formatoHasta') : "El campo 'Hasta' debe tener formato YYYY-MM");

        if (desde > hasta)
            return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.desdeNoMayorHasta') : "El mes 'desde' no puede ser mayor que 'hasta'");

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

    // ================== FUNCIONES PARA ASSETS ==================

    async function cargarAssets() {
        if (!tbodyAssets) return;
        
        try {
            const res = await fetch('/assets');
            const assets = await res.json();
            
            tbodyAssets.innerHTML = '';
            
            for (const asset of assets) {
                const totalInvestment = asset.shares * asset.purchase_price;
                
                // Obtener precio actual desde Yahoo Finance
                let currentPrice = 0;
                let currentValue = 0;
                let diffPercent = 0;
                let diffAmount = 0;
                let priceText = '<span style="color:#999;">Cargando...</span>';
                
                const tr = document.createElement('tr');
                    const tituloEditar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('formularios.editar') : 'Editar';
                    const tituloEliminar = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('formularios.eliminar') : 'Eliminar';
                    const tituloVender = typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.sellAsset') : 'Vender';
                tr.dataset.id = asset.id;
                tr.dataset.type = 'asset';
                tr.innerHTML = `
                    <td class="editable" data-field="company">${asset.company}</td>
                    <td class="editable" data-field="ticker">${asset.ticker}</td>
                    <td class="editable" data-field="shares">${asset.shares}</td>
                    <td class="editable" data-field="purchase_price"><strong>${formatearEuro(asset.purchase_price)}</strong></td>
                    <td><strong>${formatearEuro(totalInvestment)}</strong></td>
                    <td class="current-price">${priceText}</td>
                    <td class="current-value">—</td>
                    <td class="diff-percent">—</td>
                    <td class="diff-amount">—</td>
                    <td>
                            <button class="editBtn btn-editar" title="${tituloEditar}" style="margin-right:8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                            <button data-id="${asset.id}" class="sellAsset btn-success" title="${tituloVender}" style="margin-right:8px;">
                            <i class="fas fa-hand-holding-usd"></i>
                        </button>
                            <button data-id="${asset.id}" class="delAsset btn-eliminar" title="${tituloEliminar}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbodyAssets.appendChild(tr);
                
                // Obtener precio actual de forma asíncrona
                try {
                    const priceRes = await fetch(`/asset-price/${asset.ticker}`);
                    if (priceRes.ok) {
                        const priceData = await priceRes.json();
                        currentPrice = priceData.currentPrice;
                        currentValue = asset.shares * currentPrice;
                        diffAmount = currentValue - totalInvestment;
                        diffPercent = totalInvestment > 0 ? (diffAmount / totalInvestment) * 100 : 0;
                        
                        const colorDiff = diffAmount >= 0 ? '#22c55e' : '#ef4444';
                        const signDiff = diffAmount >= 0 ? '+' : '';
                        
                        tr.querySelector('.current-price').innerHTML = `<strong>${formatCurrency(currentPrice, { convert: true })}</strong>`;
                        tr.querySelector('.current-value').innerHTML = `<strong style="color:${colorDiff}">${formatCurrency(currentValue, { convert: true })}</strong>`;
                        tr.querySelector('.diff-percent').innerHTML = `<strong style="color:${colorDiff}">${signDiff}${diffPercent.toFixed(2)}%</strong>`;
                        tr.querySelector('.diff-amount').innerHTML = `<strong style="color:${colorDiff}">${signDiff}${formatCurrency(Math.abs(diffAmount), { convert: true })}</strong>`;
                    } else {
                        tr.querySelector('.current-price').innerHTML = '<span style="color:#ef4444;">Error</span>';
                    }
                } catch (e) {
                    console.error(`Error obteniendo precio para ${asset.ticker}:`, e);
                    tr.querySelector('.current-price').innerHTML = '<span style="color:#ef4444;">Error</span>';
                }
            }
            
            // Botones eliminar
            document.querySelectorAll('.delAsset').forEach(b => {
                b.onclick = async () => {
                    if (!confirm(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.eliminarAsset') : '¿Eliminar este asset?')) return;
                    await fetch('/delete/asset', {
                        method: 'POST',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({id: b.dataset.id})
                    });
                    cargarAssets();
                };
            });
            
            // Botones vender
            document.querySelectorAll('.sellAsset').forEach(b => {
                b.onclick = async () => {
                    const assetId = b.dataset.id;
                    const row = b.closest('tr');
                    const asset = assets.find(a => a.id == assetId);
                    if (!asset) return;
                    
                    // Obtener precio actual
                    let currentPrice = 0;
                    try {
                        const priceRes = await fetch(`/asset-price/${asset.ticker}`);
                        const priceData = await priceRes.json();
                        currentPrice = priceData.currentPrice || asset.purchase_price;
                    } catch (e) {
                        currentPrice = asset.purchase_price;
                    }
                    
                    // Mostrar modal de venta
                    openSellModal(asset, currentPrice);
                };
            });
            
            // Editar assets
            document.querySelectorAll('#tablaAssets .editBtn').forEach(btn => {
                btn.onclick = (e) => {
                    const tr = btn.closest('tr');
                    const id = tr.dataset.id;
                    
                    const celdas = tr.querySelectorAll('td.editable');
                    const datos = {};
                    const originales = {};
                    
                    celdas.forEach(celda => {
                        const field = celda.dataset.field;
                        const valor = celda.textContent.trim();
                        datos[field] = valor;
                        originales[field] = valor;
                    });
                    
                    celdas.forEach(celda => {
                        const field = celda.dataset.field;
                        const valor = datos[field];
                        
                        if (field === 'purchase_price') {
                            const input = document.createElement('input');
                            input.type = 'number';
                            input.step = '0.01';
                            input.value = parseAmount(valor);
                            input.style.width = '100px';
                            celda.innerHTML = '€ ';
                            celda.appendChild(input);
                        } else if (field === 'shares') {
                            const input = document.createElement('input');
                            input.type = 'number';
                            input.step = '0.01';
                            input.value = parseFloat(valor) || '';
                            input.style.width = '80px';
                            celda.innerHTML = '';
                            celda.appendChild(input);
                        } else {
                            const input = document.createElement('input');
                            input.type = 'text';
                            input.value = valor;
                            input.style.width = field === 'company' ? '200px' : '100px';
                            celda.innerHTML = '';
                            celda.appendChild(input);
                        }
                    });
                    
                    const tdAcciones = tr.querySelector('td:last-child');
                    tdAcciones.innerHTML = `
                        <button class="saveBtn" style="background:#4CAF50;color:white;padding:5px 10px;border:none;cursor:pointer;border-radius:3px;margin-right:5px;">
                            <i class="fas fa-save"></i>
                        </button>
                        <button class="cancelBtn" style="background:#f44336;color:white;padding:5px 10px;border:none;cursor:pointer;border-radius:3px;">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
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
                            alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.noHayCambios') : 'No hay cambios');
                            cargarAssets();
                            return;
                        }
                        
                        if (!nuevos.company) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.companyRequerido') : 'Company requerido');
                        if (!nuevos.ticker) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.tickerRequerido') : 'Ticker requerido');
                        if (isNaN(parseFloat(nuevos.shares)) || parseFloat(nuevos.shares) <= 0) {
                            return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.numeroAccionesInvalido') : 'Número de acciones inválido');
                        }
                        if (isNaN(parseFloat(nuevos.purchase_price)) || parseFloat(nuevos.purchase_price) <= 0) {
                            return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.precioCompraInvalidoAlt') : 'Precio de compra inválido');
                        }
                        
                        await fetch('/update/asset', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: id,
                                company: nuevos.company,
                                ticker: nuevos.ticker,
                                shares: parseFloat(nuevos.shares),
                                purchase_price: parseFloat(nuevos.purchase_price)
                            })
                        });
                        
                        cargarAssets();
                    };
                    
                    tdAcciones.querySelector('.cancelBtn').onclick = () => {
                        cargarAssets();
                    };
                };
            });
            
        } catch (e) {
            console.error('Error cargando assets:', e);
        }
    }

    // Función para abrir modal de venta
    function openSellModal(asset, currentPrice) {
        const modal = document.getElementById('sellAssetModal');
        const sellPriceInput = document.getElementById('sellPrice');
        
        // Llenar datos del asset
        document.getElementById('sellCompany').textContent = asset.company;
        document.getElementById('sellTicker').textContent = asset.ticker;
        document.getElementById('sellShares').textContent = asset.shares;
        document.getElementById('sellPurchasePrice').textContent = formatearEuro(asset.purchase_price);
        document.getElementById('sellCurrentPrice').textContent = formatearEuro(currentPrice);
        
        // Establecer precio de venta sugerido (precio actual)
        sellPriceInput.value = currentPrice.toFixed(2);
        
        // Calcular valores iniciales
        updateSellCalculations(asset, currentPrice);
        
        // Actualizar cálculos cuando cambia el precio
        sellPriceInput.oninput = () => {
            const salePrice = parseFloat(sellPriceInput.value) || 0;
            updateSellCalculations(asset, salePrice);
        };
        
        // Mostrar modal
        modal.style.display = 'flex';
        
        // Botón cancelar
        document.getElementById('cancelSellBtn').onclick = () => {
            modal.style.display = 'none';
        };
        
        // Botón confirmar
        document.getElementById('confirmSellBtn').onclick = async () => {
            const salePrice = parseFloat(sellPriceInput.value);
            if (isNaN(salePrice) || salePrice <= 0) {
                alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.precioVentaInvalido') : 'Por favor ingresa un precio de venta válido');
                return;
            }
            
            // Confirmar venta
            const confirmarVenta = typeof gestorIdiomas !== 'undefined'
                ? gestorIdiomas.obtenerTexto('ingresos.confirmarVenta')
                    .replace('{shares}', asset.shares)
                    .replace('{company}', asset.company)
                    .replace('{price}', formatearEuro(salePrice))
                : `¿Confirmar venta de ${asset.shares} acciones de ${asset.company} a ${formatearEuro(salePrice)} por acción?`;
            if (!confirm(confirmarVenta)) {
                return;
            }
            
            // Enviar al backend
            try {
                const res = await fetch('/sell/asset', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        id: asset.id,
                        sale_price: salePrice
                    })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    const mensaje = typeof gestorIdiomas !== 'undefined' 
                        ? gestorIdiomas.obtenerTexto('ingresos.ventaExitosa').replace('{profit}', formatearEuro(data.profit))
                        : `Venta exitosa. Ganancia registrada: ${formatearEuro(data.profit)}`;
                    alert(mensaje);
                    modal.style.display = 'none';
                    cargarAssets();
                    if (typeof cargarIngresos === 'function') cargarIngresos();
                } else {
                    const error = await res.json();
                    const mensajeError = typeof gestorIdiomas !== 'undefined'
                        ? gestorIdiomas.obtenerTexto('ingresos.errorVenta').replace('{error}', error.error || 'No se pudo procesar la venta')
                        : `Error: ${error.error || 'No se pudo procesar la venta'}`;
                    alert(mensajeError);
                }
            } catch (e) {
                console.error('Error vendiendo asset:', e);
                alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.errorProcesarVenta') : 'Error al procesar la venta');
            }
        };
    }
    
    function updateSellCalculations(asset, salePrice) {
        const totalInvested = asset.shares * asset.purchase_price;
        const totalValue = asset.shares * salePrice;
        const profit = totalValue - totalInvested;
        
        document.getElementById('sellTotalInvested').textContent = formatearEuro(totalInvested);
        document.getElementById('sellTotalValue').textContent = formatearEuro(totalValue);
        
        const profitSpan = document.getElementById('sellProfit');
        profitSpan.textContent = formatearEuro(profit);
        profitSpan.style.color = profit >= 0 ? '#28a745' : '#dc3545';
    }

    // Agregar asset
    const btnAgregarAsset = document.getElementById('btnAgregarAsset');
    if (btnAgregarAsset) {
        btnAgregarAsset.onclick = async () => {
            const company = document.getElementById('companyAsset').value;
            const ticker = document.getElementById('tickerAsset').value;
            const shares = parseFloat(document.getElementById('sharesAsset').value);
            const purchase_price = parseFloat(document.getElementById('purchasePriceAsset').value);
            // Categoría interna fija; el backend asignará automáticamente

            if(!company) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.ingresaNombreCompania') : "Ingresa el nombre de la compañía");
            if(!ticker) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.ingresaTicker') : "Ingresa el ticker");
            if(isNaN(shares) || shares <= 0) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.accionesInvalidas') : "Número de acciones inválido");
            if(isNaN(purchase_price) || purchase_price <= 0) return alert(typeof gestorIdiomas !== 'undefined' ? gestorIdiomas.obtenerTexto('ingresos.precioCompraInvalido') : "Precio de compra inválido");
            // No se requiere categoría seleccionable para Assets

            await fetch('/add/asset', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({company, ticker, shares, purchase_price})
            });

            // Limpiar inputs
            document.getElementById('companyAsset').value = '';
            document.getElementById('tickerAsset').value = '';
            document.getElementById('sharesAsset').value = '';
            document.getElementById('purchasePriceAsset').value = '';
            cargarAssets();
        };
    }

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