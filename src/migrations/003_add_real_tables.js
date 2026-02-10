async function up(db, dbRun) {
    // Tabla de gastos reales (importaciones bancarias)
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS gastos_reales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            monto REAL NOT NULL,
            categoria_id INTEGER NOT NULL,
            archivo_origen TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
        )
    `);

    // Tabla de ingresos reales (importaciones bancarias)
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS ingresos_reales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            monto REAL NOT NULL,
            categoria_id INTEGER NOT NULL,
            archivo_origen TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
        )
    `);
}

module.exports = { up };