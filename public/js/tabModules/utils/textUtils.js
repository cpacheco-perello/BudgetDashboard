(function initTabTextUtils(global) {
    if (global.TabTextUtils) return;

    const normalizarTexto = (texto) => (texto || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const escapeHtml = (texto) => String(texto || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const escapeRegExp = (texto) => String(texto || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

    global.TabTextUtils = {
        normalizarTexto,
        escapeHtml,
        escapeRegExp,
        contienePalabra,
        coincideKeyword,
        coincideNombre,
        coincideHint
    };
}(window));
