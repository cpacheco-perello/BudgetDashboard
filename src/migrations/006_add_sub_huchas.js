/**
 * Migración 006: Añade tablas para sub-huchas (huchas secundarias)
 * - sub_huchas: definición de cada hucha con aportación inicial y mensual
 * - sub_huchas_puntuales: aportaciones puntuales a una sub-hucha
 */

async function up(db, dbRun) {
    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS sub_huchas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            aportacion_inicial REAL DEFAULT 0,
            aportacion_mensual REAL DEFAULT 0,
            desde TEXT NOT NULL,
            hasta TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await dbRun(db, `
        CREATE TABLE IF NOT EXISTS sub_huchas_puntuales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sub_hucha_id INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            descripcion TEXT,
            monto REAL NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sub_hucha_id) REFERENCES sub_huchas(id) ON DELETE CASCADE
        )
    `);

    console.log('   ✅ Tablas sub_huchas y sub_huchas_puntuales creadas');
}

module.exports = { up };
