(function initTabCategoryService(global) {
    if (global.TabCategoryService) return;

    async function fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed: ${url} (${response.status})`);
        }
        return response.json();
    }

    function buildPeriodoUrl(desde, hasta) {
        const params = new URLSearchParams({ desde, hasta });
        return `/categorias-periodo?${params.toString()}`;
    }

    async function fetchCategorias() {
        return fetchJson('/categorias');
    }

    async function fetchCategoriasConFallbackPeriodo(desde, hasta) {
        try {
            return await fetchCategorias();
        } catch (error) {
            if (!desde || !hasta) throw error;
            return fetchJson(buildPeriodoUrl(desde, hasta));
        }
    }

    global.TabCategoryService = {
        fetchCategorias,
        fetchCategoriasConFallbackPeriodo
    };
}(window));
