// fetch nativo en Node.js 18+ (no necesita polyfill)
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Caché de tasa de cambio USD->EUR (se actualiza cada hora)
let exchangeRate = 0.92;
let exchangeRateTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

// Control de ruido de logs para tickers inválidos/no disponibles
const failedTickerLogCache = new Map();
const FAILED_TICKER_LOG_TTL = 10 * 60 * 1000; // 10 minutos

function shouldLogTickerFailure(ticker) {
    const now = Date.now();
    const last = failedTickerLogCache.get(ticker) || 0;
    if (now - last > FAILED_TICKER_LOG_TTL) {
        failedTickerLogCache.set(ticker, now);
        return true;
    }
    return false;
}

/**
 * Obtiene la tasa de cambio USD a EUR
 */
async function obtenerTasaCambio() {
    const ahora = Date.now();
    
    if (exchangeRate > 0 && (ahora - exchangeRateTime) < CACHE_DURATION) {
        return exchangeRate;
    }
    
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        if (data.rates && data.rates.EUR) {
            exchangeRate = data.rates.EUR;
            exchangeRateTime = ahora;
            console.log(`✅ Tasa de cambio actualizada: 1 USD = ${exchangeRate} EUR`);
            return exchangeRate;
        }
    } catch (e) {
        console.warn('⚠️ No se pudo obtener tasa de cambio en tiempo real, usando tasa aproximada');
    }
    
    return exchangeRate;
}

/**
 * Obtiene el precio de un activo y lo convierte a EUR
 */
async function getAssetPrice(ticker) {
    const normalizedTicker = String(ticker || '').trim().toUpperCase();
    if (!normalizedTicker) {
        throw new Error('Ticker vacío');
    }

    let quote = null;
    let currency = 'USD';
    let priceUSD = 0;
    let priceEUR = 0;
    let found = false;

    const europeanExchanges = ['.DE', '.MI', '.PA', '.L', '.BR', '.AT', '.BE'];

    // 1) Si el ticker tiene sufijo, probarlo tal cual
    if (normalizedTicker.includes('.')) {
        try {
            quote = await yahooFinance.quote(normalizedTicker);
            if (quote && quote.regularMarketPrice) {
                currency = quote.currency || 'EUR';
                if (currency === 'EUR') {
                    priceEUR = quote.regularMarketPrice;
                    found = true;
                    console.log(`✅ Precio obtenido en EUR desde ${normalizedTicker}: ${priceEUR} EUR`);
                } else {
                    priceUSD = quote.regularMarketPrice;
                }
            }
        } catch (e) {
            if (shouldLogTickerFailure(normalizedTicker)) {
                console.log(`ℹ️ ${normalizedTicker} no encontrado, probando alternativas`);
            }
        }
    }

    // 2) Probar con sufijos europeos
    if (!found && !normalizedTicker.includes('.')) {
        for (const exchange of europeanExchanges) {
            try {
                const eurTicker = normalizedTicker + exchange;
                quote = await yahooFinance.quote(eurTicker);
                if (quote && quote.regularMarketPrice) {
                    currency = quote.currency || 'EUR';
                    if (currency === 'EUR') {
                        priceEUR = quote.regularMarketPrice;
                        found = true;
                        console.log(`✅ Precio obtenido en EUR desde ${eurTicker}: ${priceEUR} EUR`);
                        break;
                    }
                }
            } catch (e) {
                // Continuar con el siguiente
            }
        }
    }

    // 3) Fallback: ticker base
    if (!found) {
        try {
            quote = await yahooFinance.quote(normalizedTicker);
            if (quote && quote.regularMarketPrice) {
                priceUSD = quote.regularMarketPrice;
                currency = quote.currency || 'USD';
                if (currency === 'USD') {
                    const tasa = await obtenerTasaCambio();
                    priceEUR = priceUSD * tasa;
                    console.log(`💱 Convertido: ${normalizedTicker} ${priceUSD} USD × ${tasa} = ${priceEUR} EUR`);
                } else {
                    priceEUR = priceUSD;
                }
                found = true;
            }
        } catch (e) {
            if (shouldLogTickerFailure(normalizedTicker)) {
                console.warn(`⚠️ Error obteniendo precio para ${normalizedTicker}: ${e.message}`);
            }
        }
    }

    if (!found || !priceEUR) {
        throw new Error('No se pudo obtener el precio');
    }

    return {
        ticker: normalizedTicker,
        currentPrice: parseFloat(priceEUR.toFixed(2)),
        currency: 'EUR',
        originalPrice: priceUSD,
        originalCurrency: currency
    };
}

/**
 * Obtiene datos históricos de un activo
 * @param {string} ticker - Símbolo del activo
 * @param {string} period - Período ('1mo', '3mo', '6mo', '1y', '2y', '5y')
 * @returns {Promise<Object>} Objeto con ticker, period, currency y data array
 */
async function getHistoricalData(ticker, period = '1y') {
    console.log(`📊 [getHistoricalData] Ticker: ${ticker}, Período: ${period}`);
    
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
        let finalTicker = ticker;
        const europeanExchanges = ['.DE', '.MI', '.PA', '.L', '.BR', '.AT', '.BE'];
        
        // Intentar con el ticker original
        try {
            console.log(`🔍 Intentando con ticker original: ${ticker}`);
            result = await yahooFinance.historical(ticker, queryOptions);
            if (result && result.length > 0) {
                console.log(`✅ Datos encontrados con ticker original`);
            }
        } catch (e) {
            console.log(`⚠️ Ticker original falló: ${e.message}`);
        }
        
        // Si no funcionó y no tiene sufijo, probar con sufijos europeos
        if ((!result || result.length === 0) && !ticker.includes('.')) {
            for (const exchange of europeanExchanges) {
                try {
                    finalTicker = ticker + exchange;
                    console.log(`🔍 Intentando con: ${finalTicker}`);
                    result = await yahooFinance.historical(finalTicker, queryOptions);
                    if (result && result.length > 0) {
                        console.log(`✅ Datos encontrados con ${finalTicker}`);
                        break;
                    }
                } catch (e) {
                    console.log(`⚠️ ${finalTicker} falló: ${e.message}`);
                    result = null;
                }
            }
        }
        
        if (!result || !Array.isArray(result) || result.length === 0) {
            console.error(`❌ No se encontraron datos históricos para ${ticker}`);
            throw new Error(`No se encontraron datos históricos. Verifica que el ticker "${ticker}" sea correcto (ej: AAPL, MSFT, GOOGL)`);
        }

        console.log(`✅ ${result.length} puntos de datos obtenidos para ${finalTicker}`);

        // Obtener la moneda del ticker
        let currency = 'USD';
        try {
            const quote = await yahooFinance.quote(finalTicker);
            currency = quote?.currency || 'USD';
        } catch (e) {
            console.warn(`⚠️ No se pudo obtener moneda: ${e.message}`);
        }
        
        // Obtener tasa de cambio si es necesario
        const tasa = currency === 'EUR' ? 1 : await obtenerTasaCambio();
        
        // Formatear datos
        const historicalData = result
            .filter(item => item.close != null && !isNaN(item.close))
            .map(item => {
                const date = item.date instanceof Date 
                    ? item.date.toISOString().split('T')[0]
                    : new Date(item.date).toISOString().split('T')[0];
                
                return {
                    date: date,
                    price: parseFloat((item.close * tasa).toFixed(2))
                };
            });

        console.log(`✅ ${historicalData.length} puntos formateados`);

        return {
            ticker: finalTicker,
            period,
            currency: 'EUR',
            data: historicalData
        };
    } catch (error) {
        console.error(`❌ Error obteniendo datos históricos para ${ticker}:`, error.message);
        throw error;
    }
}

module.exports = { getAssetPrice, obtenerTasaCambio, getHistoricalData };
