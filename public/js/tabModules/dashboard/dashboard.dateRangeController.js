(function initDashboardDateRangeController(global) {
    if (global.DashboardDateRangeController) return;

    function actualizarEtiquetasSlider(desde, hasta) {
        const desdeEl = document.getElementById('sliderDesdeLabel');
        const hastaEl = document.getElementById('sliderHastaLabel');
        if (desdeEl) desdeEl.textContent = desde;
        if (hastaEl) hastaEl.textContent = hasta;
    }

    function actualizarQuickPeriodActivos(parsearFechaInput, dashDesde, dashHasta) {
        const desdeDate = parsearFechaInput(dashDesde?.value);
        const hastaDate = parsearFechaInput(dashHasta?.value);
        if (!desdeDate || !hastaDate) return;

        const diffMs = hastaDate.getTime() - desdeDate.getTime();
        const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

        document.querySelectorAll('.quick-period-btn').forEach(b => b.classList.remove('active'));
        if (diffDays < 0) return;

        const matched = document.querySelector(`.quick-period-btn[data-days="${diffDays}"]`);
        if (matched) {
            matched.classList.add('active');
            return;
        }

        const fallback = Array.from(document.querySelectorAll('.quick-period-btn'))
            .find(b => Math.abs(parseInt(b.getAttribute('data-days'), 10) - diffDays) <= 1);
        if (fallback) fallback.classList.add('active');
    }

    function syncSliderWithInputs(params) {
        const {
            dateRangeSlider,
            dashDesde,
            dashHasta,
            parsearFechaInput,
            setSliderUpdateFromInputs,
            formatearFechaDisplay
        } = params || {};

        if (!dateRangeSlider || !dashDesde || !dashHasta) return;
        const desdeDate = parsearFechaInput(dashDesde.value);
        const hastaDate = parsearFechaInput(dashHasta.value);
        if (!desdeDate || !hastaDate) return;

        setSliderUpdateFromInputs(true);
        dateRangeSlider.set([desdeDate.getTime(), hastaDate.getTime()]);
        setSliderUpdateFromInputs(false);
        actualizarEtiquetasSlider(formatearFechaDisplay(desdeDate), formatearFechaDisplay(hastaDate));
    }

    async function obtenerRangoFechasDashboard(endpoints) {
        try {
            if (global.electronAPI?.getDashboardRangoFechas) {
                return await global.electronAPI.getDashboardRangoFechas();
            }
            const res = await fetch(endpoints.rangoFechas);
            if (!res.ok) return null;
            const data = await res.json();
            if (!data || !data.min || !data.max) return null;
            return { min: data.min, max: data.max };
        } catch (error) {
            console.warn('⚠️ Error obteniendo rango de fechas:', error);
            return null;
        }
    }

    async function initDateRangeSlider(params) {
        const {
            dashDesde,
            dashHasta,
            hoy,
            parsearFechaInput,
            formatearFechaInput,
            formatearFechaDisplay,
            clampFecha,
            cargarRangoSeleccionado,
            actualizarFechas,
            endpoints,
            isSliderUpdateFromInputs,
            setSliderUpdateFromInputs,
            setDateRangeSlider
        } = params || {};

        const sliderEl = document.getElementById('dashboardDateRangeSlider');
        if (!sliderEl || typeof noUiSlider === 'undefined') return;

        const rango = await obtenerRangoFechasDashboard(endpoints);
        let minDate = parsearFechaInput(rango?.min);
        let maxDate = parsearFechaInput(rango?.max);

        if (!minDate || !maxDate) {
            const desdeInput = parsearFechaInput(dashDesde?.value);
            const hastaInput = parsearFechaInput(dashHasta?.value);
            minDate = minDate || desdeInput || new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
            maxDate = maxDate || hastaInput || new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        }

        if (minDate > maxDate) {
            const temp = minDate;
            minDate = maxDate;
            maxDate = temp;
        }

        const rangoGuardado = cargarRangoSeleccionado();
        if (!rangoGuardado && dashDesde && dashHasta) {
            dashDesde.value = formatearFechaInput(minDate);
            dashHasta.value = formatearFechaInput(maxDate);
        }

        const desdeInicial = parsearFechaInput(dashDesde?.value) || minDate;
        const hastaInicial = parsearFechaInput(dashHasta?.value) || maxDate;
        const desdeClamped = clampFecha(desdeInicial, minDate, maxDate);
        const hastaClamped = clampFecha(hastaInicial, minDate, maxDate);

        if (sliderEl.noUiSlider) {
            sliderEl.noUiSlider.destroy();
        }

        noUiSlider.create(sliderEl, {
            start: [desdeClamped.getTime(), hastaClamped.getTime()],
            connect: true,
            step: 24 * 60 * 60 * 1000,
            range: {
                min: minDate.getTime(),
                max: maxDate.getTime()
            }
        });

        const localSlider = sliderEl.noUiSlider;
        setDateRangeSlider(localSlider);

        if (dashDesde) dashDesde.value = formatearFechaInput(desdeClamped);
        if (dashHasta) dashHasta.value = formatearFechaInput(hastaClamped);
        actualizarEtiquetasSlider(formatearFechaDisplay(desdeClamped), formatearFechaDisplay(hastaClamped));

        localSlider.on('update', (values) => {
            const desde = formatearFechaDisplay(new Date(Number(values[0])));
            const hasta = formatearFechaDisplay(new Date(Number(values[1])));
            actualizarEtiquetasSlider(desde, hasta);
        });

        localSlider.on('set', (values) => {
            if (isSliderUpdateFromInputs()) return;
            const desde = formatearFechaInput(new Date(Number(values[0])));
            const hasta = formatearFechaInput(new Date(Number(values[1])));

            if (dashDesde) dashDesde.value = desde;
            if (dashHasta) dashHasta.value = hasta;

            document.querySelectorAll('.quick-period-btn').forEach(b => b.classList.remove('active'));
            actualizarFechas();
        });
    }

    global.DashboardDateRangeController = {
        actualizarEtiquetasSlider,
        actualizarQuickPeriodActivos,
        syncSliderWithInputs,
        obtenerRangoFechasDashboard,
        initDateRangeSlider
    };
}(window));
