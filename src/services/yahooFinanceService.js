// fetch nativo en Node.js 18+ (no necesita polyfill)
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// Caché de tasa de cambio USD->EUR (se actualiza cada hora)
let exchangeRate = 0.92;
let exchangeRateTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

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
    let quote = null;
    let currency = 'USD';
    let priceUSD = 0;
    let priceEUR = 0;
    let found = false;

    const europeanExchanges = ['.DE', '.MI', '.PA', '.L', '.BR', '.AT', '.BE'];

    // 1) Si el ticker tiene sufijo, probarlo tal cual
    if (ticker.includes('.')) {
        try {
            quote = await yahooFinance.quote(ticker);
            if (quote && quote.regularMarketPrice) {
                currency = quote.currency || 'EUR';
                if (currency === 'EUR') {
                    priceEUR = quote.regularMarketPrice;
                    found = true;
                    console.log(`✅ Precio obtenido en EUR desde ${ticker}: ${priceEUR} EUR`);
                } else {
                    priceUSD = quote.regularMarketPrice;
                }
            }
        } catch (e) {
            console.log(`ℹ️ ${ticker} no encontrado, probando alternativas`);
        }
    }

    // 2) Probar con sufijos europeos
    if (!found && !ticker.includes('.')) {
        for (const exchange of europeanExchanges) {
            try {
                const eurTicker = ticker + exchange;
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
            quote = await yahooFinance.quote(ticker);
            if (quote && quote.regularMarketPrice) {
                priceUSD = quote.regularMarketPrice;
                currency = quote.currency || 'USD';
                if (currency === 'USD') {
                    const tasa = await obtenerTasaCambio();
                    priceEUR = priceUSD * tasa;
                    console.log(`💱 Convertido: ${ticker} ${priceUSD} USD × ${tasa} = ${priceEUR} EUR`);
                } else {
                    priceEUR = priceUSD;
                }
                found = true;
            }
        } catch (e) {
            console.error(`Error obteniendo precio para ${ticker}:`, e.message);
        }
    }

    if (!found || !priceEUR) {
        throw new Error('No se pudo obtener el precio');
    }

    return {
        ticker: ticker,
        currentPrice: parseFloat(priceEUR.toFixed(2)),
        currency: 'EUR',
        originalPrice: priceUSD,
        originalCurrency: currency
    };
}

module.exports = { getAssetPrice, obtenerTasaCambio };
