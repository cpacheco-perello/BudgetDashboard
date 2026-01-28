/**
 * Migración 002: Crear índices para mejorar el rendimiento
 * Añade índices a las columnas más consultadas
 */

async function up(db, dbRun) {
    // Índices para gastos_puntuales
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_gastos_puntuales_fecha ON gastos_puntuales(fecha)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_gastos_puntuales_categoria ON gastos_puntuales(categoria_id)`);

    // Índices para gastos_mensuales
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_gastos_mensuales_desde ON gastos_mensuales(desde)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_gastos_mensuales_hasta ON gastos_mensuales(hasta)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_gastos_mensuales_categoria ON gastos_mensuales(categoria_id)`);

    // Índices para ingresos_puntuales
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_ingresos_puntuales_fecha ON ingresos_puntuales(fecha)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_ingresos_puntuales_categoria ON ingresos_puntuales(categoria_id)`);

    // Índices para ingresos_mensuales
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_ingresos_mensuales_desde ON ingresos_mensuales(desde)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_ingresos_mensuales_hasta ON ingresos_mensuales(hasta)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_ingresos_mensuales_categoria ON ingresos_mensuales(categoria_id)`);

    // Índices para impuestos_puntuales
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_impuestos_puntuales_fecha ON impuestos_puntuales(fecha)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_impuestos_puntuales_categoria ON impuestos_puntuales(categoria_id)`);

    // Índices para impuestos_mensuales
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_impuestos_mensuales_desde ON impuestos_mensuales(desde)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_impuestos_mensuales_hasta ON impuestos_mensuales(hasta)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_impuestos_mensuales_categoria ON impuestos_mensuales(categoria_id)`);

    // Índices para cuenta_remunerada
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_cuenta_remunerada_desde ON cuenta_remunerada(desde)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_cuenta_remunerada_hasta ON cuenta_remunerada(hasta)`);

    // Índices para assets
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_assets_ticker ON assets(ticker)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_assets_categoria ON assets(categoria_id)`);

    console.log('   ✅ Índices creados para mejorar el rendimiento');
}

async function down(db, dbRun) {
    // Rollback: eliminar índices
    const indexes = [
        'idx_gastos_puntuales_fecha',
        'idx_gastos_puntuales_categoria',
        'idx_gastos_mensuales_desde',
        'idx_gastos_mensuales_hasta',
        'idx_gastos_mensuales_categoria',
        'idx_ingresos_puntuales_fecha',
        'idx_ingresos_puntuales_categoria',
        'idx_ingresos_mensuales_desde',
        'idx_ingresos_mensuales_hasta',
        'idx_ingresos_mensuales_categoria',
        'idx_impuestos_puntuales_fecha',
        'idx_impuestos_puntuales_categoria',
        'idx_impuestos_mensuales_desde',
        'idx_impuestos_mensuales_hasta',
        'idx_impuestos_mensuales_categoria',
        'idx_cuenta_remunerada_desde',
        'idx_cuenta_remunerada_hasta',
        'idx_assets_ticker',
        'idx_assets_categoria'
    ];

    for (const index of indexes) {
        await dbRun(db, `DROP INDEX IF EXISTS ${index}`);
    }

    console.log('   ✅ Índices eliminados (rollback)');
}

module.exports = { up, down };
