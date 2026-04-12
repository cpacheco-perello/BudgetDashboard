(function initImportacionCategoriaUtils(global) {
    if (global.ImportacionCategoriaUtils) return;

    const textUtils = global.TabTextUtils || {};
    const normalizarTexto = typeof textUtils.normalizarTexto === 'function'
        ? textUtils.normalizarTexto
        : (texto) => (texto || '').toString().toLowerCase().trim();
    const coincideKeyword = typeof textUtils.coincideKeyword === 'function'
        ? textUtils.coincideKeyword
        : (textoNorm, keyword) => textoNorm.includes(normalizarTexto(keyword));
    const coincideNombre = typeof textUtils.coincideNombre === 'function'
        ? textUtils.coincideNombre
        : (textoNorm, nombreNorm) => textoNorm.includes(nombreNorm);
    const coincideHint = typeof textUtils.coincideHint === 'function'
        ? textUtils.coincideHint
        : (nombreNorm, hint) => nombreNorm.includes(normalizarTexto(hint));

    function prepararCategorias(categorias) {
        return categorias.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            nombreNorm: normalizarTexto(c.nombre),
            tokens: new Set(normalizarTexto(c.nombre).split(' ').filter(Boolean))
        }));
    }

    function crearMapaConceptosGuardados(dashboardData, tipo) {
        const mapa = new Map();
        if (!dashboardData) return mapa;

        const items = [];
        if (tipo === 'gasto') {
            items.push(...(dashboardData.gastos_reales || []));
        } else if (tipo === 'ingreso') {
            items.push(...(dashboardData.ingresos_reales || []));
        }

        items.forEach((item) => {
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
                keywords: ['restaurante', 'cafeteria', 'terraza', 'bar', 'cafeteria', 'cafe', 'pizza', 'burger', 'mcdonalds', 'burger king', 'taco', 'sushi', 'comida rapida', 'fast food', 'takeaway', 'glovo', 'uber eats', 'just eat'],
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
        let mejor = null;
        let mejorScore = 0;

        for (const cat of categoriasNorm) {
            let score = 0;

            if (coincideNombre(conceptoNorm, cat.nombreNorm)) {
                score += 5;
            }

            for (const group of keywordGroups) {
                const hits = group.keywords.some((k) => coincideKeyword(conceptoNorm, k));
                if (hits) {
                    const hintHit = group.hints.some((h) => coincideHint(cat.nombreNorm, h));
                    if (hintHit) score += 3;
                }
            }

            cat.tokens.forEach((t) => {
                if (tokensConcepto.has(t)) score += 1;
            });

            if (score > mejorScore) {
                mejorScore = score;
                mejor = cat;
            }
        }

        return (mejor && mejorScore > 0) ? mejor.id : null;
    }

    function obtenerCategoriaDesdeMemoriaUsuario(concepto, tipo, categorias, revisionGuardada) {
        if (!concepto || !tipo || !Array.isArray(categorias) || categorias.length === 0) return null;

        const memoriaTipo = revisionGuardada?.[tipo];
        if (!memoriaTipo || typeof memoriaTipo !== 'object') return null;

        const categoriaIdsValidos = new Set(categorias.map((c) => Number(c.id)));
        const conceptoNorm = normalizarTexto(concepto);
        const conceptoKey = conceptoNorm || 'sin-concepto';

        const directa = Number(memoriaTipo[conceptoKey]);
        if (categoriaIdsValidos.has(directa)) {
            return directa;
        }

        const tokensConcepto = new Set(conceptoNorm.split(' ').filter(Boolean));
        let mejorCategoria = null;
        let mejorScore = 0;

        Object.entries(memoriaTipo).forEach(([keyMemoria, categoriaId]) => {
            const categoriaNum = Number(categoriaId);
            if (!categoriaIdsValidos.has(categoriaNum)) return;

            const memoriaNorm = normalizarTexto(keyMemoria);
            if (!memoriaNorm) return;

            let score = 0;
            if (conceptoNorm.includes(memoriaNorm) || memoriaNorm.includes(conceptoNorm)) {
                score += 3;
            }

            const tokensMemoria = memoriaNorm.split(' ').filter(Boolean);
            tokensMemoria.forEach((token) => {
                if (tokensConcepto.has(token)) {
                    score += 1;
                }
            });

            if (score > mejorScore) {
                mejorScore = score;
                mejorCategoria = categoriaNum;
            }
        });

        return mejorScore >= 2 ? mejorCategoria : null;
    }

    function resolverCategoriaSugerida(concepto, tipo, categorias, revisionGuardada, mapaGuardados) {
        const sugeridaMemoria = obtenerCategoriaDesdeMemoriaUsuario(concepto, tipo, categorias, revisionGuardada);
        if (sugeridaMemoria) {
            return { categoriaId: Number(sugeridaMemoria), origen: 'memoria_usuario' };
        }

        const conceptoKey = normalizarTexto(concepto);
        const guardado = mapaGuardados?.get(conceptoKey);
        if (guardado) {
            const catGuardada = categorias.find((c) => normalizarTexto(c.nombre) === normalizarTexto(guardado));
            if (catGuardada) {
                return { categoriaId: Number(catGuardada.id), origen: 'historico_dashboard' };
            }
        }

        const sugeridaStrings = detectarCategoriaAutomatica(concepto, categorias);
        if (sugeridaStrings) {
            return { categoriaId: Number(sugeridaStrings), origen: 'strings' };
        }

        return { categoriaId: null, origen: null };
    }

    global.ImportacionCategoriaUtils = {
        prepararCategorias,
        crearMapaConceptosGuardados,
        detectarCategoriaAutomatica,
        obtenerCategoriaDesdeMemoriaUsuario,
        resolverCategoriaSugerida
    };
}(window));
