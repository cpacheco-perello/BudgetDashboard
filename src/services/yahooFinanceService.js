// fetch nativo en Node.js 18+ (no necesita polyfill)
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Caché de tasa de cambio USD->EUR (se actualiza cada hora)
let exchangeRate = 0.92;
let exchangeRateTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

// Cachés en memoria para precios e históricos
const PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const HISTORY_CACHE_DURATION = 30 * 60 * 1000; // 30 minutos
const priceCache = new Map();
const historicalCache = new Map();

// Control de ruido de logs para tickers inválidos/no disponibles
const failedTickerLogCache = new Map();
const FAILED_TICKER_LOG_TTL = 10 * 60 * 1000; // 10 minutos

const EXCHANGE_SUFFIXES = ['.F', '.DE', '.MI', '.PA', '.AS', '.MC', '.L', '.SW', '.BR', '.AT', '.BE', '.HK'];

// Alias manuales para tickers abreviados/frecuentes en brokers.
const TICKER_ALIASES = {
    '3CP': ['3CP.F', '1810.HK'],
    '82W': ['HIMS'],
    'ABEA': ['GOOG', 'GOOGL'],
    'AMZ': ['AMZN']
};

const CURRENCY_ALIASES = {
    GBX: 'GBP',
    GBP: 'GBP',
    GBp: 'GBP',
    US$: 'USD',
    HK$: 'HKD'
};

const SUBUNIT_DIVISOR_BY_CURRENCY = {
    GBX: 100,
    GBp: 100
};

const STOOQ_MARKET_MAP = {
    '.HK': { stooqSuffix: '.HK', currency: 'HKD' },
    '.F': { stooqSuffix: '.DE', currency: 'EUR' },
    '.DE': { stooqSuffix: '.DE', currency: 'EUR' },
    '.MI': { stooqSuffix: '.IT', currency: 'EUR' },
    '.PA': { stooqSuffix: '.FR', currency: 'EUR' },
    '.AS': { stooqSuffix: '.NL', currency: 'EUR' },
    '.MC': { stooqSuffix: '.ES', currency: 'EUR' },
    '.L': { stooqSuffix: '.UK', currency: 'GBP' },
    '.SW': { stooqSuffix: '.CH', currency: 'CHF' },
    '.BR': { stooqSuffix: '.BE', currency: 'EUR' },
    '.AT': { stooqSuffix: '.AT', currency: 'EUR' },
    '.BE': { stooqSuffix: '.BE', currency: 'EUR' },
    '.US': { stooqSuffix: '.US', currency: 'USD' }
};

function shouldLogTickerFailure(ticker) {
    const now = Date.now();
    const last = failedTickerLogCache.get(ticker) || 0;
    if (now - last > FAILED_TICKER_LOG_TTL) {
        failedTickerLogCache.set(ticker, now);
        return true;
    }
    return false;
}

function normalizeCurrencyCode(currency) {
    const raw = String(currency || '').trim();
    if (!raw) {
        return '';
    }
    return CURRENCY_ALIASES[raw] || raw.toUpperCase();
}

function normalizeMonetaryAmountByCurrency(amount, currency) {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
        return null;
    }

    const rawCurrency = String(currency || '').trim();
    const divisor = SUBUNIT_DIVISOR_BY_CURRENCY[rawCurrency] || 1;
    return numericAmount / divisor;
}

function extractQuoteMarketPrice(quote) {
    if (!quote || typeof quote !== 'object') {
        return null;
    }

    const candidates = [
        quote.regularMarketPrice,
        quote.postMarketPrice,
        quote.preMarketPrice,
        quote.regularMarketPreviousClose,
        quote.previousClose
    ];

    for (const value of candidates) {
        const numeric = Number(value);
        if (Number.isFinite(numeric) && numeric > 0) {
            return numeric;
        }
    }

    return null;
}

function buildTickerCandidates(ticker) {
    const normalizedTicker = String(ticker || '').trim().toUpperCase();
    const candidates = [];
    const seen = new Set();

    const addCandidate = (symbol) => {
        const normalizedSymbol = String(symbol || '').trim().toUpperCase();
        if (!normalizedSymbol || seen.has(normalizedSymbol)) {
            return;
        }
        seen.add(normalizedSymbol);
        candidates.push(normalizedSymbol);
    };

    addCandidate(normalizedTicker);

    const aliases = TICKER_ALIASES[normalizedTicker] || [];
    aliases.forEach(addCandidate);

    if (!normalizedTicker.includes('.')) {
        EXCHANGE_SUFFIXES.forEach((suffix) => addCandidate(`${normalizedTicker}${suffix}`));
    }

    return candidates;
}

function looksLikeProviderInfrastructureError(error) {
    const message = String(error?.message || '').toLowerCase();
    if (!message) {
        return false;
    }

    return (
        message.includes('unexpected redirect') ||
        message.includes('unauthorized') ||
        message.includes('no set-cookie header') ||
        message.includes('fetch failed') ||
        message.includes('timed out') ||
        message.includes('econnreset') ||
        message.includes('enotfound') ||
        message.includes('socket')
    );
}

function mapYahooTickerToStooqCandidate(yahooTicker) {
    const normalizedTicker = String(yahooTicker || '').trim().toUpperCase();
    if (!normalizedTicker) {
        return null;
    }

    const suffixIndex = normalizedTicker.lastIndexOf('.');
    if (suffixIndex <= 0) {
        return {
            stooqSymbol: `${normalizedTicker}.US`.toLowerCase(),
            resolvedTicker: normalizedTicker,
            currency: 'USD'
        };
    }

    const base = normalizedTicker.slice(0, suffixIndex);
    const suffix = normalizedTicker.slice(suffixIndex);
    const marketConfig = STOOQ_MARKET_MAP[suffix];
    if (!marketConfig) {
        return null;
    }

    return {
        stooqSymbol: `${base}${marketConfig.stooqSuffix}`.toLowerCase(),
        resolvedTicker: normalizedTicker,
        currency: marketConfig.currency
    };
}

function buildStooqCandidates(ticker) {
    const yahooCandidates = buildTickerCandidates(ticker);
    const stooqCandidates = [];
    const seen = new Set();

    for (const yahooCandidate of yahooCandidates) {
        const mapped = mapYahooTickerToStooqCandidate(yahooCandidate);
        if (!mapped || seen.has(mapped.stooqSymbol)) {
            continue;
        }
        seen.add(mapped.stooqSymbol);
        stooqCandidates.push(mapped);
    }

    return stooqCandidates;
}

function parseStooqCsvRows(csvText) {
    const text = String(csvText || '').trim();
    if (!text) {
        return [];
    }

    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

function parseStooqNumeric(value) {
    const numeric = Number(String(value || '').trim());
    return Number.isFinite(numeric) ? numeric : null;
}

async function fetchStooqQuote(ticker) {
    const candidates = buildStooqCandidates(ticker);

    for (const candidate of candidates) {
        try {
            const url = `https://stooq.com/q/l/?s=${encodeURIComponent(candidate.stooqSymbol)}&f=sd2t2ohlcv&h&e=csv`;
            const response = await fetch(url, {
                headers: {
                    accept: 'text/csv,*/*;q=0.8',
                    'user-agent': 'Mozilla/5.0'
                }
            });
            if (!response.ok) {
                continue;
            }

            const csv = await response.text();
            const rows = parseStooqCsvRows(csv);
            if (rows.length < 2) {
                continue;
            }

            const columns = rows[1].split(',').map((value) => value.trim());
            if (columns.length < 7) {
                continue;
            }

            const close = parseStooqNumeric(columns[6]);
            if (!Number.isFinite(close) || close <= 0) {
                continue;
            }

            return {
                candidate: candidate.resolvedTicker,
                quote: { currency: candidate.currency },
                marketPrice: close,
                source: 'stooq'
            };
        } catch (error) {
            if (shouldLogTickerFailure(candidate.stooqSymbol)) {
                console.log(`INFO ${candidate.stooqSymbol} no disponible en stooq: ${error.message}`);
            }
        }
    }

    return null;
}

async function fetchStooqHistorical(ticker, startDate, endDate) {
    const candidates = buildStooqCandidates(ticker);

    for (const candidate of candidates) {
        try {
            const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(candidate.stooqSymbol)}&i=d`;
            const response = await fetch(url, {
                headers: {
                    accept: 'text/csv,*/*;q=0.8',
                    'user-agent': 'Mozilla/5.0'
                }
            });
            if (!response.ok) {
                continue;
            }

            const csv = await response.text();
            const rows = parseStooqCsvRows(csv);
            if (rows.length < 2) {
                continue;
            }

            const data = [];
            for (let i = 1; i < rows.length; i += 1) {
                const columns = rows[i].split(',').map((value) => value.trim());
                if (columns.length < 5) {
                    continue;
                }

                const rowDate = new Date(columns[0]);
                const close = parseStooqNumeric(columns[4]);
                if (!Number.isFinite(close) || close <= 0 || Number.isNaN(rowDate.getTime())) {
                    continue;
                }

                if (rowDate < startDate || rowDate > endDate) {
                    continue;
                }

                data.push({
                    date: rowDate,
                    close
                });
            }

            if (data.length > 0) {
                return {
                    candidate: candidate.resolvedTicker,
                    currency: candidate.currency,
                    data
                };
            }
        } catch (error) {
            if (shouldLogTickerFailure(candidate.stooqSymbol)) {
                console.log(`INFO historico ${candidate.stooqSymbol} falló en stooq: ${error.message}`);
            }
        }
    }

    return null;
}

async function quoteFirstAvailablePrice(ticker) {
    const candidates = buildTickerCandidates(ticker);
    let hadInfrastructureError = false;

    for (const candidate of candidates) {
        try {
            const quote = await yahooFinance.quote(candidate);
            const marketPrice = extractQuoteMarketPrice(quote);
            if (marketPrice) {
                return {
                    candidate,
                    quote,
                    marketPrice,
                    source: 'yahoo'
                };
            }
        } catch (e) {
            const isInfrastructureError = looksLikeProviderInfrastructureError(e);
            hadInfrastructureError = hadInfrastructureError || isInfrastructureError;
            if (shouldLogTickerFailure(candidate)) {
                console.log(`INFO ${candidate} no disponible: ${e.message}`);
            }
            // Si Yahoo está caído por consentimiento/redirección, no tiene sentido seguir probando sufijos.
            if (isInfrastructureError) {
                break;
            }
        }
    }

    const stooqQuote = await fetchStooqQuote(ticker);
    if (stooqQuote) {
        if (hadInfrastructureError) {
            console.warn(`WARN proveedor Yahoo no disponible para ${ticker}; usando stooq como respaldo`);
        } else {
            console.log(`INFO Yahoo sin datos para ${ticker}; usando stooq como respaldo`);
        }
        return stooqQuote;
    }

    return null;
}

function buildHistoricalCacheKey(ticker, period) {
    return `${ticker}::${period}`;
}

function getFreshCacheEntry(cacheMap, key, ttlMs) {
    const entry = cacheMap.get(key);
    if (!entry) {
        return null;
    }

    const now = Date.now();
    if ((now - entry.savedAt) <= ttlMs) {
        return entry;
    }

    return null;
}

function getAnyCacheEntry(cacheMap, key) {
    return cacheMap.get(key) || null;
}

function setCacheEntry(cacheMap, key, value) {
    const entry = {
        value,
        savedAt: Date.now()
    };
    cacheMap.set(key, entry);
    return entry;
}

function addCacheMetadata(payload, cacheEntry, cacheStatus, mensaje) {
    const response = {
        ...payload,
        fromCache: cacheStatus !== 'live',
        cacheStatus
    };

    if (cacheEntry && cacheEntry.savedAt) {
        response.cacheTimestamp = new Date(cacheEntry.savedAt).toISOString();
    }

    if (mensaje) {
        response.mensaje = mensaje;
    }

    return response;
}

/**
 * Obtiene la tasa de cambio USD a EUR
 */
async function obtenerTasaCambio() {
    const base = arguments[0] || 'USD';
    const target = arguments[1] || 'EUR';

    const normalizedBase = normalizeCurrencyCode(base) || 'USD';
    const normalizedTarget = normalizeCurrencyCode(target) || 'EUR';

    if (normalizedBase === normalizedTarget) {
        return 1;
    }

    const ahora = Date.now();
    const cacheKey = `${normalizedBase}->${normalizedTarget}`;

    if (cacheKey === 'USD->EUR' && exchangeRate > 0 && (ahora - exchangeRateTime) < CACHE_DURATION) {
        return exchangeRate;
    }

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(normalizedBase)}`);
        const data = await response.json();
        const rate = Number(data?.rates?.[normalizedTarget]);
        if (Number.isFinite(rate) && rate > 0) {
            if (cacheKey === 'USD->EUR') {
                exchangeRate = rate;
                exchangeRateTime = ahora;
            }
            console.log(`✅ Tasa de cambio actualizada: 1 ${normalizedBase} = ${rate} ${normalizedTarget}`);
            return rate;
        }
    } catch (e) {
        console.warn(`⚠️ No se pudo obtener tasa ${normalizedBase}->${normalizedTarget} en tiempo real`);
    }

    if (cacheKey === 'USD->EUR') {
        return exchangeRate;
    }

    return null;
}

async function convertPriceToEUR(amount, currency) {
    const normalizedCurrency = normalizeCurrencyCode(currency) || 'EUR';
    const normalizedAmount = normalizeMonetaryAmountByCurrency(amount, currency);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return null;
    }

    if (normalizedCurrency === 'EUR') {
        return normalizedAmount;
    }

    const rate = await obtenerTasaCambio(normalizedCurrency, 'EUR');
    if (!Number.isFinite(rate) || rate <= 0) {
        return null;
    }

    return normalizedAmount * rate;
}

/**
 * Obtiene el precio de un activo y lo convierte a EUR
 */
async function getAssetPrice(ticker) {
    const normalizedTicker = String(ticker || '').trim().toUpperCase();
    if (!normalizedTicker) {
        throw new Error('Ticker vacío');
    }

    const priceCacheKey = normalizedTicker;
    const freshCache = getFreshCacheEntry(priceCache, priceCacheKey, PRICE_CACHE_DURATION);
    if (freshCache) {
        return addCacheMetadata(freshCache.value, freshCache, 'cache-hit');
    }

    const resolved = await quoteFirstAvailablePrice(normalizedTicker);
    if (!resolved) {
        const staleCache = getAnyCacheEntry(priceCache, priceCacheKey);
        if (staleCache) {
            console.warn(`⚠️ Usando caché de precio para ${normalizedTicker} por fallo de proveedor`);
            return addCacheMetadata(
                staleCache.value,
                staleCache,
                'cache-fallback',
                'Mostrando último precio en caché por error temporal del proveedor'
            );
        }
        throw new Error('No se pudo obtener el precio');
    }

    const sourceCurrency = normalizeCurrencyCode(resolved.quote?.currency || 'USD') || 'USD';
    const priceEUR = await convertPriceToEUR(resolved.marketPrice, sourceCurrency);
    if (!Number.isFinite(priceEUR) || priceEUR <= 0) {
        const staleCache = getAnyCacheEntry(priceCache, priceCacheKey);
        if (staleCache) {
            console.warn(`⚠️ Usando caché de precio para ${normalizedTicker} por fallo de conversión`);
            return addCacheMetadata(
                staleCache.value,
                staleCache,
                'cache-fallback',
                'Mostrando último precio en caché por error temporal del proveedor'
            );
        }
        throw new Error(`No se pudo convertir precio de ${sourceCurrency} a EUR`);
    }

    if (resolved.candidate !== normalizedTicker) {
        console.log(`🔁 Ticker resuelto ${normalizedTicker} -> ${resolved.candidate}`);
    }

    const payload = {
        ticker: normalizedTicker,
        resolvedTicker: resolved.candidate,
        currentPrice: parseFloat(priceEUR.toFixed(2)),
        currency: 'EUR',
        originalPrice: resolved.marketPrice,
        originalCurrency: sourceCurrency
    };

    const savedEntry = setCacheEntry(priceCache, priceCacheKey, payload);
    return addCacheMetadata(payload, savedEntry, 'live');
}

/**
 * Obtiene datos históricos de un activo
 * @param {string} ticker - Símbolo del activo
 * @param {string} period - Período ('1mo', '3mo', '6mo', '1y', '2y', '5y')
 * @returns {Promise<Object>} Objeto con ticker, period, currency y data array
 */
async function getHistoricalData(ticker, period = '1y') {
    const normalizedTicker = String(ticker || '').trim().toUpperCase();
    if (!normalizedTicker) {
        throw new Error('Ticker vacío');
    }

    const historyCacheKey = buildHistoricalCacheKey(normalizedTicker, period);
    const freshCache = getFreshCacheEntry(historicalCache, historyCacheKey, HISTORY_CACHE_DURATION);
    if (freshCache) {
        return addCacheMetadata(freshCache.value, freshCache, 'cache-hit');
    }

    console.log(`📊 [getHistoricalData] Ticker: ${normalizedTicker}, Período: ${period}`);
    
    try {
        // Calcular fechas basadas en el período
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
            case '1mo':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case '3mo':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case '6mo':
                startDate.setMonth(startDate.getMonth() - 6);
                break;
            case '2y':
                startDate.setFullYear(startDate.getFullYear() - 2);
                break;
            case '5y':
                startDate.setFullYear(startDate.getFullYear() - 5);
                break;
            case '1y':
            default:
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
        }
        
        console.log(`📅 Desde: ${startDate.toISOString().split('T')[0]} Hasta: ${endDate.toISOString().split('T')[0]}`);
        
        const queryOptions = {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        };
        
        let result = null;
        let finalTicker = normalizedTicker;
        let inferredCurrency = null;
        let hadInfrastructureError = false;
        const candidates = buildTickerCandidates(normalizedTicker);

        for (const candidate of candidates) {
            try {
                console.log(`🔍 Intentando histórico con: ${candidate}`);
                const historical = await yahooFinance.historical(candidate, queryOptions);
                if (Array.isArray(historical) && historical.length > 0) {
                    result = historical;
                    finalTicker = candidate;
                    console.log(`✅ Datos encontrados con ${candidate}`);
                    break;
                }
            } catch (e) {
                const isInfrastructureError = looksLikeProviderInfrastructureError(e);
                hadInfrastructureError = hadInfrastructureError || isInfrastructureError;
                if (shouldLogTickerFailure(candidate)) {
                    console.log(`⚠️ Histórico ${candidate} falló: ${e.message}`);
                }
                // Si Yahoo está caído por consentimiento/redirección, saltar a fallback sin ruido.
                if (isInfrastructureError) {
                    break;
                }
            }
        }

        if (!result || !Array.isArray(result) || result.length === 0) {
            const stooqHistorical = await fetchStooqHistorical(normalizedTicker, startDate, endDate);
            if (stooqHistorical) {
                result = stooqHistorical.data;
                finalTicker = stooqHistorical.candidate;
                inferredCurrency = stooqHistorical.currency;
                if (hadInfrastructureError) {
                    console.warn(`⚠️ Histórico de Yahoo no disponible para ${normalizedTicker}; usando stooq como respaldo`);
                } else {
                    console.log(`INFO Histórico sin datos en Yahoo para ${normalizedTicker}; usando stooq como respaldo`);
                }
            }
        }

        if (!result || !Array.isArray(result) || result.length === 0) {
            console.error(`❌ No se encontraron datos históricos para ${normalizedTicker}`);
            throw new Error(`No se encontraron datos históricos. Verifica que el ticker "${normalizedTicker}" sea correcto (ej: AAPL, MSFT, GOOGL)`);
        }

        console.log(`✅ ${result.length} puntos de datos obtenidos para ${finalTicker}`);

        // Obtener la moneda del ticker
        let currency = inferredCurrency || 'USD';
        if (!inferredCurrency) {
            try {
                const quote = await yahooFinance.quote(finalTicker);
                currency = quote?.currency || 'USD';
            } catch (e) {
                console.warn(`⚠️ No se pudo obtener moneda: ${e.message}`);
            }
        }

        const normalizedCurrency = normalizeCurrencyCode(currency) || 'USD';
        const tasa = normalizedCurrency === 'EUR' ? 1 : await obtenerTasaCambio(normalizedCurrency, 'EUR');
        if (!Number.isFinite(tasa) || tasa <= 0) {
            throw new Error(`No se pudo convertir histórico de ${normalizedCurrency} a EUR`);
        }
        
        // Formatear datos
        const historicalData = result
            .filter(item => item.close != null && !isNaN(item.close))
            .map(item => {
                const date = item.date instanceof Date 
                    ? item.date.toISOString().split('T')[0]
                    : new Date(item.date).toISOString().split('T')[0];
                
                return {
                    date: date,
                    price: parseFloat((normalizeMonetaryAmountByCurrency(item.close, currency) * tasa).toFixed(2))
                };
            });

        console.log(`✅ ${historicalData.length} puntos formateados`);

        const payload = {
            ticker: finalTicker,
            period,
            currency: 'EUR',
            data: historicalData
        };

        const savedEntry = setCacheEntry(historicalCache, historyCacheKey, payload);
        return addCacheMetadata(payload, savedEntry, 'live');
    } catch (error) {
        const staleCache = getAnyCacheEntry(historicalCache, historyCacheKey);
        if (staleCache) {
            console.warn(`⚠️ Usando caché histórico para ${normalizedTicker} (${period}) por fallo de proveedor`);
            return addCacheMetadata(
                staleCache.value,
                staleCache,
                'cache-fallback',
                'Mostrando histórico en caché por error temporal del proveedor'
            );
        }

        console.error(`❌ Error obteniendo datos históricos para ${normalizedTicker}:`, error.message);
        throw error;
    }
}

module.exports = { getAssetPrice, obtenerTasaCambio, getHistoricalData };
