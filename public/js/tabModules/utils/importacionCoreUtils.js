(function initImportacionCoreUtils(global) {
    if (global.ImportacionCoreUtils) return;

    function obtenerTraduccion(clave) {
        try {
            const idioma = global.idiomaActual || 'es';
            const partes = String(clave || '').split('.');
            let valor = global.traducciones && global.traducciones[idioma] ? global.traducciones[idioma] : {};

            for (const parte of partes) {
                valor = valor ? valor[parte] : null;
                if (!valor) break;
            }

            return typeof valor === 'string' ? valor : clave;
        } catch (error) {
            console.error('Error obteniendo traducción:', clave, error);
            return clave;
        }
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

    function inferirTipo(normalizarTextoFn, valorTipo, importe) {
        const normalizarTexto = typeof normalizarTextoFn === 'function'
            ? normalizarTextoFn
            : (v) => (v || '').toString().toLowerCase().trim();
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

    function obtenerFingerprintColumnas(normalizarTextoFn, columnas) {
        const normalizarTexto = typeof normalizarTextoFn === 'function'
            ? normalizarTextoFn
            : (v) => (v || '').toString().toLowerCase().trim();
        return (Array.isArray(columnas) ? columnas : []).map((c) => normalizarTexto(c)).sort().join('|');
    }

    function obtenerStorageJson(key, fallbackValue) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallbackValue;
            return JSON.parse(raw);
        } catch (_) {
            return fallbackValue;
        }
    }

    function guardarStorageJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    global.ImportacionCoreUtils = {
        obtenerTraduccion,
        parseImporte,
        inferirTipo,
        obtenerFingerprintColumnas,
        obtenerStorageJson,
        guardarStorageJson
    };
}(window));
