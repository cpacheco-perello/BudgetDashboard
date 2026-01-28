const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'finanzas.db');
const db = new sqlite3.Database(dbPath);

// Habilitar foreign keys
db.run(`PRAGMA foreign_keys = ON`);

module.exports = db;
