/**
 * Migración 001: Tablas iniciales del sistema
 * Crea todas las tablas base de la aplicación
 */

async function up(db, dbRun) {
    // Tabla de categorías
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            tipo TEXT CHECK(tipo IN ('gasto','ingreso','impuestos')) NOT NULL,
            UNIQUE(nombre, tipo)
        )
    `);

    // Tabla de gastos puntuales
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS gastos_puntuales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            monto REAL NOT NULL,
            categoria_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
        )
    `);

    // Tabla de gastos mensuales
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS gastos_mensuales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descripcion TEXT NOT NULL,
            monto REAL NOT NULL,
            categoria_id INTEGER NOT NULL,
            desde TEXT NOT NULL,
            hasta TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
        )
    `);

    // Tabla de ingresos puntuales
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS ingresos_puntuales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            monto REAL NOT NULL,
            bruto REAL DEFAULT NULL,
            categoria_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
        )
    `);

    // Tabla de ingresos mensuales
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS ingresos_mensuales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descripcion TEXT NOT NULL,
            monto REAL NOT NULL,
            bruto REAL DEFAULT NULL,
            categoria_id INTEGER NOT NULL,
            desde TEXT NOT NULL,
            hasta TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
        )
    `);

    // Tabla de impuestos puntuales
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS impuestos_puntuales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            monto REAL NOT NULL,
            categoria_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
        )
    `);

    // Tabla de impuestos mensuales
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS impuestos_mensuales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descripcion TEXT NOT NULL,
            monto REAL NOT NULL,
            categoria_id INTEGER NOT NULL,
            desde TEXT NOT NULL,
            hasta TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
        )
    `);

    // Tabla de hucha
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS hucha (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            concepto TEXT NOT NULL,
            cantidad REAL NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabla de cuenta remunerada
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS cuenta_remunerada (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descripcion TEXT NOT NULL,
            monto REAL NOT NULL,
            aportacion_mensual REAL DEFAULT NULL,
            interes REAL DEFAULT NULL,
            interes_generado REAL DEFAULT 0,
            categoria_id INTEGER NOT NULL,
            desde TEXT NOT NULL,
            hasta TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
        )
    `);

    // Tabla de assets (acciones)
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            ticker TEXT NOT NULL,
            shares REAL NOT NULL,
            purchase_price REAL NOT NULL,
            categoria_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
        )
    `);

    console.log('   ✅ Tablas iniciales creadas');
}

async function down(db, dbRun) {
    // Rollback: eliminar todas las tablas
    const tables = [
        'assets',
        'cuenta_remunerada',
        'hucha',
        'impuestos_mensuales',
        'impuestos_puntuales',
        'ingresos_mensuales',
        'ingresos_puntuales',
        'gastos_mensuales',
        'gastos_puntuales',
        'categorias'
    ];

    for (const table of tables) {
        await dbRun(db, `DROP TABLE IF EXISTS ${table}`);
    }

    console.log('   ✅ Tablas eliminadas (rollback)');
}

module.exports = { up, down };
