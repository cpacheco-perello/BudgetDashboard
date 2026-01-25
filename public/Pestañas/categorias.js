function initCategorias() {
    // Inputs y botones de cada subtab
    const inputGasto = document.getElementById('nuevoNombreCategoriaGasto');
    const btnAgregarGasto = document.getElementById('btnAgregarCategoriaGasto');
    const tbodyGasto = document.querySelector('#tablaCategoriasGasto tbody');

    const inputIngreso = document.getElementById('nuevoNombreCategoriaIngreso');
    const btnAgregarIngreso = document.getElementById('btnAgregarCategoriaIngreso');
    const tbodyIngreso = document.querySelector('#tablaCategoriasIngreso tbody');

    // ===== Cargar categorías y distribuir por subtab =====
    async function cargarCategorias() {
        const res = await fetch('/categorias');
        const data = await res.json();

        tbodyGasto.innerHTML = '';
        tbodyIngreso.innerHTML = '';

        data.gastos.forEach(cat => {
            crearFilaCategoria(cat, 'gasto', tbodyGasto);
        });

        data.ingresos.forEach(cat => {
            crearFilaCategoria(cat, 'ingreso', tbodyIngreso);
        });

        agregarEventosEdicion();
    }

    // ===== Crear fila de categoría con botones =====
    function crearFilaCategoria(cat, tipo, tbody) {
        const tr = document.createElement('tr');
        tr.dataset.id = cat.id;
        tr.dataset.tipo = tipo;
        tr.innerHTML = `
            <td class="nombre-categoria">${cat.nombre}</td>
            <td class="acciones-categoria">
                <button class="btn-editar" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-eliminar" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    // ===== Agregar eventos de edición =====
    function agregarEventosEdicion() {
        // Botones editar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const tr = btn.closest('tr');
                const tdNombre = tr.querySelector('.nombre-categoria');
                const nombreActual = tdNombre.textContent;
                const id = tr.dataset.id;
                const tipo = tr.dataset.tipo;

                // Crear input editable
                const input = document.createElement('input');
                input.type = 'text';
                input.value = nombreActual;
                input.className = 'input-editar-categoria';

                tdNombre.innerHTML = '';
                tdNombre.appendChild(input);
                input.focus();
                input.select();

                // Función para guardar
                const guardar = async () => {
                    const nuevoNombre = input.value.trim();
                    if (!nuevoNombre) {
                        cargarCategorias();
                        return;
                    }
                    if (nuevoNombre === nombreActual) {
                        tdNombre.textContent = nombreActual;
                        return;
                    }

                    const res = await fetch('/update/categoria', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, nombre: nuevoNombre })
                    });

                    if (res.ok) {
                        tdNombre.textContent = nuevoNombre;
                    } else {
                        alert('Error al actualizar la categoría');
                        tdNombre.textContent = nombreActual;
                    }
                };

                // Guardar al presionar Enter
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        guardar();
                    }
                    if (e.key === 'Escape') {
                        tdNombre.textContent = nombreActual;
                    }
                });

                // Guardar al perder el foco
                input.addEventListener('blur', guardar);
            });
        });

        // Botones eliminar
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const tr = btn.closest('tr');
                const nombre = tr.querySelector('.nombre-categoria').textContent;
                
                if (!confirm(`¿Eliminar categoría "${nombre}"?`)) {
                    return;
                }

                const id = tr.dataset.id;
                const res = await fetch('/delete/categoria', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                if (res.ok) {
                    tr.style.animation = 'slideOut 0.3s ease forwards';
                    setTimeout(() => cargarCategorias(), 300);
                } else {
                    alert('Error al eliminar la categoría');
                }
            });
        });
    }

    // ===== Agregar categoría Gasto =====
    btnAgregarGasto.addEventListener('click', async () => {
        const nombre = inputGasto.value.trim();
        if (!nombre) {
            inputGasto.focus();
            return;
        }
        
        const res = await fetch('/add/categoria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, tipo: 'gasto' })
        });

        if (res.ok) {
            inputGasto.value = '';
            cargarCategorias();
        } else {
            alert('Error al agregar categoría');
        }
    });

    // ===== Agregar categoría Ingreso =====
    btnAgregarIngreso.addEventListener('click', async () => {
        const nombre = inputIngreso.value.trim();
        if (!nombre) {
            inputIngreso.focus();
            return;
        }
        
        const res = await fetch('/add/categoria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, tipo: 'ingreso' })
        });

        if (res.ok) {
            inputIngreso.value = '';
            cargarCategorias();
        } else {
            alert('Error al agregar categoría');
        }
    });

    // Permitir agregar con Enter
    inputGasto.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnAgregarGasto.click();
    });

    inputIngreso.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnAgregarIngreso.click();
    });

    // ===== Script para subpestañas =====
    const botonesSubtab = document.querySelectorAll('#categorias .subtab-btn');
    const subtabs = document.querySelectorAll('#categorias .subtab');

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

    // ===== Inicializar =====
    cargarCategorias();
}