module.exports = {
    // Puerto del servidor
    PORT: process.env.PORT || 3000,
    
    // Base de datos
    DB_PATH: process.env.DB_PATH || 'finanzas.db',
    
    // Límites
    BODY_LIMIT: '10mb',
    REQUEST_TIMEOUT: 30000,
    QUERY_LIMIT: Number(process.env.QUERY_LIMIT || 2000),
    
    // Cache
    CACHE_DURATION: 60 * 1000, // 1 minuto
    EXCHANGE_RATE_CACHE: 60 * 60 * 1000, // 1 hora
    
    // Seguridad
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    
    // Entorno
    NODE_ENV: process.env.NODE_ENV || 'development'
};
