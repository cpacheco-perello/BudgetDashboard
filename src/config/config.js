module.exports = {
    // Puerto del servidor
    PORT: process.env.PORT || 3000,
    
    // Base de datos
    DB_PATH: process.env.DB_PATH || 'finanzas.db',
    
    // Límites
    BODY_LIMIT: '10mb',
    REQUEST_TIMEOUT: 30000,
    QUERY_LIMIT: 500,
    
    // Cache
    CACHE_DURATION: 0 * 60 * 1000, // 0.5 minutos
    EXCHANGE_RATE_CACHE: 60 * 60 * 1000, // 1 hora
    
    // Seguridad
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    
    // Entorno
    NODE_ENV: process.env.NODE_ENV || 'development'
};
