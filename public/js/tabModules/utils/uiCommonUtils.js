(function initTabUiCommonUtils(global) {
    if (global.TabUiCommonUtils) return;

    function getText(key, fallback) {
        if (typeof global.gestorIdiomas !== 'undefined') {
            const text = global.gestorIdiomas.obtenerTexto(key);
            if (text !== key) return text;
        }
        return fallback || key;
    }

    function formatCurrencyNoConvert(monto) {
        if (typeof global.formatCurrency === 'function') {
            return global.formatCurrency(monto, { convert: false });
        }
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(Number(monto) || 0);
    }

    function parseLocaleAmount(str) {
        if (!str) return 0;
        let cleaned = String(str).replace(/[^\d.,-]/g, '');
        const lastComma = cleaned.lastIndexOf(',');
        const lastDot = cleaned.lastIndexOf('.');
        if (lastComma > lastDot) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
            cleaned = cleaned.replace(/,/g, '');
        }
        return parseFloat(cleaned) || 0;
    }

    global.TabUiCommonUtils = {
        getText,
        formatCurrencyNoConvert,
        parseLocaleAmount
    };
}(window));
