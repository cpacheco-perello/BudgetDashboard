const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config');

let currentDb = null;
let currentDbPath = null;

function resolveDbPath(dbPath) {
	if (dbPath === ':memory:') return ':memory:';
	if (path.isAbsolute(dbPath)) return dbPath;
	return path.join(process.cwd(), dbPath);
}

function initDb(dbPath) {
	currentDbPath = resolveDbPath(dbPath);
	currentDb = new sqlite3.Database(currentDbPath);
	currentDb.run('PRAGMA foreign_keys = ON');
}

async function setDbPath(dbPath) {
	const nextPath = resolveDbPath(dbPath);
	if (nextPath === currentDbPath && currentDb) return;

	await new Promise((resolve, reject) => {
		if (!currentDb) return resolve();
		currentDb.close(err => (err ? reject(err) : resolve()));
	});

	initDb(nextPath);
}

function getDbPath() {
	return currentDbPath;
}

function getDb() {
	return currentDb;
}

initDb(config.DB_PATH);

const dbProxy = new Proxy({}, {
	get(_target, prop) {
		if (prop === '__setDbPath') return setDbPath;
		if (prop === '__getDbPath') return getDbPath;
		if (prop === '__getDb') return getDb;

		if (!currentDb) {
			throw new Error('Database not initialized');
		}

		const value = currentDb[prop];
		if (typeof value === 'function') {
			return value.bind(currentDb);
		}
		return value;
	}
});

module.exports = dbProxy;
