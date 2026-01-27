// Hucha Real - JS
function cargarHucha() {
    const tbody = document.querySelector('#tablaHucha tbody');

    // Formatear cantidad como euro
    function formatearEuro(monto) {
        if (typeof window.formatCurrency === 'function') return window.formatCurrency(monto, { convert: false });
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(monto);
    }

    async function cargarDatos() {
        const res = await fetch('/hucha');
        const data = await res.json();
        tbody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.dataset.id = item.id;
            tr.innerHTML = `
                <td class="editable" data-field="concepto">${item.concepto}</td>
                <td class="editable" data-field="cantidad"><strong>${formatearEuro(item.cantidad)}</strong></td>
                <td>
                    <button class="editBtn btn-editar" title="Editar" style="margin-right:8px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button data-id="${item.id}" class="delHucha btn-eliminar" title="Eliminar" style="display:inline-block;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Eliminar
        document.querySelectorAll('.delHucha').forEach(b => {
            b.onclick = async () => {
                await fetch('/delete/hucha', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: b.dataset.id })
                });
                cargarDatos();
            };
        });

        // Editar (solo concepto y cantidad)
        document.querySelectorAll('.editBtn').forEach(btn => {
            btn.onclick = () => {
                const tr = btn.closest('tr');
                const id = tr.dataset.id;
                const conceptoTd = tr.querySelector('[data-field="concepto"]');
                const cantidadTd = tr.querySelector('[data-field="cantidad"]');
                const oldConcepto = conceptoTd.textContent;
                const oldCantidad = parseFloat(cantidadTd.textContent.replace(/[^\d.,-]/g, '').replace(',', '.'));

                conceptoTd.innerHTML = `<input type="text" value="${oldConcepto}">`;
                cantidadTd.innerHTML = `<input type="number" step="0.01" value="${oldCantidad}">`;
                btn.innerHTML = '<i class="fas fa-save"></i>';
                btn.title = 'Guardar';
                btn.onclick = async () => {
                    const newConcepto = conceptoTd.querySelector('input').value;
                    const newCantidad = parseFloat(cantidadTd.querySelector('input').value);
                    await fetch('/update/hucha', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, concepto: newConcepto, cantidad: newCantidad })
                    });
                    cargarDatos();
                };
            };
        });
    }

    // Agregar
    document.getElementById('btnAgregarHucha').onclick = async () => {
        const concepto = document.getElementById('conceptoHucha').value;
        const cantidad = parseFloat(document.getElementById('cantidadHucha').value);
        if (!concepto) return;
        if (isNaN(cantidad) || cantidad <= 0) return;
        await fetch('/add/hucha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ concepto, cantidad })
        });
        document.getElementById('conceptoHucha').value = '';
        document.getElementById('cantidadHucha').value = '';
        cargarDatos();
    };

    cargarDatos();
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tablaHucha')) {
        cargarHucha();
    }
});
