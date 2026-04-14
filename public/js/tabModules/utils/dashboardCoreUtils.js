(function initDashboardCoreUtils(global) {
    if (global.DashboardCoreUtils) return;

    function restarFecha(fecha, cantidad, unidad) {
        const tipo = unidad || 'days';
        const resultado = new Date(fecha);
        if (tipo === 'months') {
            resultado.setMonth(resultado.getMonth() - cantidad);
        } else if (tipo === 'years') {
            resultado.setFullYear(resultado.getFullYear() - cantidad);
        } else {
            resultado.setDate(resultado.getDate() - cantidad);
        }
        return resultado;
    }

    function formatearEuro(monto) {
        if (typeof global.formatCurrency === 'function') {
            return global.formatCurrency(monto, { convert: false });
        }
        if (monto === null || monto === undefined) return '€0,00';
        return '€' + parseFloat(monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatearFechaInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatearFechaDisplay(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function parsearFechaInput(valor) {
        if (!valor) return null;
        const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
        const date = soloFecha ? new Date(`${valor}T00:00:00`) : new Date(valor);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function clampFecha(date, minDate, maxDate) {
        const time = Math.min(Math.max(date.getTime(), minDate.getTime()), maxDate.getTime());
        return new Date(time);
    }

    function cargarPreferenciasDashboard(storageKey) {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object') ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function guardarPreferenciasDashboard(storageKey, nextPrefs) {
        try {
            const prev = cargarPreferenciasDashboard(storageKey);
            localStorage.setItem(storageKey, JSON.stringify({ ...prev, ...(nextPrefs || {}) }));
        } catch (_) {
            // Ignore storage errors.
        }
    }

    function guardarRangoSeleccionado(storageKey, desde, hasta) {
        try {
            localStorage.setItem(storageKey, JSON.stringify({ desde, hasta }));
        } catch (error) {
            console.warn('⚠️ No se pudo guardar el rango:', error);
        }
    }

    function cargarRangoSeleccionado(storageKey) {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.desde || !parsed.hasta) return null;
            return parsed;
        } catch (_) {
            return null;
        }
    }

    function obtenerRangoComparativo(desde, hasta) {
        const desdeDate = parsearFechaInput(desde);
        const hastaDate = parsearFechaInput(hasta);
        if (!desdeDate || !hastaDate || hastaDate < desdeDate) return null;

        const msRange = hastaDate.getTime() - desdeDate.getTime();
        const prevHasta = new Date(desdeDate.getTime() - 24 * 60 * 60 * 1000);
        const prevDesde = new Date(prevHasta.getTime() - msRange);

        return {
            desde: formatearFechaInput(prevDesde),
            hasta: formatearFechaInput(prevHasta)
        };
    }

    function crearResumenPeriodo(dataTotales) {
        const data = Array.isArray(dataTotales) ? dataTotales : [];
        if (data.length === 0) {
            return {
                ingresosBrutos: 0,
                gastosConImpuestos: 0,
                ahorros: 0,
                ingresoNeto: 0,
                ratioAhorro: 0
            };
        }

        const ingresosBrutos = data.reduce((sum, m) => sum + (Number(m.total_ingreso) || ((Number(m.ingresos) || 0) + (Number(m.impuestos_ingresos) || 0) + (Number(m.cuentas_remuneradas) || 0))), 0);
        const impuestoRenta = data.reduce((sum, m) => sum + (Number(m.impuesto_renta) || (Number(m.impuestos_ingresos) || 0)), 0);
        const impuestoOtros = data.reduce((sum, m) => sum + (Number(m.impuesto_otros) || (Number(m.impuestos_otros) || 0)), 0);
        const gastos = data.reduce((sum, m) => sum + (Number(m.total_gastos) || (Number(m.gastos) || 0)), 0);
        const ahorros = data.reduce((sum, m) => sum + (Number(m.ahorros) || 0), 0);

        const gastosConImpuestos = gastos + impuestoOtros;
        const ingresoNeto = ingresosBrutos - impuestoRenta;
        const ratioAhorro = ingresosBrutos > 0 ? (ahorros / ingresosBrutos) * 100 : 0;

        return {
            ingresosBrutos,
            gastosConImpuestos,
            ahorros,
            ingresoNeto,
            ratioAhorro
        };
    }

    global.DashboardCoreUtils = {
        restarFecha,
        formatearEuro,
        formatearFechaInput,
        formatearFechaDisplay,
        parsearFechaInput,
        clampFecha,
        cargarPreferenciasDashboard,
        guardarPreferenciasDashboard,
        guardarRangoSeleccionado,
        cargarRangoSeleccionado,
        obtenerRangoComparativo,
        crearResumenPeriodo
    };
}(window));
