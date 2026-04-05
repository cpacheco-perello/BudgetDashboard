/**
 * Importación Bancaria - Pestaña para importar movimientos desde Excel
 * Características:
 * - Detección automática de columnas
 * - Mapeo manual de campos (Fecha, Concepto, Importe)
 * - Auto-categorización de movimientos
 * - Análisis con gráficos similar a Dashboard
 */

// Referencia al modal global (si existe) para no sobrescribirlo
const modalAlert = window.showAlert;

// Función auxiliar para mostrar alertas con el sistema de modales
const showAlert = (mensaje, tipo = 'info') => {
    let titulo = 'Información';
    if (tipo === 'error') {
        titulo = 'Error';
    } else if (tipo === 'warning' || tipo === 'warn') {
        titulo = 'Advertencia';
    }
    if (typeof modalAlert === 'function') {
        return modalAlert(mensaje, titulo);
    }
    // Fallback por si el modal no está disponible
    // eslint-disable-next-line no-alert
    alert(mensaje);
};

const showInfoToast = (mensaje) => {
    if (typeof window.notifyInfo === 'function') {
        window.notifyInfo(mensaje);
        return;
    }
    showAlert(mensaje, 'info');
};

const showSuccessToast = (mensaje) => {
    if (typeof window.notifySuccess === 'function') {
        window.notifySuccess(mensaje);
        return;
    }
    showAlert(mensaje, 'success');
};

const showErrorToast = (mensaje) => {
    if (typeof window.notifyError === 'function') {
        window.notifyError(mensaje);
        return;
    }
    showAlert(mensaje, 'error');
};

// Función helper para obtener traducciones dinámicamente
function obtenerTraduccion(clave) {
    try {
        const idioma = window.idiomaActual || 'es';
        // Navegar por la estructura: traducciones[idioma].importacion.clave
        const partes = clave.split('.');
        let valor = window.traducciones?.[idioma] || {};
        
        for (const parte of partes) {
            valor = valor[parte];
            if (!valor) break;
        }
        
        // Si no encuentra la traducción, devuelve la clave como fallback
        return typeof valor === 'string' ? valor : clave;
    } catch (error) {
        console.error('Error obteniendo traducción:', clave, error);
        return clave;
    }
}

// Función para aplicar traducciones con emojis
function t(clave) {
    return obtenerTraduccion(clave);
}

function tt(clave, fallback) {
    const value = t(clave);
    return value && value !== clave ? value : fallback;
}


// Usar variable global window para persistir datos entre cambios de pestaña
if (!window.estadoImportacion) {
    window.estadoImportacion = {
        archivoActual: null,
        nombreArchivoOrigen: null,
        datosRaw: [],
        datosMapados: [],
        datosMapadosValidos: [],
        datosMapadosInvalidos: [],
        datosAnalisisActual: [],
        columnas: [],
        mapeo: { fecha: null, concepto: null, importe: null, tipo: null },
        formatoFecha: 'DD/MM/YYYY',
        charts: {},
        archivoNuevo: true, // Flag para saber si es un archivo nuevo o cargado
        archivoId: null, // ID del archivo si fue cargado desde guardados
        conceptosSeleccionados: [], // Conceptos que el usuario ha seleccionado
        categoriasPorConcepto: {},
        metaConceptosCategorias: {},
        tableFilter: 'gasto',
        seccionActual: 'archivos',
        archivoGuardado: false,
        presetSeleccionado: null
    };
}

let estadoImportacion = window.estadoImportacion;

const IMPORT_PRESETS_KEY = 'importacionBancaria.presets.v1';
    const IMPORT_CONCEPT_REVIEW_KEY = 'importacionBancaria.conceptCategoryReview.v1';
const WIZARD_STEPS = ['archivos', 'upload', 'mapeo', 'seleccionConceptos', 'seleccionCategorias', 'analisis'];

function actualizarWizard(seccionActual) {
    const steps = document.querySelectorAll('#importWizard .wizard-step');
    const idxActual = WIZARD_STEPS.indexOf(seccionActual);
    steps.forEach((stepEl) => {
        const stepKey = stepEl.dataset.step;
        const idx = WIZARD_STEPS.indexOf(stepKey);
        stepEl.classList.toggle('active', stepKey === seccionActual);
        stepEl.classList.toggle('done', idx >= 0 && idx < idxActual);
    });
}

function actualizarProgreso(porcentaje, texto) {
    const fileProgress = document.getElementById('fileProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (!fileProgress || !progressFill || !progressText) return;

    const clamped = Math.max(0, Math.min(100, Number(porcentaje) || 0));
    fileProgress.style.display = 'block';
    progressFill.style.width = `${clamped}%`;
    progressText.textContent = texto ? `${texto} (${clamped.toFixed(0)}%)` : `${clamped.toFixed(0)}%`;
}

function alternarLoadingAnalisis(visible) {
    const loading = document.getElementById('analisisLoading');
    if (!loading) return;
    loading.style.display = visible ? 'block' : 'none';
}

function actualizarKpisAnalisis(datos = []) {
    const kpiIngresos = document.getElementById('kpiImportacionIngresos');
    const kpiGastos = document.getElementById('kpiImportacionGastos');
    const kpiNeto = document.getElementById('kpiImportacionNeto');
    const kpiMovimientos = document.getElementById('kpiImportacionMovimientos');
    if (!kpiIngresos || !kpiGastos || !kpiNeto || !kpiMovimientos) return;

    const totalIngresos = datos
        .filter((d) => d.tipo === 'ingreso')
        .reduce((acc, d) => acc + (Number(d.importe) || 0), 0);

    const totalGastos = datos
        .filter((d) => d.tipo === 'gasto')
        .reduce((acc, d) => acc + (Number(d.importe) || 0), 0);

    const neto = totalIngresos - totalGastos;
    const format = (value) => window.formatCurrency
        ? window.formatCurrency(value)
        : `€${Number(value || 0).toFixed(2)}`;

    kpiIngresos.textContent = format(totalIngresos);
    kpiGastos.textContent = format(totalGastos);
    kpiNeto.textContent = format(neto);
    kpiMovimientos.textContent = String(datos.length);
}

function parseImporte(valor) {
    if (valor == null || valor === '') return NaN;
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : NaN;

    let texto = String(valor).trim();
    if (!texto) return NaN;

    const textoLower = texto.toLowerCase();
    let negativo = false;
    if (texto.includes('(') && texto.includes(')')) negativo = true;
    if (texto.includes('-')) negativo = true;
    if (/\b(debe|cargo|debito|debit|retirada|salida)\b/i.test(textoLower)) negativo = true;
    if (/\b(haber|abono|credito|credit|ingreso|entrada)\b/i.test(textoLower)) negativo = false;

    texto = texto
        .replace(/\s+/g, '')
        .replace(/[€$£]/g, '')
        .replace(/[()]/g, '')
        .replace(/[^\d,.-]/g, '');

    if (!texto) return NaN;

    const lastComma = texto.lastIndexOf(',');
    const lastDot = texto.lastIndexOf('.');

    if (lastComma > -1 && lastDot > -1) {
        if (lastComma > lastDot) {
            texto = texto.replace(/\./g, '').replace(',', '.');
        } else {
            texto = texto.replace(/,/g, '');
        }
    } else if (lastComma > -1) {
        texto = texto.replace(',', '.');
    }

    const numero = Number(texto);
    if (!Number.isFinite(numero)) return NaN;
    return negativo ? -Math.abs(numero) : numero;
}

function inferirTipo(valorTipo, importe) {
    const texto = normalizarTexto(valorTipo);
    if (texto) {
        if (/\b(ingreso|abono|haber|credito|credit|deposito|entrada|in)\b/.test(texto)) {
            return 'ingreso';
        }
        if (/\b(gasto|cargo|debe|debito|debit|retirada|salida|out)\b/.test(texto)) {
            return 'gasto';
        }
    }
    return Number(importe) >= 0 ? 'ingreso' : 'gasto';
}

function actualizarPanelValidacion() {
    const panel = document.getElementById('validacionMapeo');
    const totalEl = document.getElementById('validacionTotal');
    const validasEl = document.getElementById('validacionValidas');
    const invalidasEl = document.getElementById('validacionInvalidas');
    const bodyErrores = document.getElementById('validacionErroresBody');
    if (!panel || !totalEl || !validasEl || !invalidasEl || !bodyErrores) return;

    const total = estadoImportacion.datosRaw.length;
    const validas = estadoImportacion.datosMapadosValidos.length;
    const invalidas = estadoImportacion.datosMapadosInvalidos.length;

    totalEl.textContent = String(total);
    validasEl.textContent = String(validas);
    invalidasEl.textContent = String(invalidas);

    bodyErrores.innerHTML = '';
    if (invalidas === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4">Sin errores de validacion</td>';
        bodyErrores.appendChild(tr);
    } else {
        estadoImportacion.datosMapadosInvalidos.slice(0, 100).forEach((item) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.fila || '-'}</td>
                <td>${item.concepto || '-'}</td>
                <td>${item.importeOriginal ?? '-'}</td>
                <td>${item.errores.join('; ')}</td>
            `;
            bodyErrores.appendChild(tr);
        });
    }

    panel.style.display = 'block';
}

function obtenerPresetsMapeo() {
    try {
        return JSON.parse(localStorage.getItem(IMPORT_PRESETS_KEY) || '[]');
    } catch (_) {
        return [];
    }
}

function guardarPresetsMapeo(presets) {
    localStorage.setItem(IMPORT_PRESETS_KEY, JSON.stringify(Array.isArray(presets) ? presets : []));
}

function cargarRevisionConceptoCategoria() {
    try {
        const data = JSON.parse(localStorage.getItem(IMPORT_CONCEPT_REVIEW_KEY) || '{}');
        return (data && typeof data === 'object') ? data : {};
    } catch (_) {
        return {};
    }
}

function guardarRevisionConceptoCategoria(data) {
    localStorage.setItem(IMPORT_CONCEPT_REVIEW_KEY, JSON.stringify(data && typeof data === 'object' ? data : {}));
}

function persistirRevisionConceptoCategoria(categoriasSeleccionadas = {}) {
    const revision = cargarRevisionConceptoCategoria();

    Object.entries(categoriasSeleccionadas).forEach(([conceptoKey, categoriaId]) => {
        const meta = estadoImportacion.metaConceptosCategorias?.[conceptoKey];
        if (!meta || !meta.tipo || !categoriaId) return;

        if (!revision[meta.tipo]) revision[meta.tipo] = {};
        revision[meta.tipo][conceptoKey] = Number(categoriaId);
    });

    guardarRevisionConceptoCategoria(revision);
}

function obtenerRangoFechasDesdeRaw() {
    const colFecha = document.getElementById('selectFecha')?.value;
    if (!colFecha || !Array.isArray(estadoImportacion.datosRaw) || estadoImportacion.datosRaw.length === 0) {
        return null;
    }

    const formato = document.getElementById('formatoFecha')?.value || estadoImportacion.formatoFecha || 'DD/MM/YYYY';
    const fechas = estadoImportacion.datosRaw
        .map((row) => parseDate(row[colFecha], formato))
        .filter((d) => d instanceof Date && !Number.isNaN(d.getTime()))
        .sort((a, b) => a - b);

    if (!fechas.length) return null;
    return { min: fechas[0], max: fechas[fechas.length - 1], total: fechas.length };
}

function aplicarRangoFechasAnalisis(minDate, maxDate, force = false) {
    if (!(minDate instanceof Date) || Number.isNaN(minDate.getTime())) return;
    if (!(maxDate instanceof Date) || Number.isNaN(maxDate.getTime())) return;

    const desdeInput = document.getElementById('analisisDesde');
    const hastaInput = document.getElementById('analisisHasta');
    if (!desdeInput || !hastaInput) return;

    const minISO = minDate.toISOString().split('T')[0];
    const maxISO = maxDate.toISOString().split('T')[0];
    desdeInput.min = minISO;
    desdeInput.max = maxISO;
    hastaInput.min = minISO;
    hastaInput.max = maxISO;

    const desdeActual = desdeInput.value;
    const hastaActual = hastaInput.value;
    const fueraDesde = !desdeActual || desdeActual < minISO || desdeActual > maxISO;
    const fueraHasta = !hastaActual || hastaActual < minISO || hastaActual > maxISO;

    if (force || fueraDesde) desdeInput.value = minISO;
    if (force || fueraHasta) hastaInput.value = maxISO;
}

function obtenerFingerprintColumnas(columnas = []) {
    return (columnas || []).map((c) => normalizarTexto(c)).sort().join('|');
}

function poblarSelectPresets() {
    const select = document.getElementById('selectPresetMapeo');
    if (!select) return;

    const presets = obtenerPresetsMapeo();
    const fingerprint = obtenerFingerprintColumnas(estadoImportacion.columnas);

    select.innerHTML = '<option value="">-- Sin preset --</option>';
    presets
        .filter((p) => p && p.fingerprint === fingerprint)
        .forEach((preset) => {
            const option = document.createElement('option');
            option.value = preset.id;
            option.textContent = preset.nombre;
            select.appendChild(option);
        });
}

function aplicarPresetMapeo(presetId) {
    const presets = obtenerPresetsMapeo();
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    const map = preset.mapeo || {};
    const setValueIfExists = (id, val) => {
        const el = document.getElementById(id);
        if (!el || val == null) return;
        if (Array.from(el.options).some((opt) => opt.value === val)) {
            el.value = val;
        }
    };

    setValueIfExists('selectFecha', map.fecha);
    setValueIfExists('selectConcepto', map.concepto);
    setValueIfExists('selectImporte', map.importe);
    setValueIfExists('selectTipo', map.tipo);
    setValueIfExists('selectSaldo', map.saldo);

    const formato = document.getElementById('formatoFecha');
    if (formato && preset.formatoFecha) formato.value = preset.formatoFecha;

    estadoImportacion.presetSeleccionado = preset.id;
    mostrarPreview();
}

async function guardarPresetActual() {
    if (!validarMapeo()) {
        showAlert('⚠️ Debes completar un mapeo válido antes de guardar preset', 'warning');
        return;
    }

    const nombre = window.prompt('Nombre del preset de mapeo:', estadoImportacion.presetSeleccionado || 'Preset banco');
    if (!nombre) return;

    const presets = obtenerPresetsMapeo();
    const id = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

    const preset = {
        id,
        nombre: nombre.trim(),
        fingerprint: obtenerFingerprintColumnas(estadoImportacion.columnas),
        mapeo: {
            fecha: document.getElementById('selectFecha')?.value || null,
            concepto: document.getElementById('selectConcepto')?.value || null,
            importe: document.getElementById('selectImporte')?.value || null,
            tipo: document.getElementById('selectTipo')?.value || null,
            saldo: document.getElementById('selectSaldo')?.value || null
        },
        formatoFecha: document.getElementById('formatoFecha')?.value || 'DD/MM/YYYY',
        createdAt: new Date().toISOString()
    };

    presets.push(preset);
    guardarPresetsMapeo(presets);
    poblarSelectPresets();
    const select = document.getElementById('selectPresetMapeo');
    if (select) select.value = id;
    estadoImportacion.presetSeleccionado = id;

    if (typeof window.notifySuccess === 'function') {
        window.notifySuccess('Preset guardado');
    }
}

async function eliminarPresetSeleccionado() {
    const select = document.getElementById('selectPresetMapeo');
    if (!select || !select.value) return;

    const confirmed = typeof window.showConfirm === 'function'
        ? await window.showConfirm('¿Eliminar este preset de mapeo?', 'Confirmar')
        : window.confirm('¿Eliminar este preset de mapeo?');
    if (!confirmed) return;

    const presets = obtenerPresetsMapeo().filter((p) => p.id !== select.value);
    guardarPresetsMapeo(presets);
    estadoImportacion.presetSeleccionado = null;
    poblarSelectPresets();
    if (typeof window.notifyInfo === 'function') {
        window.notifyInfo('Preset eliminado');
    }
}

function cargarImportacionBancaria() {
    console.log('📊 Cargando pestaña de Importación Bancaria');
    console.log('📊 Estado guardado:', {
        datosRaw: estadoImportacion.datosRaw.length,
        datosMapados: estadoImportacion.datosMapados.length,
        seccion: estadoImportacion.seccionActual || 'archivos'
    });

    // ===== EVENT LISTENERS =====
    setupEventListeners();
    
    // ===== CARGAR ARCHIVOS GUARDADOS =====
    cargarListadoArchivos();
    
    // ===== RESTAURAR ESTADO ANTERIOR SI EXISTE =====
    if (estadoImportacion.datosMapados.length > 0) {
        console.log('🔄 Restaurando pestaña anterior con datos mapeados...');
        mostrarSeccion(estadoImportacion.seccionActual || 'analisis');
        
        // Si estábamos en análisis, regenerar los gráficos
        if (estadoImportacion.seccionActual === 'analisis') {
            setTimeout(() => {
                actualizarAnalisis();
            }, 500);
        }
        // Si estábamos en mapeo, restaurar el mapeo
        else if (estadoImportacion.seccionActual === 'mapeo') {
            restaurarMapeoColumnas();
        }
    } else if (estadoImportacion.datosRaw.length > 0) {
        console.log('🔄 Restaurando vista de mapeo con datos sin mapear...');
        // Necesitamos mostrar el mapeo nuevamente
        mostrarMapeoColumnas();
    } else {
        console.log('📤 Mostrando sección de archivos');
        mostrarSeccion('archivos');
    }

    actualizarWizard(estadoImportacion.seccionActual || 'archivos');
}

function setupEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const btnMapear = document.getElementById('btnMapear');
    const btnCancelarMapeo = document.getElementById('btnCancelarMapeo');
    const btnNuevaImportacion = document.getElementById('btnNuevaImportacion');
    const btnActualizarAnalisis = document.getElementById('btnActualizarAnalisis');
    const btnExportarAnalisis = document.getElementById('btnExportarAnalisis');
    const btnRefrescarArchivos = document.getElementById('btnRefrescarArchivos');
    const btnNuevoArchivo = document.getElementById('btnNuevoArchivo');
    const btnVolver = document.getElementById('btnVolver');
    const btnConfirmarConceptos = document.getElementById('btnConfirmarConceptos');
    const btnVolverMapeo = document.getElementById('btnVolverMapeo');
    const btnSeleccionarTodos = document.getElementById('btnSeleccionarTodos');
    const btnDeseleccionarTodos = document.getElementById('btnDeseleccionarTodos');
    const btnGuardarEnBD = document.getElementById('btnGuardarEnBD');
    const tablaConceptosToggle = document.getElementById('tablaConceptosToggle');
    const selectPresetMapeo = document.getElementById('selectPresetMapeo');
    const btnGuardarPresetMapeo = document.getElementById('btnGuardarPresetMapeo');
    const btnEliminarPresetMapeo = document.getElementById('btnEliminarPresetMapeo');
    const btnDescargarErroresValidacion = document.getElementById('btnDescargarErroresValidacion');
    const previewFilterInput = document.getElementById('previewFilterInput');
    const conceptoSearchInput = document.getElementById('conceptoSearchInput');
    const conceptoSortSelect = document.getElementById('conceptoSortSelect');
    const btnAplicarCategoriaMasiva = document.getElementById('btnAplicarCategoriaMasiva');
    const listadoArchivos = document.getElementById('listadoArchivos');

    // Validar que los elementos existan
    if (!uploadArea || !fileInput) {
        console.error('❌ Elementos del formulario no encontrados');
        return;
    }

    // Manejo de carga de archivo
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Botones de mapeo
    if (btnMapear) {
        btnMapear.addEventListener('click', () => {
            if (validarMapeo()) {
                const hayValidos = procesarDatosConMapeo();
                if (hayValidos) {
                    mostrarSeleccionConceptos();
                } else {
                    showAlert('⚠️ No hay filas validas para continuar. Revisa el panel de validacion.', 'warning');
                }
            }
        });
    }

    if (selectPresetMapeo) {
        selectPresetMapeo.addEventListener('change', () => {
            if (selectPresetMapeo.value) {
                aplicarPresetMapeo(selectPresetMapeo.value);
            }
        });
    }

    if (btnGuardarPresetMapeo) {
        btnGuardarPresetMapeo.addEventListener('click', guardarPresetActual);
    }

    if (btnEliminarPresetMapeo) {
        btnEliminarPresetMapeo.addEventListener('click', eliminarPresetSeleccionado);
    }

    if (btnDescargarErroresValidacion) {
        btnDescargarErroresValidacion.addEventListener('click', descargarErroresValidacion);
    }

    if (previewFilterInput) {
        previewFilterInput.addEventListener('input', mostrarPreview);
    }

    ['selectFecha', 'selectConcepto', 'selectImporte', 'selectTipo', 'selectSaldo', 'formatoFecha']
        .map((id) => document.getElementById(id))
        .filter(Boolean)
        .forEach((el) => {
            el.addEventListener('change', () => {
                estadoImportacion.presetSeleccionado = null;
                const presetSelect = document.getElementById('selectPresetMapeo');
                if (presetSelect) presetSelect.value = '';
                mostrarPreview();
            });
        });

    if (btnCancelarMapeo) {
        btnCancelarMapeo.addEventListener('click', () => {
            resetearImportacion();
            mostrarSeccion('archivos');
        });
    }

    // Botón para nueva importación
    if (btnNuevaImportacion) {
        btnNuevaImportacion.addEventListener('click', () => {
            resetearImportacion();
            mostrarSeccion('archivos');
        });
    }

    // Análisis
    if (btnActualizarAnalisis) {
        btnActualizarAnalisis.addEventListener('click', actualizarAnalisis);
    }
    
    if (btnExportarAnalisis) {
        btnExportarAnalisis.addEventListener('click', exportarDatos);
    }

    // Guardar en BD
    if (btnGuardarEnBD) {
        btnGuardarEnBD.addEventListener('click', mostrarSeleccionCategorias);
    }

    // Botones de categorías
    const btnConfirmarCategorias = document.getElementById('btnConfirmarCategorias');
    const btnVolverAnalisis = document.getElementById('btnVolverAnalisis');
    
    if (btnConfirmarCategorias) {
        btnConfirmarCategorias.addEventListener('click', confirmarCategoriasYContinuar);
    }
    
    if (btnVolverAnalisis) {
        btnVolverAnalisis.addEventListener('click', () => mostrarSeccion('seleccionConceptos'));
    }

    if (btnAplicarCategoriaMasiva) {
        btnAplicarCategoriaMasiva.addEventListener('click', aplicarCategoriaMasiva);
    }

    // Botones de archivos guardados
    if (btnRefrescarArchivos) {
        btnRefrescarArchivos.addEventListener('click', cargarListadoArchivos);
    }
    
    if (btnNuevoArchivo) {
        btnNuevoArchivo.addEventListener('click', () => {
            resetearImportacion();
            mostrarSeccion('upload');
        });
    }
    
    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            resetearImportacion();
            mostrarSeccion('archivos');
        });
    }

    if (listadoArchivos) {
        listadoArchivos.addEventListener('click', async (event) => {
            const button = event.target.closest('button[data-action][data-id]');
            if (!button) return;

            const id = button.dataset.id;
            const nombre = button.dataset.nombre || '';
            if (!id) return;

            if (button.dataset.action === 'cargar') {
                await cargarArchivoGuardado(id);
            } else if (button.dataset.action === 'descargar') {
                await descargarArchivo(id);
            } else if (button.dataset.action === 'eliminar') {
                await eliminarArchivo(id, nombre);
            }
        });
    }

    // Botones de selección de conceptos
    if (btnConfirmarConceptos) {
        btnConfirmarConceptos.addEventListener('click', () => {
            aplicarSeleccionConceptos();
            mostrarSeleccionCategorias();
        });
    }

    if (btnVolverMapeo) {
        btnVolverMapeo.addEventListener('click', () => {
            mostrarSeccion('mapeo');
        });
    }

    if (btnSeleccionarTodos) {
        btnSeleccionarTodos.addEventListener('click', () => {
            document.querySelectorAll('.concepto-item input[type="checkbox"]').forEach(cb => cb.checked = true);
            actualizarConceptosSeleccionadosDesdeUI();
        });
    }

    if (btnDeseleccionarTodos) {
        btnDeseleccionarTodos.addEventListener('click', () => {
            document.querySelectorAll('.concepto-item input[type="checkbox"]').forEach(cb => cb.checked = false);
            actualizarConceptosSeleccionadosDesdeUI();
        });
    }

    if (conceptoSearchInput) {
        conceptoSearchInput.addEventListener('input', renderListaConceptos);
    }

    if (conceptoSortSelect) {
        conceptoSortSelect.addEventListener('change', renderListaConceptos);
    }

    const listaConceptos = document.getElementById('listaConceptos');
    if (listaConceptos) {
        listaConceptos.addEventListener('change', (event) => {
            const checkbox = event.target.closest('input[type="checkbox"][data-concepto]');
            if (!checkbox) return;
            actualizarConceptosSeleccionadosDesdeUI();
        });
    }

    if (tablaConceptosToggle) {
        tablaConceptosToggle.addEventListener('click', (event) => {
            const btn = event.target.closest('[data-filter]');
            if (!btn) return;

            const filter = btn.dataset.filter;
            estadoImportacion.tableFilter = filter;

            tablaConceptosToggle.querySelectorAll('.btn-toggle').forEach(el => {
                el.classList.toggle('active', el === btn);
            });

            actualizarAnalisis();
        });
    }

    // Inicializar fechas por defecto
    const desdeInput = document.getElementById('analisisDesde');
    const hastaInput = document.getElementById('analisisHasta');
    
    if (desdeInput && hastaInput) {
        const hoy = new Date();
        const hace30 = new Date(hoy);
        hace30.setDate(hace30.getDate() - 30);
        desdeInput.valueAsDate = hace30;
        hastaInput.valueAsDate = hoy;
    }
}

function handleFileSelect(file) {
    console.log('📄 Archivo seleccionado:', file.name);
    
    estadoImportacion.archivoActual = file;
    estadoImportacion.nombreArchivoOrigen = file.name;
    // Marcar como archivo NUEVO (no es uno cargado desde servidor)
    estadoImportacion.archivoNuevo = true;
    estadoImportacion.archivoId = null;

    // Mostrar progreso
    actualizarProgreso(10, 'Procesando archivo');

    // Validar que el archivo sea Excel o CSV
    const esExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const esCSV = file.name.endsWith('.csv');

    if (!esExcel && !esCSV) {
        showAlert('❌ ' + t('importacion.errorArchivoFormato'), 'error');
        document.getElementById('fileProgress').style.display = 'none';
        return;
    }

    // Leer archivo con librería
    if (esCSV) {
        leerCSV(file);
    } else {
        leerExcel(file);
    }
}

function leerExcel(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            actualizarProgreso(40, 'Leyendo Excel');
            const data = e.target.result;
            // Usamos XLSX que debe estar cargado globalmente
            if (typeof XLSX === 'undefined') {
                showAlert('❌ ' + t('importacion.errorXlsxNoEstaCargado'));
                return;
            }
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            const limpieza = limpiarColumnasImportacion(jsonData);
            estadoImportacion.datosRaw = limpieza.datos;
            estadoImportacion.columnas = limpieza.columnas;
            actualizarProgreso(85, 'Preparando mapeo');

            console.log('✅ Excel procesado. Columnas encontradas:', estadoImportacion.columnas);
            mostrarMapeoColumnas();
        } catch (error) {
            console.error('Error al leer Excel:', error);
            showAlert('❌ ' + t('importacion.errorExcelInvalido'));
            document.getElementById('fileProgress').style.display = 'none';
        }
    };
    reader.readAsArrayBuffer(file);
}

function leerCSV(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            actualizarProgreso(40, 'Leyendo CSV');
            const csv = e.target.result;
            const lineas = csv.trim().split('\n').filter(l => l.trim());
            
            if (lineas.length < 2) {
                showAlert('El archivo CSV no tiene datos válidos.');
                document.getElementById('fileProgress').style.display = 'none';
                return;
            }

            // Detectar delimitador (coma, punto y coma, tabulación)
            let delimitador = ',';
            if (lineas[0].includes(';')) {
                delimitador = ';';
            } else if (lineas[0].includes('\t')) {
                delimitador = '\t';
            }

            // Parsear CSV de forma más robusta
            const parseCSVLine = (line) => {
                const result = [];
                let current = '';
                let insideQuotes = false;

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    const nextChar = line[i + 1];

                    if (char === '"') {
                        if (insideQuotes && nextChar === '"') {
                            current += '"';
                            i++;
                        } else {
                            insideQuotes = !insideQuotes;
                        }
                    } else if (char === delimitador && !insideQuotes) {
                        result.push(current.trim().replace(/^"|"$/g, ''));
                        current = '';
                    } else {
                        current += char;
                    }
                }
                result.push(current.trim().replace(/^"|"$/g, ''));
                return result;
            };

            const headers = parseCSVLine(lineas[0]);
            const jsonData = [];

            for (let i = 1; i < lineas.length; i++) {
                const valores = parseCSVLine(lineas[i]);
                const obj = {};
                headers.forEach((h, idx) => {
                    obj[h.trim()] = valores[idx] || '';
                });
                if (Object.values(obj).some(v => v.trim() !== '')) {
                    jsonData.push(obj);
                }
            }

            if (jsonData.length === 0) {
                showAlert('El archivo CSV no contiene datos válidos.');
                document.getElementById('fileProgress').style.display = 'none';
                return;
            }

            const limpieza = limpiarColumnasImportacion(jsonData, headers);
            estadoImportacion.datosRaw = limpieza.datos;
            estadoImportacion.columnas = limpieza.columnas;
            actualizarProgreso(85, 'Preparando mapeo');

            console.log('✅ CSV procesado. Columnas encontradas:', estadoImportacion.columnas);
            mostrarMapeoColumnas();
        } catch (error) {
            console.error('❌ Error al leer CSV:', error);
            showAlert('Error al procesar el archivo CSV: ' + error.message);
            document.getElementById('fileProgress').style.display = 'none';
        }
    };
    reader.readAsText(file);
}

function limpiarColumnasImportacion(datos, headers = null) {
    const columnas = (headers && headers.length ? headers : (datos[0] ? Object.keys(datos[0]) : []))
        .map(c => c.trim());
    const columnasLimpias = columnas.filter(c => c.toLowerCase() !== 'bruto');

    const datosLimpios = datos.map(row => {
        if (!row || typeof row !== 'object') return row;
        const limpio = { ...row };
        Object.keys(limpio).forEach(key => {
            if (key.toLowerCase() === 'bruto') {
                delete limpio[key];
            }
        });
        return limpio;
    });

    return { datos: datosLimpios, columnas: columnasLimpias };
}

function mostrarMapeoColumnas() {
    actualizarProgreso(100, 'Archivo procesado');
    setTimeout(() => {
        const fileProgress = document.getElementById('fileProgress');
        if (fileProgress) fileProgress.style.display = 'none';
    }, 300);
    
    // Llenar selects - validar que existan
    const selects = ['selectFecha', 'selectConcepto', 'selectImporte', 'selectTipo', 'selectSaldo'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) {
            console.warn(`⚠️ Select ${selectId} no encontrado en el DOM`);
            return;
        }
        
        // Limpiar opciones anteriores
        select.innerHTML = '<option value="">-- Selecciona --</option>';
        
        // Agregar nuevas opciones
        estadoImportacion.columnas.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            select.appendChild(option);
        });
    });

    // Auto-seleccionar basado en palabras clave
    autoDetectarColumnas();
    poblarSelectPresets();

    const selectPreset = document.getElementById('selectPresetMapeo');
    if (selectPreset) {
        if (estadoImportacion.presetSeleccionado && Array.from(selectPreset.options).some((opt) => opt.value === estadoImportacion.presetSeleccionado)) {
            selectPreset.value = estadoImportacion.presetSeleccionado;
            aplicarPresetMapeo(estadoImportacion.presetSeleccionado);
        } else if (selectPreset.options.length === 2) {
            selectPreset.value = selectPreset.options[1].value;
            aplicarPresetMapeo(selectPreset.value);
        }
    }

    // Mostrar preview
    mostrarPreview();

    mostrarSeccion('mapeo');
    
    console.log('✅ Mapeo de columnas mostrado');
}

function restaurarMapeoColumnas() {
    console.log('🔄 Restaurando mapeo anterior...');
    
    // Llenar selects - validar que existan
    const selects = ['selectFecha', 'selectConcepto', 'selectImporte', 'selectTipo', 'selectSaldo'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) {
            console.warn(`⚠️ Select ${selectId} no encontrado en el DOM`);
            return;
        }
        
        // Limpiar opciones anteriores
        select.innerHTML = '<option value="">-- Selecciona --</option>';
        
        // Agregar nuevas opciones
        estadoImportacion.columnas.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            select.appendChild(option);
        });
    });
    
    // Restaurar valores anteriores del mapeo
    if (estadoImportacion.mapeo.fecha) {
        const selectFecha = document.getElementById('selectFecha');
        if (selectFecha) selectFecha.value = estadoImportacion.mapeo.fecha;
    }
    if (estadoImportacion.mapeo.concepto) {
        const selectConcepto = document.getElementById('selectConcepto');
        if (selectConcepto) selectConcepto.value = estadoImportacion.mapeo.concepto;
    }
    if (estadoImportacion.mapeo.importe) {
        const selectImporte = document.getElementById('selectImporte');
        if (selectImporte) selectImporte.value = estadoImportacion.mapeo.importe;
    }
    if (estadoImportacion.mapeo.tipo) {
        const selectTipo = document.getElementById('selectTipo');
        if (selectTipo) selectTipo.value = estadoImportacion.mapeo.tipo;
    }
    if (estadoImportacion.mapeo.saldo) {
        const selectSaldo = document.getElementById('selectSaldo');
        if (selectSaldo) selectSaldo.value = estadoImportacion.mapeo.saldo;
    }
    
    // Restaurar formato de fecha si existe
    const formatoFecha = document.getElementById('formatoFecha');
    if (formatoFecha && estadoImportacion.formatoFecha) {
        formatoFecha.value = estadoImportacion.formatoFecha;
    }

    poblarSelectPresets();
    const selectPreset = document.getElementById('selectPresetMapeo');
    if (selectPreset && estadoImportacion.presetSeleccionado) {
        selectPreset.value = estadoImportacion.presetSeleccionado;
    }

    // Mostrar preview
    mostrarPreview();

    mostrarSeccion('mapeo');
    
    console.log('✅ Mapeo anterior restaurado', estadoImportacion.mapeo);
}

function autoDetectarColumnas() {
    const palabrasClave = {
        fecha: ['fecha', 'date', 'día', 'dia', 'day', 'fecha_operacion', 'fecha_valor'],
        concepto: ['concepto', 'descripción', 'descripcion', 'description', 'asunto', 'detalle', 'detail', 'concepto_operacion'],
        importe: ['importe', 'amount', 'cantidad', 'monto', 'valor', 'importe_operacion', 'importe_neto'],
        saldo: ['saldo', 'balance', 'balance_disponible', 'saldo_disponible', 'saldo_final', 'available_balance', 'saldo_actual']
    };

    for (const [tipo, palabras] of Object.entries(palabrasClave)) {
        const columnaEncontrada = estadoImportacion.columnas.find(col =>
            palabras.some(palabra => col.toLowerCase().includes(palabra))
        );
        
        if (columnaEncontrada) {
            const selectId = `select${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
            const select = document.getElementById(selectId);
            
            if (select) {
                select.value = columnaEncontrada;
                console.log(`✅ Auto-detectado ${tipo}: ${columnaEncontrada}`);
            } else {
                console.warn(`⚠️ Select ${selectId} no encontrado`);
            }
        }
    }
}

function mostrarPreview() {
    const previewTable = document.getElementById('previewTable');
    const previewHeader = document.getElementById('previewHeader');
    const previewBody = document.getElementById('previewBody');
    const previewInfo = document.getElementById('previewInfo');

    // Validar que los elementos existan
    if (!previewTable || !previewHeader || !previewBody || !previewInfo) {
        console.warn('⚠️ Elementos de preview no encontrados en el DOM');
        return;
    }

    // Limpiar
    previewHeader.innerHTML = '';
    previewBody.innerHTML = '';

    // Headers
    const columnasMapeadas = new Set([
        document.getElementById('selectFecha')?.value,
        document.getElementById('selectConcepto')?.value,
        document.getElementById('selectImporte')?.value,
        document.getElementById('selectTipo')?.value,
        document.getElementById('selectSaldo')?.value
    ].filter(Boolean));

    estadoImportacion.columnas.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        if (columnasMapeadas.has(col)) {
            th.classList.add('mapped-col');
        }
        previewHeader.appendChild(th);
    });

    const filtro = normalizarTexto(document.getElementById('previewFilterInput')?.value || '');
    const filasFuente = filtro
        ? estadoImportacion.datosRaw.filter((row) => estadoImportacion.columnas.some((col) => normalizarTexto(row[col]).includes(filtro)))
        : estadoImportacion.datosRaw;

    // Primeras filas
    const filasPreview = filasFuente.slice(0, 8);
    filasPreview.forEach(row => {
        const tr = document.createElement('tr');
        const fechaCol = document.getElementById('selectFecha')?.value;
        const conceptoCol = document.getElementById('selectConcepto')?.value;
        const importeCol = document.getElementById('selectImporte')?.value;
        const formatoFecha = document.getElementById('formatoFecha')?.value || estadoImportacion.formatoFecha || 'DD/MM/YYYY';

        if (fechaCol || conceptoCol || importeCol) {
            const fecha = fechaCol ? parseDate(row[fechaCol], formatoFecha) : new Date();
            const concepto = conceptoCol ? String(row[conceptoCol] || '').trim() : 'ok';
            const importe = importeCol ? parseImporte(row[importeCol]) : 1;
            if (!fecha || !concepto || !Number.isFinite(importe) || importe === 0) {
                tr.classList.add('preview-invalid');
            }
        }

        estadoImportacion.columnas.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] || '';
            if (columnasMapeadas.has(col)) {
                td.classList.add('mapped-col');
            }
            tr.appendChild(td);
        });
        previewBody.appendChild(tr);
    });

    const rangoFechas = obtenerRangoFechasDesdeRaw();
    if (rangoFechas) {
        aplicarRangoFechasAnalisis(rangoFechas.min, rangoFechas.max, false);
    }

    const baseInfo = tt('importacion.previewMostrando', 'Mostrando');
    const baseFilas = tt('importacion.filas', 'filas');
    const baseFiltradas = tt('importacion.filtradas', 'filtradas');
    const rangoTexto = rangoFechas
        ? ` · ${tt('importacion.fechasDisponibles', 'Fechas disponibles')}: ${rangoFechas.min.toLocaleDateString()} - ${rangoFechas.max.toLocaleDateString()}`
        : '';
    previewInfo.textContent = `${baseInfo} ${filasPreview.length}/${filasFuente.length} ${baseFilas}${filtro ? ` ${baseFiltradas}` : ''}${rangoTexto}`;
    console.log('✅ Preview mostrado con', filasPreview.length, 'filas');
}

function validarMapeo() {
    const selectFecha = document.getElementById('selectFecha');
    const selectConcepto = document.getElementById('selectConcepto');
    const selectImporte = document.getElementById('selectImporte');
    
    // Validar que los elementos existan
    if (!selectFecha || !selectConcepto || !selectImporte) {
           showAlert('❌ ' + t('importacion.errorMapeoNoEncontrado'), 'error');
        console.error('❌ Selects no encontrados en el DOM');
        return false;
    }

    const fecha = selectFecha.value;
    const concepto = selectConcepto.value;
    const importe = selectImporte.value;

    if (!fecha || !concepto || !importe) {
        showAlert('⚠️ ' + t('importacion.errorColumnasRequeridas'), 'error');
        return false;
    }

    console.log('✅ Mapeo validado:', { fecha, concepto, importe });
    return true;
}

function procesarDatosConMapeo() {
    estadoImportacion.mapeo = {
        fecha: document.getElementById('selectFecha').value,
        concepto: document.getElementById('selectConcepto').value,
        importe: document.getElementById('selectImporte').value,
        tipo: document.getElementById('selectTipo').value,
        saldo: document.getElementById('selectSaldo').value
    };
    estadoImportacion.formatoFecha = document.getElementById('formatoFecha').value || 'DD/MM/YYYY';

    const validos = [];
    const invalidos = [];

    estadoImportacion.datosRaw.forEach((row, index) => {
        const fecha = parseDate(row[estadoImportacion.mapeo.fecha], estadoImportacion.formatoFecha);
        const concepto = String(row[estadoImportacion.mapeo.concepto] || '').trim();
        const importeOriginal = row[estadoImportacion.mapeo.importe];
        const importeNumerico = parseImporte(importeOriginal);
        const tipoRaw = estadoImportacion.mapeo.tipo ? row[estadoImportacion.mapeo.tipo] : null;
        const tipo = inferirTipo(tipoRaw, importeNumerico);

        const errores = [];
        if (!fecha) errores.push('Fecha invalida');
        if (!concepto) errores.push('Concepto vacio');
        if (!Number.isFinite(importeNumerico)) errores.push('Importe invalido');
        if (Number.isFinite(importeNumerico) && importeNumerico === 0) errores.push('Importe cero');

        if (errores.length > 0) {
            invalidos.push({
                fila: index + 2,
                concepto: concepto || '-',
                importeOriginal,
                errores
            });
            return;
        }

        validos.push({
            fecha,
            concepto,
            importe: Math.abs(importeNumerico),
            tipo
        });
    });

    estadoImportacion.datosMapadosValidos = validos;
    estadoImportacion.datosMapadosInvalidos = invalidos;
    estadoImportacion.datosMapados = validos;
    estadoImportacion.datosAnalisisActual = [];

    if (validos.length > 0) {
        const fechas = validos
            .map((d) => d.fecha)
            .filter((d) => d instanceof Date && !Number.isNaN(d.getTime()))
            .sort((a, b) => a - b);
        if (fechas.length) {
            aplicarRangoFechasAnalisis(fechas[0], fechas[fechas.length - 1], true);
        }
    }

    actualizarPanelValidacion();
    console.log('✅ Datos procesados:', validos.length, 'validos,', invalidos.length, 'invalidos');

    return validos.length > 0;
}

function parseDate(dateStr, formato) {
    if (dateStr == null || dateStr === '') return null;

    if (dateStr instanceof Date) {
        return Number.isNaN(dateStr.getTime()) ? null : dateStr;
    }

    if (typeof dateStr === 'number' && Number.isFinite(dateStr)) {
        if (dateStr > 10000 && dateStr < 100000) {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const date = new Date(excelEpoch.getTime() + Math.round(dateStr) * 86400000);
            return Number.isNaN(date.getTime()) ? null : date;
        }
        const date = new Date(dateStr);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const raw = String(dateStr).trim();
    if (!raw) return null;

    if (/^\d{5}(\.\d+)?$/.test(raw)) {
        const serial = Number(raw);
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(excelEpoch.getTime() + Math.round(serial) * 86400000);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const match = raw.match(/^(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})$/);
    if (match) {
        const a = Number(match[1]);
        const b = Number(match[2]);
        const c = Number(match[3]);

        let day;
        let month;
        let year;

        if (String(a).length === 4) {
            year = a;
            month = b;
            day = c;
        } else if ((formato || '').includes('MM/DD')) {
            month = a;
            day = b;
            year = c;
        } else {
            day = a;
            month = b;
            year = c;
        }

        const date = new Date(year, month - 1, day);
        if (
            !Number.isNaN(date.getTime())
            && date.getFullYear() === year
            && date.getMonth() === month - 1
            && date.getDate() === day
        ) {
            return date;
        }
    }

    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function mostrarSeleccionConceptos() {
    renderListaConceptos(false);
    mostrarSeccion('seleccionConceptos');
    console.log('✅ Selección de conceptos mostrada');
}

function actualizarConceptosSeleccionadosDesdeUI() {
    const checkboxes = document.querySelectorAll('.concepto-item input[type="checkbox"][data-concepto]');
    if (!checkboxes.length) return;

    estadoImportacion.conceptosSeleccionados = Array.from(checkboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.dataset.concepto);
}

function renderListaConceptos(forzarTodosSeleccionados = false) {
    const listaConceptos = document.getElementById('listaConceptos');
    if (!listaConceptos) return;

    if (!forzarTodosSeleccionados) {
        actualizarConceptosSeleccionadosDesdeUI();
    }

    const searchInput = document.getElementById('conceptoSearchInput');
    const sortSelect = document.getElementById('conceptoSortSelect');
    const filtro = normalizarTexto(searchInput?.value || '');
    const sortBy = sortSelect?.value || 'impacto';

    const conceptosMap = {};
    estadoImportacion.datosMapados.forEach((d) => {
        const concepto = d.concepto || 'Sin concepto';
        if (!conceptosMap[concepto]) {
            conceptosMap[concepto] = {
                nombre: concepto,
                count: 0,
                totalIngreso: 0,
                totalGasto: 0
            };
        }
        conceptosMap[concepto].count += 1;
        if (d.tipo === 'ingreso') {
            conceptosMap[concepto].totalIngreso += d.importe;
        } else {
            conceptosMap[concepto].totalGasto += d.importe;
        }
    });

    let conceptos = Object.values(conceptosMap);
    if (filtro) {
        conceptos = conceptos.filter((c) => normalizarTexto(c.nombre).includes(filtro));
    }

    conceptos.sort((a, b) => {
        if (sortBy === 'alfabetico') return a.nombre.localeCompare(b.nombre, 'es');
        if (sortBy === 'movimientos') return b.count - a.count;
        const impactoA = Math.max(a.totalIngreso, a.totalGasto);
        const impactoB = Math.max(b.totalIngreso, b.totalGasto);
        return impactoB - impactoA;
    });

    const selectedSet = new Set(
        (forzarTodosSeleccionados || estadoImportacion.conceptosSeleccionados.length === 0)
            ? Object.keys(conceptosMap)
            : estadoImportacion.conceptosSeleccionados
    );

    listaConceptos.innerHTML = '';
    if (conceptos.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'color-secondary';
        empty.textContent = tt('importacion.sinConceptosFiltro', 'Sin conceptos que coincidan con el filtro');
        listaConceptos.appendChild(empty);
        return;
    }

    conceptos.forEach((concepto) => {
        const div = document.createElement('div');
        div.className = 'concepto-item';

        const tipo = concepto.totalIngreso > concepto.totalGasto ? 'ingreso' : 'gasto';
        const total = Math.max(concepto.totalIngreso, concepto.totalGasto);
        const checked = selectedSet.has(concepto.nombre);
        const conceptoEscapado = escapeHtml(concepto.nombre);

        div.innerHTML = `
            <input type="checkbox" ${checked ? 'checked' : ''} data-concepto="${conceptoEscapado}">
            <div class="concepto-texto">
                <span class="concepto-nombre">${conceptoEscapado}</span>
                <div class="concepto-info">
                    <span class="concepto-badge badge-${tipo}">${tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}</span>
                    <span>${concepto.count} movimientos</span>
                    <span><strong>${window.formatCurrency ? window.formatCurrency(total) : total.toFixed(2) + '€'}</strong></span>
                </div>
            </div>
        `;
        listaConceptos.appendChild(div);
    });

    actualizarConceptosSeleccionadosDesdeUI();
}

function aplicarSeleccionConceptos() {
    actualizarConceptosSeleccionadosDesdeUI();
    console.log('✅ Conceptos seleccionados:', estadoImportacion.conceptosSeleccionados.length);
}

function aplicarCategoriaMasiva() {
    const masivo = document.getElementById('categoriaMasivaSelect');
    if (!masivo || !masivo.value) {
        showAlert('⚠️ Selecciona una categoria masiva antes de aplicar', 'warning');
        return;
    }

    const selects = document.querySelectorAll('.categoria-select');
    let aplicados = 0;
    selects.forEach((select) => {
        if (Array.from(select.options).some((opt) => opt.value === masivo.value)) {
            select.value = masivo.value;
            aplicados += 1;
        }
    });

    if (aplicados === 0) {
        showAlert('⚠️ La categoria seleccionada no aplica a los conceptos visibles', 'warning');
        return;
    }

    if (typeof window.notifyInfo === 'function') {
        window.notifyInfo(`Categoria aplicada en ${aplicados} conceptos`);
    }
}




function actualizarAnalisis() {
    const desdeInput = document.getElementById('analisisDesde').value;
    const hastaInput = document.getElementById('analisisHasta').value;

    alternarLoadingAnalisis(true);

    if (!desdeInput || !hastaInput) {
        console.warn('Rango de fechas no establecido');
        showAlert('⚠️ ' + t('importacion.errorRangoFechas'), 'info');
        alternarLoadingAnalisis(false);
        return;
    }

    const desde = new Date(desdeInput);
    const hasta = new Date(hastaInput);
    hasta.setHours(23, 59, 59, 999); // Incluir todo el último día

    console.log('📊 Filtrando desde', desde, 'hasta', hasta);
    console.log('📊 Datos totales disponibles:', estadoImportacion.datosMapados.length);
    console.log('📊 Muestra de datos:', estadoImportacion.datosMapados.slice(0, 3));

    let datosFilterados = estadoImportacion.datosMapados.filter(d => {
        if (!d.fecha) return false;
        const fecha = new Date(d.fecha);
        return fecha >= desde && fecha <= hasta;
    });

    // Filtrar por conceptos seleccionados si hay alguno
    if (estadoImportacion.conceptosSeleccionados && estadoImportacion.conceptosSeleccionados.length > 0) {
        datosFilterados = datosFilterados.filter(d => 
            estadoImportacion.conceptosSeleccionados.includes(d.concepto || 'Sin concepto')
        );
        console.log('📊 Filtrado por conceptos seleccionados:', datosFilterados.length, 'registros');
    }

    console.log('📊 Generando gráficos con', datosFilterados.length, 'registros filtrados');
    console.log('📊 Muestra filtrada:', datosFilterados.slice(0, 3));

    if (datosFilterados.length === 0) {
        showAlert('⚠️ ' + t('importacion.errorSinDatosRango'), 'info');
        estadoImportacion.datosAnalisisActual = [];
        actualizarKpisAnalisis([]);
        alternarLoadingAnalisis(false);
        return;
    }

    estadoImportacion.datosAnalisisActual = datosFilterados;
    actualizarKpisAnalisis(datosFilterados);

    generarGraficoCategoria(datosFilterados);
    generarGraficoIngresoVsGasto(datosFilterados);
    generarGraficoEvolucionSaldo(datosFilterados, estadoImportacion.datosRaw, estadoImportacion.mapeo.saldo);
    generarGraficoMovimientosPorMes(datosFilterados);
    
    // Aviso de éxito eliminado por requerimiento
    
    // Guardar archivo automáticamente SOLO si es nuevo y no ha sido guardado aún
    // Si es un archivo cargado (archivoNuevo=false), no guardar para evitar duplicados
    if (estadoImportacion.archivoNuevo && !estadoImportacion.archivoGuardado) {
        console.log('💾 Auto-guardando archivo nuevo...');
        const nombre = estadoImportacion.archivoActual?.name || `importacion_${new Date().toLocaleDateString('es-ES')}`;
        guardarDatosEnServidor(nombre);
    } else {
        if (!estadoImportacion.archivoNuevo) {
            console.log('⏭️ Archivo cargado desde servidor, NO se guarda automáticamente para evitar duplicados');
        }
    }

    alternarLoadingAnalisis(false);
}

function generarGraficoCategoria(datos) {
    try {
        const ctx = document.getElementById('chartCategoria')?.getContext('2d');
        if (!ctx) {
            console.error('❌ Canvas chartCategoria no encontrado');
            return;
        }

        // Agrupar por concepto/descripción para ver los movimientos principales
        const conceptos = {};
        datos.forEach(d => {
            const concepto = d.concepto.substring(0, 30); // Limitar a 30 caracteres
            if (!conceptos[concepto]) {
                conceptos[concepto] = { total: 0, ingresos: 0, gastos: 0 };
            }
            const importe = d.importe || 0;
            if (d.tipo === 'ingreso') {
                conceptos[concepto].ingresos += importe;
            } else {
                conceptos[concepto].gastos += importe;
            }
            conceptos[concepto].total += importe;
        });

    // Ordenar por monto total y tomar los 10 principales
    const labels = Object.keys(conceptos)
        .sort((a, b) => conceptos[b].total - conceptos[a].total)
        .slice(0, 10);
    
    const datosGasto = labels.map(concepto => conceptos[concepto].gastos);
    const datosIngreso = labels.map(concepto => conceptos[concepto].ingresos);

        if (estadoImportacion.charts.categoria) {
            estadoImportacion.charts.categoria.destroy();
        }

        estadoImportacion.charts.categoria = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gastos',
                        data: datosGasto,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1
                    },
                    {
                        label: 'Ingresos',
                        data: datosIngreso,
                        backgroundColor: 'rgba(75, 192, 75, 0.7)',
                        borderColor: 'rgb(75, 192, 75)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
        console.log('✅ Gráfico de categorías generado');
    } catch (error) {
        console.error('❌ Error generando gráfico de categorías:', error);
        showAlert('❌ ' + t('importacion.errorGraficoCategoria') + ': ' + error.message);
    }
}

function generarGraficoIngresoVsGasto(datos) {
    try {
        if (estadoImportacion.charts.ingresoVsGasto) {
            estadoImportacion.charts.ingresoVsGasto.destroy();
            delete estadoImportacion.charts.ingresoVsGasto;
        }

        const tbody = document.getElementById('tablaConceptosBody');
        if (!tbody) {
            console.error('❌ Tabla tablaConceptosBody no encontrada');
            return;
        }

        const filter = estadoImportacion.tableFilter || 'gasto';
        const datosFiltrados = datos.filter(item => item.tipo === filter);

        const conceptosMap = new Map();
        datosFiltrados.forEach(item => {
            const concepto = item.concepto || 'Sin concepto';
            const entry = conceptosMap.get(concepto) || { total: 0, count: 0 };
            entry.total += item.importe || 0;
            entry.count += 1;
            conceptosMap.set(concepto, entry);
        });

        const rows = Array.from(conceptosMap.entries())
            .map(([concepto, info]) => ({ concepto, total: info.total, count: info.count }))
            .sort((a, b) => b.total - a.total);

        tbody.innerHTML = '';
        if (rows.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="3">Sin datos</td>';
            tbody.appendChild(tr);
            return;
        }

        rows.forEach(row => {
            const tr = document.createElement('tr');
            if (filter === 'gasto') {
                tr.classList.add('row-gasto');
            }
            tr.innerHTML = `
                <td>${row.concepto}</td>
                <td><strong>${window.formatCurrency ? window.formatCurrency(row.total) : row.total.toFixed(2) + '€'}</strong></td>
                <td>${row.count}</td>
            `;
            tbody.appendChild(tr);
        });

        console.log('✅ Tabla de conceptos generada');
    } catch (error) {
        console.error('❌ Error generando tabla de conceptos:', error);
        showAlert('❌ ' + t('importacion.errorGraficoIngresoVsGasto') + ': ' + error.message);
    }
}

function generarGraficoEvolucionSaldo(datos, datosRaw, columnasSaldo) {
    try {
        const chartBox = document.querySelector('[data-i18n="importacion.evolucionSaldo"]')?.closest('.chart-box');
        
        // Si no existe columna de saldo, ocultar el gráfico
        if (!columnasSaldo) {
            console.log('⏭️ Columna de saldo no seleccionada, ocultando gráfico de Evolución de Saldo');
            if (chartBox) {
                chartBox.style.display = 'none';
            }
            return;
        }
        
        // Mostrar el gráfico si estaba oculto
        if (chartBox) {
            chartBox.style.display = 'block';
        }
        
        const ctx = document.getElementById('chartEvolucionSaldo')?.getContext('2d');
        if (!ctx) {
            console.error('❌ Canvas chartEvolucionSaldo no encontrado');
            return;
        }

        // Usar datos de saldo directamente si están disponibles
        const datosPorFecha = {};
        datosRaw.forEach(d => {
            const fechaStr = d[estadoImportacion.mapeo.fecha];
            const fecha = parseDate(fechaStr, estadoImportacion.formatoFecha);
            const fechaKey = fecha ? fecha.toISOString().split('T')[0] : 'sin-fecha';
            
            if (!datosPorFecha[fechaKey]) {
                datosPorFecha[fechaKey] = { saldo: null };
            }
            // Usar el último saldo del día (el más reciente)
            const saldoValor = parseImporte(d[columnasSaldo]);
            if (Number.isFinite(saldoValor) && saldoValor !== 0) {
                datosPorFecha[fechaKey].saldo = saldoValor;
            }
        });

        const fechas = Object.keys(datosPorFecha).sort();
        const saldos = fechas.map(fecha => datosPorFecha[fecha].saldo || 0);

        if (estadoImportacion.charts.evolucionSaldo) {
            estadoImportacion.charts.evolucionSaldo.destroy();
        }

        estadoImportacion.charts.evolucionSaldo = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fechas.map(f => new Date(f).toLocaleDateString('es-ES')),
                datasets: [{
                    label: 'Saldo',
                    data: saldos,
                    borderColor: 'rgb(75, 150, 192)',
                    backgroundColor: 'rgba(75, 150, 192, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
        console.log('✅ Gráfico de Evolución de Saldo generado');
    } catch (error) {
        console.error('❌ Error generando gráfico de Evolución de Saldo:', error);
        showAlert('❌ ' + t('importacion.errorGraficoEvolucionSaldo') + ': ' + error.message);
    }
}

function generarGraficoMovimientosPorMes(datos) {
    try {
        const ctx = document.getElementById('chartMovimientosPorMes')?.getContext('2d');
        if (!ctx) {
            console.error('❌ Canvas chartMovimientosPorMes no encontrado');
            return;
        }

        const datosPorMes = {};
        datos.forEach(d => {
            if (!d.fecha) return;
            const fecha = new Date(d.fecha);
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            if (!datosPorMes[mes]) {
                datosPorMes[mes] = { ingresos: 0, gastos: 0, cantidad: 0 };
            }
            const importe = d.importe || 0;
            if (d.tipo === 'ingreso') {
                datosPorMes[mes].ingresos += importe;
            } else {
                datosPorMes[mes].gastos += importe;
            }
            datosPorMes[mes].cantidad++;
        });

        const meses = Object.keys(datosPorMes).sort();
        const datosGastos = meses.map(mes => datosPorMes[mes].gastos);
        const datosIngresos = meses.map(mes => datosPorMes[mes].ingresos);

        if (estadoImportacion.charts.movimientosPorMes) {
            estadoImportacion.charts.movimientosPorMes.destroy();
        }

        estadoImportacion.charts.movimientosPorMes = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: meses.map(m => new Date(m).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })),
                datasets: [
                    {
                        label: 'Gastos',
                        data: datosGastos,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1
                    },
                    {
                        label: 'Ingresos',
                        data: datosIngresos,
                        backgroundColor: 'rgba(75, 192, 75, 0.7)',
                        borderColor: 'rgb(75, 192, 75)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
        console.log('✅ Gráfico de Movimientos por Mes generado');
    } catch (error) {
        console.error('❌ Error generando gráfico de Movimientos por Mes:', error);
        showAlert('❌ ' + t('importacion.errorGraficoMovimientosPorMes') + ': ' + error.message);
    }
}

function exportarDatos() {
    console.log('💾 Exportando datos...');
    const dataset = (estadoImportacion.datosAnalisisActual && estadoImportacion.datosAnalisisActual.length > 0)
        ? estadoImportacion.datosAnalisisActual
        : estadoImportacion.datosMapados;

    if (!dataset || dataset.length === 0) {
        showAlert('⚠️ No hay datos para exportar', 'warning');
        return;
    }

    const csvCell = (value) => {
        const text = String(value ?? '');
        return `"${text.replace(/"/g, '""')}"`;
    };

    const formatearFechaCsv = (fecha) => {
        if (!fecha) return '';
        const date = (fecha instanceof Date) ? fecha : new Date(fecha);
        if (Number.isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };
    
    // Crear CSV
    const headers = ['Fecha', 'Concepto', 'Importe', 'Tipo'];
    const rows = dataset.map(d => [
        formatearFechaCsv(d.fecha),
        d.concepto,
        d.importe,
        d.tipo
    ]);

    let csv = headers.map(csvCell).join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(csvCell).join(',') + '\n';
    });

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analisis_bancario_${formatearFechaCsv(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    // Aviso de éxito eliminado por requerimiento
}

function descargarErroresValidacion() {
    const errores = Array.isArray(estadoImportacion.datosMapadosInvalidos)
        ? estadoImportacion.datosMapadosInvalidos
        : [];

    if (!errores.length) {
        showInfoToast('No hay errores de validación para exportar');
        return;
    }

    const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = ['Fila', 'Concepto', 'Importe', 'Errores'];

    let csv = headers.map(csvCell).join(',') + '\n';
    errores.forEach((item) => {
        csv += [
            item.fila || '',
            item.concepto || '',
            item.importeOriginal ?? '',
            Array.isArray(item.errores) ? item.errores.join('; ') : ''
        ].map(csvCell).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `importacion_errores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

async function mostrarSeleccionCategorias() {
    if (!estadoImportacion.datosMapados || estadoImportacion.datosMapados.length === 0) {
        showAlert('⚠️ No hay datos mapeados para guardar', 'warning');
        return;
    }

    try {
        const conceptosFiltrados = (estadoImportacion.conceptosSeleccionados && estadoImportacion.conceptosSeleccionados.length > 0)
            ? estadoImportacion.datosMapados.filter(d => estadoImportacion.conceptosSeleccionados.includes(d.concepto || 'Sin concepto'))
            : estadoImportacion.datosMapados;

        // Cargar categorías
        const categorias = await fetch('/categorias').then(r => r.json());
        const dashboardData = await fetch('/dashboard').then(r => r.json()).catch(() => null);
        const mapaGuardados = {
            gastos: crearMapaConceptosGuardados(dashboardData, 'gasto'),
            ingresos: crearMapaConceptosGuardados(dashboardData, 'ingreso')
        };

        const categoriaMasivaSelect = document.getElementById('categoriaMasivaSelect');
        if (categoriaMasivaSelect) {
            categoriaMasivaSelect.innerHTML = '<option value="">-- Selecciona --</option>';
            const categoriasMasivas = [
                ...(Array.isArray(categorias.gastos) ? categorias.gastos.map((c) => ({ ...c, tipo: 'Gasto' })) : []),
                ...(Array.isArray(categorias.ingresos) ? categorias.ingresos.map((c) => ({ ...c, tipo: 'Ingreso' })) : [])
            ];

            categoriasMasivas.forEach((cat) => {
                const option = document.createElement('option');
                option.value = String(cat.id);
                option.textContent = `[${cat.tipo}] ${cat.nombre}`;
                categoriaMasivaSelect.appendChild(option);
            });
        }
        
        const tablaCuerpo = document.getElementById('tablaCategoriasBodies');

        if (!tablaCuerpo) {
            console.error('❌ Tabla de categorías no encontrada');
            return;
        }

        // Limpiar tabla
        tablaCuerpo.innerHTML = '';

        // Crear mapa de conceptos únicos normalizados (categoria por concepto, no por importe)
        const conceptosMap = {};
        estadoImportacion.metaConceptosCategorias = {};
        conceptosFiltrados.forEach((d, idx) => {
            const conceptoRaw = d.concepto || 'Sin concepto';
            const conceptoKey = normalizarTexto(conceptoRaw) || 'sin-concepto';
            if (!conceptosMap[conceptoKey]) {
                conceptosMap[conceptoKey] = {
                    concepto: conceptoRaw,
                    tipo: d.tipo,
                    montoTotal: 0,
                    cantidad: 0,
                    index: idx
                };
            }
            conceptosMap[conceptoKey].montoTotal += d.importe || 0;
            conceptosMap[conceptoKey].cantidad += 1;
            estadoImportacion.metaConceptosCategorias[conceptoKey] = {
                tipo: d.tipo,
                concepto: conceptoRaw
            };
        });

        const revisionGuardada = cargarRevisionConceptoCategoria();

        // Crear filas de la tabla
        Object.entries(conceptosMap).forEach(([conceptoKey, datos]) => {
            const tr = document.createElement('tr');
            
            // Tipo
            const tdTipo = document.createElement('td');
            const icon = datos.tipo === 'ingreso' ? '📈' : '📉';
            const label = datos.tipo === 'ingreso' ? 'Ingreso' : 'Gasto';
            tdTipo.innerHTML = `<span class="badge badge-${datos.tipo}">${icon} ${label}</span>`;
            tr.appendChild(tdTipo);

            // Concepto
            const tdConcepto = document.createElement('td');
            tdConcepto.textContent = datos.concepto;
            tr.appendChild(tdConcepto);

            // Cantidad
            const tdCantidad = document.createElement('td');
            tdCantidad.textContent = window.formatCurrency
                ? window.formatCurrency(datos.montoTotal)
                : `€${datos.montoTotal.toFixed(2)}`;
            tr.appendChild(tdCantidad);

            // Selector de categoría
            const tdCategoria = document.createElement('td');
            const select = document.createElement('select');
            select.className = 'mapeo-select categoria-select';
            select.dataset.concepto = conceptoKey;
            
            // Opción por defecto
            const optDefault = document.createElement('option');
            optDefault.value = '';
            optDefault.textContent = '-- Selecciona --';
            select.appendChild(optDefault);

            // Agregar categorías apropiadas
            const catSource = datos.tipo === 'ingreso' ? categorias.ingresos : categorias.gastos;
            let categoriasAutodetectada = null;
            
            if (catSource && Array.isArray(catSource)) {
                catSource.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.nombre;
                    select.appendChild(option);
                });

                // 1) Si hay revisión previa guardada del usuario, priorizarla
                const sugeridaRevision = revisionGuardada?.[datos.tipo]?.[conceptoKey];
                if (sugeridaRevision && catSource.some((c) => Number(c.id) === Number(sugeridaRevision))) {
                    categoriasAutodetectada = Number(sugeridaRevision);
                }

                // 2) Si ya existe el concepto en tablas, usar su categoría
                const mapaTipo = datos.tipo === 'ingreso' ? mapaGuardados.ingresos : mapaGuardados.gastos;
                const guardado = mapaTipo.get(conceptoKey);
                if (!categoriasAutodetectada && guardado) {
                    const catGuardada = catSource.find(c => normalizarTexto(c.nombre) === normalizarTexto(guardado));
                    if (catGuardada) {
                        categoriasAutodetectada = catGuardada.id;
                    }
                }

                // 3) Detección automática si no hay categoría guardada/revisada
                if (!categoriasAutodetectada) {
                    categoriasAutodetectada = detectarCategoriaAutomatica(datos.concepto, catSource);
                }

                // Si solo hay una opción, seleccionarla automáticamente
                if (select.options.length === 2) {
                    select.value = select.options[1].value;
                } else if (categoriasAutodetectada) {
                    // Si se detectó automáticamente, seleccionar esa categoría
                    select.value = categoriasAutodetectada;
                }
            }

            tdCategoria.appendChild(select);
            tr.appendChild(tdCategoria);

            tablaCuerpo.appendChild(tr);
        });

        mostrarSeccion('seleccionCategorias');
        console.log('✅ Selección de categorías mostrada:', Object.keys(conceptosMap).length, 'conceptos únicos');
    } catch (error) {
        console.error('❌ Error cargando categorías:', error);
        showAlert(`❌ Error al cargar categorías: ${error.message}`, 'error');
    }
}

function obtenerCategoriasSeleccionadasDesdeTabla() {
    const categoriasSeleccionadas = {};
    const sinSeleccionar = [];
    const selects = document.querySelectorAll('.categoria-select');

    selects.forEach((select) => {
        const concepto = select.dataset.concepto;
        const categoria = select.value;

        if (!categoria) {
            sinSeleccionar.push(concepto);
        } else {
            categoriasSeleccionadas[concepto] = parseInt(categoria, 10);
        }
    });

    return { categoriasSeleccionadas, sinSeleccionar };
}

function confirmarCategoriasYContinuar() {
    const { categoriasSeleccionadas, sinSeleccionar } = obtenerCategoriasSeleccionadasDesdeTabla();
    if (sinSeleccionar.length > 0) {
        showAlert('⚠️ Por favor selecciona categoría para todos los conceptos', 'warning');
        return;
    }

    estadoImportacion.categoriasPorConcepto = categoriasSeleccionadas;
    persistirRevisionConceptoCategoria(categoriasSeleccionadas);

    actualizarAnalisis();
    mostrarSeccion('analisis');
}

function prepararCategorias(categorias) {
    return categorias.map(c => ({
        id: c.id,
        nombre: c.nombre,
        nombreNorm: normalizarTexto(c.nombre),
        tokens: new Set(normalizarTexto(c.nombre).split(' ').filter(Boolean))
    }));
}

const normalizarTexto = (texto) => (texto || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const escapeRegExp = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const contienePalabra = (texto, palabra) => {
    if (!texto || !palabra) return false;
    const regex = new RegExp(`\\b${escapeRegExp(palabra)}\\b`, 'i');
    return regex.test(texto);
};

const coincideKeyword = (textoNorm, keyword) => {
    const kwNorm = normalizarTexto(keyword);
    if (!kwNorm) return false;
    return kwNorm.includes(' ') ? textoNorm.includes(kwNorm) : contienePalabra(textoNorm, kwNorm);
};

const coincideNombre = (textoNorm, nombreNorm) => {
    if (!nombreNorm) return false;
    return nombreNorm.includes(' ') ? textoNorm.includes(nombreNorm) : contienePalabra(textoNorm, nombreNorm);
};

const coincideHint = (nombreNorm, hint) => {
    const hintNorm = normalizarTexto(hint);
    if (!hintNorm) return false;
    return hintNorm.includes(' ') ? nombreNorm.includes(hintNorm) : contienePalabra(nombreNorm, hintNorm);
};

function crearMapaConceptosGuardados(dashboardData, tipo) {
    const mapa = new Map();
    if (!dashboardData) return mapa;

    const items = [];
    if (tipo === 'gasto') {
        items.push(...(dashboardData.gastos_reales || []));
    } else if (tipo === 'ingreso') {
        items.push(...(dashboardData.ingresos_reales || []));
    }

    items.forEach(item => {
        const key = normalizarTexto(item.descripcion);
        if (!key) return;

        if (!mapa.has(key)) {
            mapa.set(key, { counts: { [item.categoria]: 1 }, categoria: item.categoria });
            return;
        }

        const entry = mapa.get(key);
        entry.counts[item.categoria] = (entry.counts[item.categoria] || 0) + 1;
        if (entry.counts[item.categoria] > entry.counts[entry.categoria]) {
            entry.categoria = item.categoria;
        }
    });

    const result = new Map();
    mapa.forEach((value, key) => result.set(key, value.categoria));
    return result;
}

/**
 * Detecta automáticamente la categoría basada en palabras clave
 * @param {string} concepto - Nombre del concepto/movimiento
 * @param {Array} categorias - Array de categorías disponibles
 * @returns {number|null} ID de categoría detectada o null
 */
function detectarCategoriaAutomatica(concepto, categorias) {
    if (!concepto || !Array.isArray(categorias) || categorias.length === 0) return null;

    const conceptoNorm = normalizarTexto(concepto);
    if (!conceptoNorm) return null;

    const categoriasNorm = prepararCategorias(categorias);

    const keywordGroups = [
        {
            key: 'supermercado',
            keywords: ['mercado', 'supermercado', 'carrefour', 'alcampo', 'lidl', 'aldi', 'eroski', 'caprabo', 'supermarket', 'grocery', 'dia', 'hiper', 'compras'],
            hints: ['supermercado', 'alimentacion', 'alimentacion y hogar', 'comida']
        },
        {
            key: 'restaurante',
            keywords: ['restaurante','cafeteria','terraza','bar', 'cafeteria', 'cafe', 'pizza', 'burger', 'mcdonalds', 'burger king', 'taco', 'sushi', 'comida rapida', 'fast food', 'takeaway', 'glovo', 'uber eats', 'just eat'],
            hints: ['restaurante', 'hosteleria', 'comida', 'ocio']
        },
        {
            key: 'combustible',
            keywords: ['gasolina', 'diesel', 'combustible', 'gasolinera', 'fuel', 'petroleo', 'repsol', 'cepsa', 'shell', 'bp'],
            hints: ['combustible', 'gasolina', 'transporte']
        },
        {
            key: 'transporte',
            keywords: ['taxi', 'uber', 'cabify', 'transporte', 'bus', 'metro', 'tren', 'train', 'parking', 'peaje', 'autobus', 'estacionamiento', 'renfe'],
            hints: ['transporte', 'movilidad', 'viajes']
        },
        {
            key: 'farmacia',
            keywords: ['farmacia', 'farmac', 'medicina', 'medicinas', 'pharmacy', 'medicament'],
            hints: ['farmacia', 'salud', 'medicina']
        },
        {
            key: 'salud',
            keywords: ['hospital', 'medico', 'doctor', 'dentista', 'salud', 'health', 'clinic', 'clinica', 'seguros medicos'],
            hints: ['salud', 'medicina']
        },
        {
            key: 'vivienda',
            keywords: ['alquiler', 'hipoteca', 'electricidad', 'agua', 'gas', 'luz', 'iberdrola', 'endesa', 'naturgy', 'comunidad', 'suministros'],
            hints: ['vivienda', 'hogar', 'suministros']
        },
        {
            key: 'ropa',
            keywords: ['ropa', 'zapatos', 'clothing', 'dress', 'shirt', 'pants', 'zapatilla', 'zara', 'h&m', 'pull and bear', 'stradivarius'],
            hints: ['ropa', 'moda']
        },
        {
            key: 'entretenimiento',
            keywords: ['cine', 'pelicula', 'concert', 'concierto', 'spotify', 'netflix', 'hbo', 'prime video', 'juego', 'gaming', 'ocio'],
            hints: ['entretenimiento', 'ocio']
        },
        {
            key: 'salario',
            keywords: ['salario', 'sueldo', 'nomina', 'salary', 'wage', 'pago', 'payroll'],
            hints: ['salario', 'nomina', 'ingreso']
        },
        {
            key: 'freelance',
            keywords: ['freelance', 'proyecto', 'factura', 'invoice', 'trabajo', 'job', 'consultoria', 'honorarios'],
            hints: ['freelance', 'servicios', 'ingreso']
        },
        {
            key: 'transferencia',
            keywords: ['transferencia', 'transfer', 'deposito', 'deposit', 'abono', 'ingreso'],
            hints: ['transferencia', 'ingreso']
        }
    ];

    const tokensConcepto = new Set(conceptoNorm.split(' ').filter(Boolean));

    // Sistema de puntuación acumulativa
    let mejor = null;
    let mejorScore = 0;

    for (const cat of categoriasNorm) {
        let score = 0;

        // A) Coincidencia directa en nombre
        if (coincideNombre(conceptoNorm, cat.nombreNorm)) {
            score += 5;
        }

        // B) Coincidencias por keywords + hints
        for (const group of keywordGroups) {
            const hits = group.keywords.some(k => coincideKeyword(conceptoNorm, k));
            if (hits) {
                const hintHit = group.hints.some(h => coincideHint(cat.nombreNorm, h));
                if (hintHit) score += 3;
            }
        }

        // C) Coincidencias por tokens
        cat.tokens.forEach(t => {
            if (tokensConcepto.has(t)) score += 1;
        });

        if (score > mejorScore) {
            mejorScore = score;
            mejor = cat;
        }
    }

    if (mejor && mejorScore > 0) {
        console.log(`✅ Auto-detectada categoría por score para "${concepto}": ${mejor.nombre} (score ${mejorScore})`);
        return mejor.id;
    }

    return null;
}

async function guardarEnBaseDatos() {
    if (!estadoImportacion.datosMapados || estadoImportacion.datosMapados.length === 0) {
        showAlert('⚠️ No hay datos mapeados para guardar', 'warning');
        return;
    }

    // Obtener categorías seleccionadas por concepto
    let { categoriasSeleccionadas, sinSeleccionar } = obtenerCategoriasSeleccionadasDesdeTabla();
    if (!Object.keys(categoriasSeleccionadas).length && estadoImportacion.categoriasPorConcepto) {
        categoriasSeleccionadas = { ...estadoImportacion.categoriasPorConcepto };
        sinSeleccionar = [];
    }

    // Validar que todas las categorías estén seleccionadas
    if (sinSeleccionar.length > 0) {
        showAlert('⚠️ Por favor selecciona categoría para todos los conceptos', 'warning');
        return;
    }

    persistirRevisionConceptoCategoria(categoriasSeleccionadas);

    // Separar en gastos e ingresos con sus categorías
    const datosGastos = [];
    const datosIngresos = [];

    const archivoOrigen = estadoImportacion.nombreArchivoOrigen
        || estadoImportacion.archivoActual?.name
        || estadoImportacion.archivoId
        || 'importacion_bancaria';

    const conceptosFiltrados = (estadoImportacion.conceptosSeleccionados && estadoImportacion.conceptosSeleccionados.length > 0)
        ? estadoImportacion.datosMapados.filter(d => estadoImportacion.conceptosSeleccionados.includes(d.concepto || 'Sin concepto'))
        : estadoImportacion.datosMapados;

    conceptosFiltrados.forEach(d => {
        const concepto = d.concepto || 'Sin concepto';
        const conceptoKey = normalizarTexto(concepto) || 'sin-concepto';
        const categoriaId = categoriasSeleccionadas[conceptoKey];

        if (!categoriaId) {
            console.warn(`⚠️ No hay categoría para concepto: ${concepto}`);
            return; // Saltar este registro
        }

        const registro = {
            fecha: d.fecha ? d.fecha.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            descripcion: d.concepto,
            monto: d.importe,
            categoria_id: categoriaId,
            archivo_origen: archivoOrigen
        };

        if (d.tipo === 'gasto') {
            datosGastos.push(registro);
        } else if (d.tipo === 'ingreso') {
            datosIngresos.push(registro);
        }
    });

    console.log(`📊 Guardando ${datosGastos.length} gastos y ${datosIngresos.length} ingresos`);

    try {
        const promesas = [];

        // Guardar gastos
        if (datosGastos.length > 0) {
            promesas.push(
                fetch('/import/gasto_real', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ datos: datosGastos })
                })
            );
        }

        // Guardar ingresos
        if (datosIngresos.length > 0) {
            promesas.push(
                fetch('/import/ingreso_real', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ datos: datosIngresos })
                })
            );
        }

        const respuestas = await Promise.all(promesas);
        
        let exitosos = 0;
        let fallidos = 0;
        let mensajeError = '';

        for (const res of respuestas) {
            const data = await res.json();
            if (data.success || res.ok) {
                exitosos += data.exitosos || 0;
                fallidos += data.fallidos || 0;
            } else {
                mensajeError = data.error || 'Error desconocido';
                fallidos += datosGastos.length + datosIngresos.length;
            }
        }

        const total = exitosos + fallidos;
        const mensaje = `✅ Guardados: ${exitosos}/${total} registros`;
        
        if (fallidos > 0) {
            showAlert(`${mensaje}\n⚠️ Fallidos: ${fallidos}\n${mensajeError ? '❌ ' + mensajeError : ''}`, 'warning');
        } else {
            showAlert(mensaje, 'success');
        }

        console.log(`✅ Importación completada: ${exitosos} exitosos, ${fallidos} fallidos`);

        // Actualizar el resumen después de guardar
        if (typeof cargarResumenPeriodos === 'function') {
            cargarResumenPeriodos();
        }

    } catch (error) {
        console.error('❌ Error guardando en BD:', error);
        showAlert(`❌ ${error.message || error}`, 'error');
    }
}

function mostrarSeccion(seccion) {
    // Ocultar todas las secciones
    const uploadSection = document.getElementById('uploadSection');
    const mapeoSection = document.getElementById('mapeoSection');
    const analisisSection = document.getElementById('analisisSection');
    const archivosSection = document.getElementById('archivosSection');
    const seleccionConceptosSection = document.getElementById('seleccionConceptosSection');
    const seleccionCategoriasSection = document.getElementById('seleccionCategoriasSection');
    
    if (uploadSection) uploadSection.style.display = 'none';
    if (mapeoSection) mapeoSection.style.display = 'none';
    if (analisisSection) analisisSection.style.display = 'none';
    if (archivosSection) archivosSection.style.display = 'none';
    if (seleccionConceptosSection) seleccionConceptosSection.style.display = 'none';
    if (seleccionCategoriasSection) seleccionCategoriasSection.style.display = 'none';

    // Mostrar la sección solicitada
    switch(seccion) {
        case 'upload':
            if (uploadSection) uploadSection.style.display = 'block';
            break;
        case 'mapeo':
            if (mapeoSection) mapeoSection.style.display = 'block';
            break;
        case 'seleccionConceptos':
            if (seleccionConceptosSection) seleccionConceptosSection.style.display = 'block';
            break;
        case 'seleccionCategorias':
            if (seleccionCategoriasSection) seleccionCategoriasSection.style.display = 'block';
            break;
        case 'analisis':
            if (analisisSection) analisisSection.style.display = 'block';
            // Asegurar que los canvas están visibles
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
            break;
        case 'archivos':
            if (archivosSection) archivosSection.style.display = 'block';
            break;
    }
    
    // Guardar la sección actual para cuando se vuelva a abrir la pestaña
    estadoImportacion.seccionActual = seccion;
    actualizarWizard(seccion);
    console.log('📍 Sección guardada:', seccion);
}

function resetearImportacion() {
    console.log('🔄 Reseteando importación...');
    
    // Destruir gráficos existentes
    Object.values(estadoImportacion.charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    
    // Resetear estado
    estadoImportacion = {
        archivoActual: null,
        nombreArchivoOrigen: null,
        datosRaw: [],
        datosMapados: [],
        datosMapadosValidos: [],
        datosMapadosInvalidos: [],
        datosAnalisisActual: [],
        columnas: [],
        mapeo: { fecha: null, concepto: null, importe: null, tipo: null },
        formatoFecha: 'DD/MM/YYYY',
        charts: {},
        seccionActual: 'upload',
        archivoNuevo: true,
        archivoId: null,
        archivoGuardado: false,
        conceptosSeleccionados: [],
        categoriasPorConcepto: {},
        metaConceptosCategorias: {},
        tableFilter: 'gasto',
        presetSeleccionado: null
    };
    
    // Actualizar referencia global
    window.estadoImportacion = estadoImportacion;
    
    document.getElementById('fileInput').value = '';
    const validacion = document.getElementById('validacionMapeo');
    if (validacion) validacion.style.display = 'none';
    actualizarWizard('upload');
    console.log('✅ Importación reseteada');
}

/**
 * FUNCIONES PARA MANEJAR ARCHIVOS GUARDADOS
 */

async function cargarListadoArchivos() {
    try {
        console.log('📋 Cargando listado de archivos...');
        const response = await fetch('/api/importacion/listar');
        const data = await response.json();

        if (!data.success) {
            showAlert('❌ ' + t('importacion.errorCargandoArchivos') + ': ' + data.error, 'error');
            return;
        }

        console.log('📋 Archivos recibidos:', data.archivos);

        const listadoArchivos = document.getElementById('listadoArchivos');
        
        if (!listadoArchivos) return;

        if (!data.archivos || data.archivos.length === 0) {
            listadoArchivos.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">${t('importacion.noArchivos')}</p>`;
            return;
        }

        listadoArchivos.innerHTML = '';
        
        data.archivos.forEach(archivo => {
            console.log('📄 Procesando archivo:', archivo);
            const elemento = crearElementoArchivo(archivo);
            listadoArchivos.appendChild(elemento);
        });

        console.log(`✅ Se cargaron ${data.archivos.length} archivos`);
    } catch (error) {
        console.error('❌ Error cargando archivos:', error);
        showAlert('❌ ' + t('importacion.errorCargandoArchivos') + ': ' + error.message, 'error');
    }
}

function escapeHtml(texto) {
    return String(texto || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function crearElementoArchivo(archivo) {
    const div = document.createElement('div');
    div.className = 'archivo-item';
    
    const fecha = new Date(archivo.fechaGuardado).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const tamaño = (archivo.tamaño / 1024).toFixed(2) + ' KB';

    div.innerHTML = `
        <div class="archivo-info">
            <div class="archivo-nombre">
                <i class="fas fa-file-excel"></i> ${escapeHtml(archivo.nombre)}
            </div>
            <div class="archivo-detalles">
                <span class="archivo-fecha">
                    <i class="fas fa-calendar"></i> ${fecha}
                </span>
                <span class="archivo-tamaño">
                    <i class="fas fa-weight"></i> ${tamaño}
                </span>
            </div>
        </div>
        <div class="archivo-acciones">
            <button class="btn-archivo btn-cargar" data-action="cargar" data-id="${escapeHtml(archivo.id)}" data-nombre="${escapeHtml(archivo.nombre)}">
                <i class="fas fa-upload"></i> ${t('importacion.btnCargar')}
            </button>
            <button class="btn-archivo btn-descargar" data-action="descargar" data-id="${escapeHtml(archivo.id)}" data-nombre="${escapeHtml(archivo.nombre)}">
                <i class="fas fa-download"></i> ${t('importacion.btnDescargar')}
            </button>
            <button class="btn-archivo btn-eliminar" data-action="eliminar" data-id="${escapeHtml(archivo.id)}" data-nombre="${escapeHtml(archivo.nombre)}">
                <i class="fas fa-trash"></i> ${t('importacion.btnEliminar')}
            </button>
        </div>
    `;

    return div;
}

async function cargarArchivoGuardado(archivoId) {
    try {
        console.log('📖 Cargando archivo guardado:', archivoId);
        showInfoToast('⏳ ' + t('importacion.cargandoArchivo'));
        
        const response = await fetch(`/api/importacion/contenido/${archivoId}`);
        const data = await response.json();

        if (!data.success) {
            showErrorToast('❌ ' + t('importacion.errorCargandoArchivo') + ': ' + data.error);
            return;
        }

        // Convertir base64 a ArrayBuffer
        const binary = atob(data.contenido);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        // Crear un Blob y simular un File
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        const file = new File([blob], data.nombre, { type: 'application/octet-stream' });

        estadoImportacion.nombreArchivoOrigen = data.nombre || data.archivo || archivoId;

        // Procesar el archivo como si fuera cargado manualmente
        console.log('✅ Archivo cargado, procesando...');
        
        // Marcar que este es un archivo cargado, NO uno nuevo
        // Esto evita que se guarde automáticamente en actualizarAnalisis()
        estadoImportacion.archivoNuevo = false;
        estadoImportacion.archivoId = archivoId;
        console.log('📌 Archivo marcado como CARGADO (no será re-guardado)');
        
        const nombreArchivo = (data.nombre || '').toLowerCase();
        const extension = nombreArchivo.includes('.') ? nombreArchivo.split('.').pop() : '';

        if (extension === 'csv') {
            leerCSV(file);
        } else if (extension === 'xls' || extension === 'xlsx') {
            leerExcel(file);
        } else if (data.tipo === '.csv') {
            leerCSV(file);
        } else {
            leerExcel(file);
        }

        // Aviso de éxito eliminado por requerimiento
    } catch (error) {
        console.error('❌ Error cargando archivo:', error);
        showErrorToast('❌ ' + t('importacion.errorCargandoArchivo') + ': ' + error.message);
    }
}

async function descargarArchivo(archivoId) {
    try {
        console.log('📥 Descargando archivo:', archivoId);
        window.location.href = `/api/importacion/descargar/${archivoId}`;
    } catch (error) {
        console.error('❌ Error descargando archivo:', error);
        showAlert('❌ ' + t('importacion.errorDescargandoArchivo') + ': ' + error.message, 'error');
    }
}

async function eliminarArchivo(archivoId, nombreArchivo) {
    const confirmar = (typeof window.showConfirm === 'function')
        ? await window.showConfirm(`${t('importacion.confirmEliminar')} "${nombreArchivo}"?`, 'Confirmar')
        : confirm(`${t('importacion.confirmEliminar')} "${nombreArchivo}"?`);
    if (!confirmar) {
        return;
    }

    try {
        console.log('🗑️ Eliminando archivo:', archivoId);
        showInfoToast('⏳ ' + t('importacion.eliminandoArchivo'));

        const response = await fetch(`/api/importacion/eliminar/${archivoId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!data.success) {
            showErrorToast('❌ ' + t('importacion.errorEliminandoArchivo') + ': ' + data.error);
            return;
        }

        console.log('✅ Archivo eliminado');
        showSuccessToast('✅ ' + tt('importacion.archivoEliminado', 'Archivo eliminado'));
        // Aviso de éxito eliminado por requerimiento
        
        // Recargar listado
        await cargarListadoArchivos();
    } catch (error) {
        console.error('❌ Error eliminando archivo:', error);
        showErrorToast('❌ ' + t('importacion.errorEliminandoArchivo') + ': ' + error.message);
    }
}

async function guardarDatosEnServidor(nombre) {
    if (!estadoImportacion.datosRaw || estadoImportacion.datosRaw.length === 0) {
        console.warn('⚠️ No hay datos para guardar');
        return;
    }

    try {
        console.log('💾 Guardando archivo en servidor:', nombre);
        showInfoToast('⏳ ' + t('importacion.guardandoArchivo'));

        // Convertir datos a CSV
        const csv = convertirDatosACSV(estadoImportacion.datosRaw);
        console.log('📝 CSV generado, tamaño:', csv.length, 'bytes');
        console.log('📊 Primeras líneas:', csv.split('\n').slice(0, 3));

        // Crear FormData con Blob
        const formData = new FormData();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const nombreArchivo = nombre.replace(/\.[^/.]+$/, '') + '.csv'; // Asegurar extensión .csv
        
        formData.append('archivo', blob, nombreArchivo);
        formData.append('nombre', nombreArchivo);

        console.log('📤 Enviando FormData:', { 
            nombreArchivo, 
            blobSize: blob.size,
            contentType: blob.type 
        });

        const response = await fetch('/api/importacion/guardar', {
            method: 'POST',
            body: formData
        });

        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📨 Response data:', data);

        if (!data.success) {
            console.error('❌ Error del servidor:', data.error);
            return;
        }

        console.log('✅ Archivo guardado en servidor:', data.archivo);
        estadoImportacion.archivoGuardado = true;
        
        // Recargar listado silenciosamente
        await cargarListadoArchivos();
    } catch (error) {
        console.error('❌ Error guardando en servidor:', error);
        console.error('Error stack:', error.stack);
    }
}

async function guardarArchivoActual(nombre) {
    if (!estadoImportacion.datosRaw || estadoImportacion.datosRaw.length === 0) {
        showAlert('⚠️ ' + t('importacion.errorSinDatos'), 'info');
        return;
    }

    try {
        console.log('💾 Guardando archivo actual...');
        showInfoToast('⏳ ' + t('importacion.guardandoArchivo'));

        // Convertir datos a CSV
        const csv = convertirDatosACSV(estadoImportacion.datosRaw);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const nombreArchivo = nombre.replace(/\.[^/.]+$/, '') + '.csv';

        const formData = new FormData();
        formData.append('archivo', blob, nombreArchivo);
        formData.append('nombre', nombreArchivo);

        const response = await fetch('/api/importacion/guardar', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!data.success) {
            showErrorToast('❌ ' + t('importacion.errorGuardandoArchivo') + ': ' + data.error);
            return;
        }

        console.log('✅ Archivo guardado');
        // Aviso de éxito eliminado por requerimiento
        
        // Recargar listado
        await cargarListadoArchivos();
    } catch (error) {
        console.error('❌ Error guardando archivo:', error);
        showErrorToast('❌ ' + t('importacion.errorGuardandoArchivo') + ': ' + error.message);
    }
}

function convertirDatosACSV(datos) {
    if (!datos || datos.length === 0) return '';

    const headers = Object.keys(datos[0]);
    const csv = [headers.join(',')];

    datos.forEach(fila => {
        const valores = headers.map(header => {
            const valor = fila[header] || '';
            // Escapar comillas en valores
            return `"${String(valor).replace(/"/g, '""')}"`;
        });
        csv.push(valores.join(','));
    });

    return csv.join('\n');
}

// Asegurarse de que se llama cuando se carga la pestaña
console.log('✅ Script importacionBancaria.js cargado');
