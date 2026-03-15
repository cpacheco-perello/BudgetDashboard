/**
 * Migración 005: Añade campo de retención sobre intereses a cuenta_remunerada
 */

async function columnExists(db, dbAll, table, column) {
    const rows = await dbAll(db, `PRAGMA table_info(${table})`);
    return rows.some(row => row.name === column);
}

async function addColumnIfMissing(db, dbRun, dbAll, table, column, definition) {
    const exists = await columnExists(db, dbAll, table, column);
    if (!exists) {
        await dbRun(db, `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
}

async function up(db, dbRun, dbGet, dbAll) {
    await addColumnIfMissing(db, dbRun, dbAll, 'cuenta_remunerada', 'retencion', 'REAL DEFAULT 0');
    console.log('   ✅ Campo retencion añadido a cuenta_remunerada');
}

module.exports = { up };
