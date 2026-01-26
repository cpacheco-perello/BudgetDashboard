// ============== IMPUESTOS PUNTUALES ==============

function cargarImpuestosPuntuales() {
    fetch('/impuestos-puntuales')
        .then(r => r.json())
        .then(data => {
            const tbody = document.querySelector('#tabla-impuestos-puntuales tbody');
            tbody.innerHTML = '';
            
            data.forEach(imp => {
                const tr = document.createElement('tr');
                tr.dataset.id = imp.id;
                tr.dataset.type = 'puntual';
                tr.innerHTML = `
                    <td class="editable" data-field="fecha">${imp.fecha}</td>
                    <td class="editable" data-field="descripcion">${imp.descripcion}</td>
                    <td class="editable" data-field="monto"><strong>${formatearEuro(imp.monto)}</strong></td>
                    <td class="editable" data-field="categoria">${imp.categoria}</td>
                    <td>
                        <button class="editBtn btn-editar" title="Editar" style="margin-right:8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-id="${imp.id}" class="delP btn-eliminar" title="Eliminar" style="display:inline-block;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Eliminar Puntuales
            document.querySelectorAll('.delP').forEach(b => {
                b.onclick = async () => {
                    if (!confirm(gestorIdiomas.obtenerTexto('confirmaciones.eliminar'))) return;
                    await fetch('/delete/impuesto_puntual', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: b.dataset.id })
                    });
                    cargarImpuestosPuntuales();
                    cargarResumenPeriodos();
                };
            });

            // Editar filas
            document.querySelectorAll('#tabla-impuestos-puntuales .editBtn').forEach(btn => {
                btn.onclick = (e) => {
                    const tr = btn.closest('tr');
                    const id = tr.dataset.id;
                    
                    // Obtener datos originales
                    const celdas = tr.querySelectorAll('td.editable');
                    const datos = {};
                    const originales = {};
                    
                    celdas.forEach(celda => {
                        const field = celda.dataset.field;
                        datos[field] = celda.textContent.trim();
                        originales[field] = celda.textContent.trim();
                    });

                    // Obtener categorías
                    const selectCat = document.getElementById('cat-impuesto-p');
                    const categorias = Array.from(selectCat.options).map(o => ({ id: o.value, nombre: o.textContent }));

                    celdas.forEach(celda => {
                        const field = celda.dataset.field;
                        let input;

                        if (field === 'fecha') {
                            input = document.createElement('input');
                            input.type = 'date';
                            input.value = datos[field];
                        } else if (field === 'categoria') {
                            input = document.createElement('select');
                            categorias.forEach(cat => {
                                const opt = document.createElement('option');
                                opt.value = cat.id;
                                opt.textContent = cat.nombre;
                                if (cat.nombre === datos[field]) opt.selected = true;
                                input.appendChild(opt);
                            });
                        } else if (field === 'monto') {
                            input = document.createElement('input');
                            input.type = 'number';
                            input.step = '0.01';
                            input.value = parseFloat(datos[field].replace('€', '').replace(',', '.'));
                        } else {
                            input = document.createElement('input');
                            input.type = 'text';
                            input.value = datos[field];
                        }

                        input.style.width = '100%';
                        celda.innerHTML = '';
                        celda.appendChild(input);
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
                        const fecha = tr.querySelector('[data-field="fecha"] input').value;
                        const desc = tr.querySelector('[data-field="descripcion"] input').value;
                        const monto = parseFloat(tr.querySelector('[data-field="monto"] input').value);
                        const categoria = tr.querySelector('[data-field="categoria"] select').selectedOptions[0].text;

                        const res = await fetch('/update/impuesto_puntual', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, fecha, descripcion: desc, monto, categoria })
                        });

                        if (res.ok) {
                            cargarImpuestosPuntuales();
                            cargarResumenPeriodos();
                        }
                    };

                    // Cancelar
                    tdAcciones.querySelector('.cancelBtn').onclick = () => {
                        cargarImpuestosPuntuales();
                    };
                };
            });
        });
}

// ============== IMPUESTOS MENSUALES ==============

function cargarImpuestosMensuales() {
    fetch('/impuestos-mensuales')
        .then(r => r.json())
        .then(data => {
            const tbody = document.querySelector('#tabla-impuestos-mensuales tbody');
            tbody.innerHTML = '';
            
            data.forEach(imp => {
                const tr = document.createElement('tr');
                tr.dataset.id = imp.id;
                tr.dataset.type = 'mensual';
                tr.innerHTML = `
                    <td class="editable" data-field="descripcion">${imp.descripcion}</td>
                    <td class="editable" data-field="monto"><strong>${formatearEuro(imp.monto)}</strong></td>
                    <td class="editable" data-field="categoria">${imp.categoria}</td>
                    <td class="editable" data-field="desde">${imp.desde}</td>
                    <td class="editable" data-field="hasta">${imp.hasta}</td>
                    <td>
                        <button class="editBtn btn-editar" title="Editar" style="margin-right:8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-id="${imp.id}" class="delM btn-eliminar" title="Eliminar" style="display:inline-block;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Eliminar Mensuales
            document.querySelectorAll('.delM').forEach(b => {
                b.onclick = async () => {
                    if (!confirm(gestorIdiomas.obtenerTexto('confirmaciones.eliminar'))) return;
                    await fetch('/delete/impuesto_mensual', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: b.dataset.id })
                    });
                    cargarImpuestosMensuales();
                    cargarResumenPeriodos();
                };
            });

            // Editar filas
            document.querySelectorAll('#tabla-impuestos-mensuales .editBtn').forEach(btn => {
                btn.onclick = (e) => {
                    const tr = btn.closest('tr');
                    const id = tr.dataset.id;
                    
                    // Obtener datos originales
                    const celdas = tr.querySelectorAll('td.editable');
                    const datos = {};
                    const originales = {};
                    
                    celdas.forEach(celda => {
                        const field = celda.dataset.field;
                        datos[field] = celda.textContent.trim();
                        originales[field] = celda.textContent.trim();
                    });

                    // Obtener categorías
                    const selectCat = document.getElementById('cat-impuesto-m');
                    const categorias = Array.from(selectCat.options).map(o => ({ id: o.value, nombre: o.textContent }));

                    celdas.forEach(celda => {
                        const field = celda.dataset.field;
                        let input;

                        if (field === 'desde' || field === 'hasta') {
                            input = document.createElement('input');
                            input.type = 'date';
                            input.value = datos[field];
                        } else if (field === 'categoria') {
                            input = document.createElement('select');
                            categorias.forEach(cat => {
                                const opt = document.createElement('option');
                                opt.value = cat.id;
                                opt.textContent = cat.nombre;
                                if (cat.nombre === datos[field]) opt.selected = true;
                                input.appendChild(opt);
                            });
                        } else if (field === 'monto') {
                            input = document.createElement('input');
                            input.type = 'number';
                            input.step = '0.01';
                            input.value = parseFloat(datos[field].replace('€', '').replace(',', '.'));
                        } else {
                            input = document.createElement('input');
                            input.type = 'text';
                            input.value = datos[field];
                        }

                        input.style.width = '100%';
                        celda.innerHTML = '';
                        celda.appendChild(input);
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
                        const desc = tr.querySelector('[data-field="descripcion"] input').value;
                        const monto = parseFloat(tr.querySelector('[data-field="monto"] input').value);
                        const categoria = tr.querySelector('[data-field="categoria"] select').selectedOptions[0].text;
                        const desde = tr.querySelector('[data-field="desde"] input').value;
                        const hasta = tr.querySelector('[data-field="hasta"] input').value;

                        const res = await fetch('/update/impuesto_mensual', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, descripcion: desc, monto, categoria, desde, hasta })
                        });

                        if (res.ok) {
                            cargarImpuestosMensuales();
                            cargarResumenPeriodos();
                        }
                    };

                    // Cancelar
                    tdAcciones.querySelector('.cancelBtn').onclick = () => {
                        cargarImpuestosMensuales();
                    };
                };
            });
        });
}

// ============== INICIALIZAR ==============

let impuestosInicializado = false;

async function inicializarTaxes() {

        const res = await fetch('/categorias');
        const data = await res.json();
        const categorias = data.impuestos || [];
        
        // Rellenar selects
        const selectP = document.getElementById('cat-impuesto-p');
        const selectM = document.getElementById('cat-impuesto-m');
        
        (Array.isArray(categorias) ? categorias : []).forEach(cat => {
            const opt1 = document.createElement('option');
            opt1.value = cat.id;
            opt1.textContent = cat.nombre;
            selectP.appendChild(opt1);
            
            const opt2 = document.createElement('option');
            opt2.value = cat.id;
            opt2.textContent = cat.nombre;
            selectM.appendChild(opt2);
        });
        
        impuestosInicializado = true;
        console.log('✅ Categorías de impuestos cargadas correctamente');

    
    // Cargar datos siempre
    cargarImpuestosPuntuales();
    cargarImpuestosMensuales();

    // ===== EVENT LISTENERS PARA AGREGAR (SIEMPRE) =====
    const btnAgregarP = document.getElementById('btnAgregarImpuestoPuntual');
    const btnAgregarM = document.getElementById('btnAgregarImpuestoMensual');
    
    if (btnAgregarP) {
        btnAgregarP.onclick = async () => {
            const fecha = document.getElementById('fecha-impuesto-p').value;
            const desc = document.getElementById('desc-impuesto-p').value;
            const monto = parseFloat(document.getElementById('monto-impuesto-p').value);
            const categoria_id = parseInt(document.getElementById('cat-impuesto-p').value);
            
            if (!fecha || !desc || isNaN(monto) || !categoria_id) {
                alert('Completa todos los campos');
                return;
            }
            
            const res = await fetch('/add/impuesto_puntual', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({fecha, descripcion: desc, monto, categoria_id})
            });
            
            if(res.ok) {
                document.getElementById('fecha-impuesto-p').value = '';
                document.getElementById('desc-impuesto-p').value = '';
                document.getElementById('monto-impuesto-p').value = '';
                cargarImpuestosPuntuales();
                cargarResumenPeriodos();
            }
        };
    }
    
    if (btnAgregarM) {
        btnAgregarM.onclick = async () => {
            const desc = document.getElementById('desc-impuesto-m').value;
            const monto = parseFloat(document.getElementById('monto-impuesto-m').value);
            const categoria_id = parseInt(document.getElementById('cat-impuesto-m').value);
            const desde = document.getElementById('desde-impuesto-m').value;
            const hasta = document.getElementById('hasta-impuesto-m').value;
            
            if (!desc || isNaN(monto) || !categoria_id || !desde || !hasta) {
                alert('Completa todos los campos');
                return;
            }
            
            const res = await fetch('/add/impuesto_mensual', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({descripcion: desc, monto, categoria_id, desde, hasta})
            });
            
            if(res.ok) {
                document.getElementById('desc-impuesto-m').value = '';
                document.getElementById('monto-impuesto-m').value = '';
                document.getElementById('desde-impuesto-m').value = '';
                document.getElementById('hasta-impuesto-m').value = '';
                cargarImpuestosMensuales();
                cargarResumenPeriodos();
            }
        };
    }

    // ===== TAB NAVIGATION (SIEMPRE REASIGNAR) =====
    // Obtener los botones específicos de impuestos
    const btnsPuntual = document.querySelector('[data-target="tabImpuestosPuntuales"]');
    const btnsMensual = document.querySelector('[data-target="tabImpuestosMensuales"]');
    const tabPuntuales = document.getElementById('tabImpuestosPuntuales');
    const tabMensuales = document.getElementById('tabImpuestosMensuales');
    
    if (btnsPuntual && btnsMensual && tabPuntuales && tabMensuales) {
        // Limpiar listeners previos
        btnsPuntual.onclick = null;
        btnsMensual.onclick = null;
        
        // Asignar nuevos listeners
        btnsPuntual.onclick = () => {
            tabPuntuales.style.display = 'block';
            tabMensuales.style.display = 'none';
            btnsPuntual.classList.add('active');
            btnsMensual.classList.remove('active');
        };

        btnsMensual.onclick = () => {
            tabPuntuales.style.display = 'none';
            tabMensuales.style.display = 'block';
            btnsPuntual.classList.remove('active');
            btnsMensual.classList.add('active');
        };

        // Establecer Puntuales como activo por defecto
        btnsPuntual.classList.add('active');
        btnsMensual.classList.remove('active');
    }
    
    console.log('✅ Impuestos inicializados correctamente');
}

