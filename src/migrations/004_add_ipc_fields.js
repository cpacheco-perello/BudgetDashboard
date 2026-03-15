/**
 * Migracion 004: Campos IPC para gastos
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
    await addColumnIfMissing(db, dbRun, dbAll, 'gastos_puntuales', 'ipc_porcentaje', 'REAL DEFAULT 0');
    await addColumnIfMissing(db, dbRun, dbAll, 'gastos_mensuales', 'ipc_porcentaje', 'REAL DEFAULT 0');
}

module.exports = { up };
