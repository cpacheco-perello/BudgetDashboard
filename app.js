

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Polyfill fetch para Electron compatibility
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

const YahooFinance = require('yahoo-finance2').default;

const app = express();
const yahooFinance = new YahooFinance();

// Middleware - Aumentar límite de tamaño para JSON (pero no demasiado)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Timeout para solicitudes
app.use((req, res, next) => {
    res.setTimeout(30000, () => {
        res.status(408).json({ error: 'Request timeout' });
    });
    next();
});

// Headers de seguridad y CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data:; connect-src 'self' https://cdn.jsdelivr.net https://api.exchangerate-api.com https://open.er-api.com https://query1.finance.yahoo.com");
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.static(path.join(__dirname, 'public')));

// Base de datos
const dbPath = path.join(process.cwd(), 'finanzas.db');
const db = new sqlite3.Database(dbPath);
// ================== HELPERS ASYNC ==================

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// ================== FUNCIÓN CALCULAR INTERESES ==================

function calcularInteresGenerado(monto, aportacionMensual, interes, desde, hasta) {
    const [desdeY, desdeM] = desde.split('-').map(Number);
    const [hastaY, hastaM] = hasta.split('-').map(Number);
    
    // Si es un solo mes, solo calcula interés con la base, sin aportaciones
    if (desde === hasta) {
        return monto * (interes / 100) / 12;
    }
    
    const desdeDate = new Date(desdeY, desdeM - 1, 1);
    const hastaDate = new Date(hastaY, hastaM, 0);
    
    let saldo = monto;
    let totalInteres = 0;
    let current = new Date(desdeDate);
    
    // Primer mes: monto inicial genera interés
    totalInteres += saldo * (interes / 100) / 12;
    current.setMonth(current.getMonth() + 1);
    
    // Meses siguientes: aportación el día 1, luego genera interés
    while (current <= hastaDate) {
        saldo += aportacionMensual || 0;
        totalInteres += saldo * (interes / 100) / 12;
        current.setMonth(current.getMonth() + 1);
    }
    
    return totalInteres;
}

// Calcular intereses mensuales (mes a mes)
function calcularInteresesMensuales(monto, aportacionMensual, interes, desde, hasta) {
    const [desdeY, desdeM] = desde.split('-').map(Number);
    const [hastaY, hastaM] = hasta.split('-').map(Number);
    
    const mesesInteres = {};
    
    // Si es un solo mes, solo calcula interés con la base
    if (desde === hasta) {
        mesesInteres[desde] = monto * (interes / 100) / 12;
        return mesesInteres;
    }
    
    const desdeDate = new Date(desdeY, desdeM - 1, 1);
    const hastaDate = new Date(hastaY, hastaM, 0);
    
    let saldo = monto;
    let current = new Date(desdeDate);
    
    // Primer mes: monto inicial genera interés
    const primerMes = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    mesesInteres[primerMes] = saldo * (interes / 100) / 12;
    current.setMonth(current.getMonth() + 1);
    
    // Meses siguientes: aportación el día 1, luego genera interés
    while (current <= hastaDate) {
        saldo += aportacionMensual || 0;
        const mesKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        mesesInteres[mesKey] = saldo * (interes / 100) / 12;
        current.setMonth(current.getMonth() + 1);
    }
    
    return mesesInteres;
}

// Generar descripción random para cuenta remunerada
function generarDescripcionRandom() {
    const ids = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `Cuenta-${ids}-${timestamp}`;
}

// ================== CREAR TABLAS ==================


db.run(`PRAGMA foreign_keys = ON`);

db.run(`
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('gasto','ingreso','impuestos')) NOT NULL,
    UNIQUE(nombre, tipo)
)`);

db.run(`
CREATE TABLE IF NOT EXISTS gastos_puntuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL,
    categoria_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
)`);
db.run(`
CREATE TABLE IF NOT EXISTS hucha (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concepto TEXT NOT NULL,
    cantidad REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);
db.run(`
CREATE TABLE IF NOT EXISTS gastos_mensuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL,
    categoria_id INTEGER NOT NULL,
    desde TEXT NOT NULL,
    hasta TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
)`);

db.run(`
CREATE TABLE IF NOT EXISTS ingresos_puntuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL,
    bruto REAL,
    categoria_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
)`);

db.run(`
CREATE TABLE IF NOT EXISTS impuestos_puntuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL,
    categoria_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
)`);

db.run(`
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
)`);

db.run(`
CREATE TABLE IF NOT EXISTS impuestos_mensuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL,
    categoria_id INTEGER NOT NULL,
    desde TEXT NOT NULL,
    hasta TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
)`);

// CUENTA REMUNERADA
db.run(`
CREATE TABLE IF NOT EXISTS cuenta_remunerada (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL,
    aportacion_mensual REAL,
    interes REAL,
    interes_generado REAL DEFAULT 0,
    categoria_id INTEGER NOT NULL,
    desde TEXT NOT NULL,
    hasta TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
)`);

// ASSETS (ACCIONES)
db.run(`
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    ticker TEXT NOT NULL,
    shares REAL NOT NULL,
    purchase_price REAL NOT NULL,
    categoria_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
)`);


// ===== MIGRATION: Actualizar CHECK constraint de categorias =====
db.run(`ALTER TABLE categorias ADD COLUMN tipo_test TEXT`, (err) => {
    if (err) {
        // La columna ya existe o hay otro error, la tabla está lista
        console.log('✅ Tabla categorias lista con CHECK constraint actualizado');
    } else {
        // Se pudo agregar la columna, significa que la tabla es antigua
        db.run(`ALTER TABLE categorias DROP COLUMN tipo_test`);
        console.log('⚠️ Migrando tabla categorias para agregar tipo "impuestos"...');
    }});




// Agregar columna interes_generado si no existe
db.run(`ALTER TABLE cuenta_remunerada ADD COLUMN interes_generado REAL DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('Error al agregar columna interes_generado:', err);
    }
});

// Agregar columna aportacion_mensual si no existe
db.run(`ALTER TABLE cuenta_remunerada ADD COLUMN aportacion_mensual REAL DEFAULT NULL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('Error al agregar columna aportacion_mensual:', err);
    }
});

db.run(`PRAGMA foreign_keys = OFF`, () => {
    db.run(`
        CREATE TABLE categorias_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            tipo TEXT CHECK(tipo IN ('gasto','ingreso','impuestos')) NOT NULL,
            UNIQUE(nombre, tipo)
        )
    `, () => {
        db.run(`INSERT INTO categorias_new SELECT id, nombre, tipo FROM categorias`, () => {
            db.run(`DROP TABLE categorias`, () => {
                db.run(`ALTER TABLE categorias_new RENAME TO categorias`, () => {
                    db.run(`PRAGMA foreign_keys = ON`, () => {
                        console.log('✅ Tabla categorias migrada correctamente');
                    });
                });
            });
        });
    });
});

// Agregar columna bruto si no existe (para bases de datos existentes)
db.run(`ALTER TABLE ingresos_puntuales ADD COLUMN bruto REAL DEFAULT NULL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('Error al agregar columna bruto a ingresos_puntuales:', err);
    }
});

db.run(`ALTER TABLE ingresos_mensuales ADD COLUMN bruto REAL DEFAULT NULL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('Error al agregar columna bruto a ingresos_mensuales:', err);
    }
});


// ================== CATEGORÍAS ==================

app.post('/add/categoria', async (req, res) => {
    try {
        const { nombre, tipo } = req.body;
        
        // Validación
        if (!nombre || !tipo) {
            return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
        }
        
        if (!['gasto', 'ingreso', 'impuestos'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo de categoría inválido' });
        }
        
        await dbRun("INSERT INTO categorias (nombre, tipo) VALUES (?, ?)", [nombre.trim(), tipo]);
        res.status(200).json({ success: true, message: 'Categoría agregada' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            res.status(400).json({ error: 'La categoría ya existe para este tipo' });
        } else {
            res.status(400).json({ error: err.message });
        }
    }
});

app.get('/categorias', async (req, res) => {
    try {
        const gastos = await dbAll("SELECT * FROM categorias WHERE tipo='gasto' ORDER BY nombre");
        const ingresos = await dbAll("SELECT * FROM categorias WHERE tipo='ingreso' ORDER BY nombre");
        const impuestos = await dbAll("SELECT * FROM categorias WHERE tipo='impuestos' ORDER BY nombre");
        res.json({ 
            gastos: gastos || [], 
            ingresos: ingresos || [], 
            impuestos: impuestos || [] 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/delete/categoria', async (req, res) => {
    try {
        await dbRun("DELETE FROM categorias WHERE id = ?", [req.body.id]);
        res.json({ ok: true });
    } catch {
        res.status(400).send("No se puede borrar: categoría en uso");
    }
});

app.post('/update/categoria', async (req, res) => {
    const { id, nombre } = req.body;
    try {
        await dbRun("UPDATE categorias SET nombre = ? WHERE id = ?", [nombre, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// ================== HUCHA REAL ==================
db.run(`
CREATE TABLE IF NOT EXISTS hucha (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concepto TEXT NOT NULL,
    cantidad REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

app.get('/hucha', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM hucha ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/add/hucha', async (req, res) => {
    const { concepto, cantidad } = req.body;
    if (!concepto || !cantidad || isNaN(cantidad)) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }
    try {
        await dbRun('INSERT INTO hucha (concepto, cantidad) VALUES (?, ?)', [concepto, cantidad]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/delete/hucha', async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    try {
        await dbRun('DELETE FROM hucha WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/update/hucha', async (req, res) => {
    const { id, concepto, cantidad } = req.body;
    if (!id || !concepto || !cantidad || isNaN(cantidad)) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }
    try {
        await dbRun('UPDATE hucha SET concepto = ?, cantidad = ? WHERE id = ?', [concepto, cantidad, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ================== CUENTA REMUNERADA ==================

app.post('/add/cuenta_remunerada', async (req, res) => {
    const { monto, aportacion_mensual, interes, categoria_id, desde, hasta } = req.body;
    try {
        // Calcular interés generado
        const interesGenerado = calcularInteresGenerado(monto, aportacion_mensual || 0, interes || 0, desde, hasta);
        const descripcion = generarDescripcionRandom();
        
        await dbRun(`
            INSERT INTO cuenta_remunerada (descripcion, monto, aportacion_mensual, interes, interes_generado, categoria_id, desde, hasta)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [descripcion, monto, aportacion_mensual || null, interes || null, interesGenerado, categoria_id, desde, hasta]);
          
        res.sendStatus(200);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


app.post('/delete/cuenta_remunerada', async (req, res) => {
    await dbRun("DELETE FROM cuenta_remunerada WHERE id = ?", [req.body.id]);
    res.json({ ok: true });
});

app.post('/update/cuenta_remunerada', async (req, res) => {
    const { id, desde, hasta, monto, aportacion_mensual, interes, categoria } = req.body;
    try {
        // Obtener el id de la categoría desde el nombre
        const cat = await dbGet("SELECT id FROM categorias WHERE nombre = ? AND tipo = 'ingreso'", [categoria]);
        if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
        
        // Generar nueva descripción random
        const descripcion = generarDescripcionRandom();
        
        // Recalcular interés generado
        const interesGenerado = calcularInteresGenerado(monto, aportacion_mensual, interes, desde, hasta);
        
        await dbRun(`
            UPDATE cuenta_remunerada 
            SET descripcion = ?, desde = ?, hasta = ?, monto = ?, aportacion_mensual = ?, interes = ?, interes_generado = ?, categoria_id = ?
            WHERE id = ?
        `, [descripcion, desde, hasta, monto, aportacion_mensual || null, interes || null, interesGenerado, cat.id, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ================== GASTOS ==================

app.post('/add/gasto_puntual', async (req, res) => {
    const { fecha, descripcion, monto, categoria_id } = req.body;
    await dbRun(`
        INSERT INTO gastos_puntuales (fecha, descripcion, monto, categoria_id)
        VALUES (?, ?, ?, ?)
    `, [fecha, descripcion, monto, categoria_id]);
    res.sendStatus(200);
});

app.post('/delete/gasto_puntual', async (req, res) => {
    await dbRun("DELETE FROM gastos_puntuales WHERE id = ?", [req.body.id]);
    res.json({ ok: true });
});

app.post('/update/gasto_puntual', async (req, res) => {
    const { id, fecha, descripcion, monto, categoria } = req.body;
    try {
        // Obtener el id de la categoría desde el nombre
        const cat = await dbGet("SELECT id FROM categorias WHERE nombre = ? AND tipo = 'gasto'", [categoria]);
        if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
        
        await dbRun(`
            UPDATE gastos_puntuales 
            SET fecha = ?, descripcion = ?, monto = ?, categoria_id = ?
            WHERE id = ?
        `, [fecha, descripcion, monto, cat.id, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/add/gasto_mensual', async (req, res) => {
    const { descripcion, monto, categoria_id, desde, hasta } = req.body;
    await dbRun(`
        INSERT INTO gastos_mensuales (descripcion, monto, categoria_id, desde, hasta)
        VALUES (?, ?, ?, ?, ?)
    `, [descripcion, monto, categoria_id, desde, hasta]);
    res.sendStatus(200);
});

app.post('/delete/gasto_mensual', async (req, res) => {
    await dbRun("DELETE FROM gastos_mensuales WHERE id = ?", [req.body.id]);
    res.json({ ok: true });
});

app.post('/update/gasto_mensual', async (req, res) => {
    const { id, desde, hasta, descripcion, monto, categoria } = req.body;
    try {
        // Obtener el id de la categoría desde el nombre
        const cat = await dbGet("SELECT id FROM categorias WHERE nombre = ? AND tipo = 'gasto'", [categoria]);
        if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
        
        await dbRun(`
            UPDATE gastos_mensuales 
            SET desde = ?, hasta = ?, descripcion = ?, monto = ?, categoria_id = ?
            WHERE id = ?
        `, [desde, hasta, descripcion, monto, cat.id, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ================== IMPUESTOS ==================

app.post('/add/impuesto_puntual', async (req, res) => {
    const { fecha, descripcion, monto, categoria_id } = req.body;
    try {
        await dbRun(`
            INSERT INTO impuestos_puntuales (fecha, descripcion, monto, categoria_id)
            VALUES (?, ?, ?, ?)
        `, [fecha, descripcion, monto, categoria_id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/delete/impuesto_puntual', async (req, res) => {
    try {
        await dbRun("DELETE FROM impuestos_puntuales WHERE id = ?", [req.body.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/update/impuesto_puntual', async (req, res) => {
    const { id, fecha, descripcion, monto, categoria } = req.body;
    try {
        const cat = await dbGet("SELECT id FROM categorias WHERE nombre = ?", [categoria]);
        if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
        
        await dbRun(`
            UPDATE impuestos_puntuales 
            SET fecha = ?, descripcion = ?, monto = ?, categoria_id = ?
            WHERE id = ?
        `, [fecha, descripcion, monto, cat.id, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/add/impuesto_mensual', async (req, res) => {
    const { descripcion, monto, categoria_id, desde, hasta } = req.body;
    try {
        await dbRun(`
            INSERT INTO impuestos_mensuales (descripcion, monto, categoria_id, desde, hasta)
            VALUES (?, ?, ?, ?, ?)
        `, [descripcion, monto, categoria_id, desde, hasta]);
        res.sendStatus(200);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/delete/impuesto_mensual', async (req, res) => {
    try {
        await dbRun("DELETE FROM impuestos_mensuales WHERE id = ?", [req.body.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/update/impuesto_mensual', async (req, res) => {
    const { id, desde, hasta, descripcion, monto, categoria } = req.body;
    try {
        const cat = await dbGet("SELECT id FROM categorias WHERE nombre = ?", [categoria]);
        if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
        
        await dbRun(`
            UPDATE impuestos_mensuales 
            SET desde = ?, hasta = ?, descripcion = ?, monto = ?, categoria_id = ?
            WHERE id = ?
        `, [desde, hasta, descripcion, monto, cat.id, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/impuestos-puntuales', async (req, res) => {
    try {
        const impuestos = await dbAll(`
            SELECT i.id, i.fecha, i.descripcion, i.monto, c.nombre AS categoria
            FROM impuestos_puntuales i
            JOIN categorias c ON i.categoria_id = c.id
            ORDER BY i.fecha DESC
        `);
        res.json(impuestos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/impuestos-mensuales', async (req, res) => {
    try {
        const impuestos = await dbAll(`
            SELECT i.id, i.descripcion, i.monto, i.desde, i.hasta, c.nombre AS categoria
            FROM impuestos_mensuales i
            JOIN categorias c ON i.categoria_id = c.id
            ORDER BY i.desde DESC
        `);
        res.json(impuestos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== INGRESOS ==================

app.post('/add/ingreso_puntual', async (req, res) => {
    const { fecha, descripcion, monto, bruto, categoria_id } = req.body;
    await dbRun(`
        INSERT INTO ingresos_puntuales (fecha, descripcion, monto, bruto, categoria_id)
        VALUES (?, ?, ?, ?, ?)
    `, [fecha, descripcion, monto, bruto || null, categoria_id]);
    res.sendStatus(200);
});

app.post('/delete/ingreso_puntual', async (req, res) => {
    await dbRun("DELETE FROM ingresos_puntuales WHERE id = ?", [req.body.id]);
    res.json({ ok: true });
});

app.post('/update/ingreso_puntual', async (req, res) => {
    const { id, fecha, descripcion, monto, bruto, categoria } = req.body;
    try {
        // Obtener el id de la categoría desde el nombre
        const cat = await dbGet("SELECT id FROM categorias WHERE nombre = ? AND tipo = 'ingreso'", [categoria]);
        if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
        
        await dbRun(`
            UPDATE ingresos_puntuales 
            SET fecha = ?, descripcion = ?, monto = ?, bruto = ?, categoria_id = ?
            WHERE id = ?
        `, [fecha, descripcion, monto, bruto || null, cat.id, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/add/ingreso_mensual', async (req, res) => {
    const { descripcion, monto, bruto, categoria_id, desde, hasta } = req.body;
    await dbRun(`
        INSERT INTO ingresos_mensuales (descripcion, monto, bruto, categoria_id, desde, hasta)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [descripcion, monto, bruto || null, categoria_id, desde, hasta]);
    res.sendStatus(200);
});

app.post('/delete/ingreso_mensual', async (req, res) => {
    await dbRun("DELETE FROM ingresos_mensuales WHERE id = ?", [req.body.id]);
    res.json({ ok: true });
});

app.post('/update/ingreso_mensual', async (req, res) => {
    const { id, desde, hasta, descripcion, monto, bruto, categoria } = req.body;
    try {
        // Obtener el id de la categoría desde el nombre
        const cat = await dbGet("SELECT id FROM categorias WHERE nombre = ? AND tipo = 'ingreso'", [categoria]);
        if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
        
        await dbRun(`
            UPDATE ingresos_mensuales 
            SET desde = ?, hasta = ?, descripcion = ?, monto = ?, bruto = ?, categoria_id = ?
            WHERE id = ?
        `, [desde, hasta, descripcion, monto, bruto || null, cat.id, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ================== ASSETS (ACCIONES) ==================

app.get('/assets', async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT a.*, c.nombre as categoria
            FROM assets a
            JOIN categorias c ON a.categoria_id = c.id
            ORDER BY a.created_at DESC
        `);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Obtiene el ID de la categoría fija "Assets" (crea si no existe)
async function getAssetsCategoryId() {
    // Usamos tipo "ingreso" para cumplir el CHECK existente
    let cat = await dbGet('SELECT id FROM categorias WHERE nombre=? AND tipo="ingreso"', ['Assets']);
    if (cat && cat.id) return cat.id;
    await dbRun('INSERT INTO categorias (nombre, tipo) VALUES (?, ?)', ['Assets', 'ingreso']);
    cat = await dbGet('SELECT id FROM categorias WHERE nombre=? AND tipo="ingreso"', ['Assets']);
    return cat.id;
}

app.post('/add/asset', async (req, res) => {
    try {
        const { company, ticker, shares, purchase_price } = req.body;
        const categoria_id = await getAssetsCategoryId();
        await dbRun(`
            INSERT INTO assets (company, ticker, shares, purchase_price, categoria_id)
            VALUES (?, ?, ?, ?, ?)
        `, [company, ticker, shares, purchase_price, categoria_id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/delete/asset', async (req, res) => {
    try {
        await dbRun('DELETE FROM assets WHERE id=?', [req.body.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/update/asset', async (req, res) => {
    try {
        const { id, company, ticker, shares, purchase_price } = req.body;
        const categoria_id = await getAssetsCategoryId();
        await dbRun(`
            UPDATE assets 
            SET company=?, ticker=?, shares=?, purchase_price=?, categoria_id=?
            WHERE id=?
        `, [company, ticker, shares, purchase_price, categoria_id, id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Vender asset: calcular ganancia y registrar como ingreso puntual
app.post('/sell/asset', async (req, res) => {
    try {
        const { id, sale_price } = req.body;
        
        // Obtener datos del asset
        const asset = await dbGet(`SELECT * FROM assets WHERE id=?`, [id]);
        if (!asset) {
            return res.status(404).json({ error: 'Asset no encontrado' });
        }
        
        // Calcular ganancia/pérdida
        const totalInvested = asset.shares * asset.purchase_price;
        const totalSale = asset.shares * sale_price;
        const profit = totalSale - totalInvested;
        
        // Obtener categoría fija "Assets"
        const categoryId = await getAssetsCategoryId();
        
        // Fecha actual
        const fecha = new Date().toISOString().split('T')[0];
        
        // Crear descripción de la venta
        const descripcion = `Venta ${asset.shares} acciones ${asset.company} (${asset.ticker}) @ €${sale_price.toFixed(2)}`;
        
        // Si hay ganancia, registrar como ingreso; si hay pérdida, registrar como gasto
        if (profit >= 0) {
            // Ganancia: registrar como ingreso puntual
            await dbRun(
                `INSERT INTO ingresos_puntuales (fecha, descripcion, monto, bruto, categoria_id) VALUES (?, ?, ?, ?, ?)`,
                [fecha, descripcion, profit, profit, categoryId]
            );
        } else {
            // Pérdida: registrar como gasto puntual (valor absoluto)
            // Obtener o crear categoría "Assets" para gastos
            let gastoCategoryId = await dbGet(
                `SELECT id FROM categorias WHERE nombre = 'Assets' AND tipo = 'gasto'`
            );
            
            if (!gastoCategoryId) {
                await dbRun(
                    `INSERT INTO categorias (nombre, tipo) VALUES ('Assets', 'gasto')`
                );
                gastoCategoryId = await dbGet(
                    `SELECT id FROM categorias WHERE nombre = 'Assets' AND tipo = 'gasto'`
                );
            }
            
            await dbRun(
                `INSERT INTO gastos_puntuales (fecha, descripcion, monto, categoria_id) VALUES (?, ?, ?, ?)`,
                [fecha, descripcion, Math.abs(profit), gastoCategoryId.id]
            );
        }
        
        // Eliminar el asset de la tabla
        await dbRun(`DELETE FROM assets WHERE id=?`, [id]);
        
        res.json({ 
            ok: true, 
            profit: profit,
            total_invested: totalInvested,
            total_sale: totalSale
        });
    } catch (err) {
        console.error('Error selling asset:', err);
        res.status(500).json({ error: 'Error procesando la venta' });
    }
});

// Caché de tasa de cambio USD->EUR (se actualiza cada hora)
let exchangeRate = 0.92; // Tasa aproximada por defecto
let exchangeRateTime = 0;

async function obtenerTasaCambio() {
    const ahora = Date.now();
    const UNA_HORA = 60 * 60 * 1000;
    
    // Si la tasa está en caché y es reciente, usarla
    if (exchangeRate > 0 && (ahora - exchangeRateTime) < UNA_HORA) {
        return exchangeRate;
    }
    
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        if (data.rates && data.rates.EUR) {
            exchangeRate = data.rates.EUR;
            exchangeRateTime = ahora;
            console.log(`✅ Tasa de cambio actualizada: 1 USD = ${exchangeRate} EUR`);
            return exchangeRate;
        }
    } catch (e) {
        console.warn('⚠️ No se pudo obtener tasa de cambio en tiempo real, usando tasa aproximada');
    }
    
    return exchangeRate;
}

app.get('/asset-price/:ticker', async (req, res) => {
    try {
        let ticker = req.params.ticker;
        let quote = null;
        let currency = 'USD';
        let priceUSD = 0;
        let priceEUR = 0;

        const europeanExchanges = ['.DE', '.MI', '.PA', '.L', '.BR', '.AT', '.BE'];
        let found = false;

        // 1) Si el usuario ya envía sufijo (ej: APC.DE), probarlo tal cual
        if (ticker.includes('.')) {
            try {
                quote = await yahooFinance.quote(ticker);
                if (quote && quote.regularMarketPrice) {
                    currency = quote.currency || 'EUR';
                    if (currency === 'EUR') {
                        priceEUR = quote.regularMarketPrice;
                        found = true;
                        console.log(`✅ Precio obtenido en EUR desde ${ticker}: ${priceEUR} EUR`);
                    } else {
                        priceUSD = quote.regularMarketPrice;
                    }
                }
            } catch (e) {
                console.log(`ℹ️ ${ticker} no encontrado, probando alternativas`);
            }
        }

        // 2) Si no se encontró y no venía sufijo, probar sufijos europeos comunes
        if (!found && !ticker.includes('.')) {
            for (const exchange of europeanExchanges) {
                try {
                    const eurTicker = ticker + exchange;
                    quote = await yahooFinance.quote(eurTicker);
                    if (quote && quote.regularMarketPrice) {
                        currency = quote.currency || 'EUR';
                        if (currency === 'EUR') {
                            priceEUR = quote.regularMarketPrice;
                            found = true;
                            console.log(`✅ Precio obtenido en EUR desde ${eurTicker}: ${priceEUR} EUR`);
                            break;
                        }
                    }
                } catch (e) {
                    // Continuar con el siguiente exchange
                }
            }
        }

        // 3) Fallback: ticker tal cual (usa o cualquier otro) y convertir si es USD
        if (!found) {
            try {
                quote = await yahooFinance.quote(ticker);
                if (quote && quote.regularMarketPrice) {
                    priceUSD = quote.regularMarketPrice;
                    currency = quote.currency || 'USD';
                    if (currency === 'USD') {
                        const tasa = await obtenerTasaCambio();
                        priceEUR = priceUSD * tasa;
                        console.log(`💱 Convertido: ${ticker} ${priceUSD} USD × ${tasa} = ${priceEUR} EUR`);
                    } else {
                        priceEUR = priceUSD;
                    }
                    found = true;
                }
            } catch (e) {
                console.error(`Error obteniendo precio para ${ticker}:`, e.message);
            }
        }

        if (!found || !priceEUR) {
            return res.status(500).json({ 
                error: 'No se pudo obtener el precio', 
                ticker: req.params.ticker,
                mensaje: 'Verifica que el ticker sea válido (ej: AAPL, MSFT, etc.)'
            });
        }

        res.json({
            ticker: ticker,
            currentPrice: parseFloat(priceEUR.toFixed(2)),
            currency: 'EUR',
            originalPrice: priceUSD,
            originalCurrency: currency
        });
    } catch (e) {
        console.error('Error obteniendo precio:', e);
        res.status(500).json({ 
            error: 'No se pudo obtener el precio', 
            ticker: req.params.ticker 
        });
    }
});


// ================== DASHBOARD ==================



// ================== GASTOS POR PERIODO ==================
app.get('/gastos-periodo', async (req, res) => {
    try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        // Gastos puntuales
        let queryP = "SELECT IFNULL(SUM(monto),0) as total FROM gastos_puntuales WHERE fecha BETWEEN ? AND ?";
        const paramsP = [desde, hasta];
        if (categoria_id) { queryP += " AND categoria_id=?"; paramsP.push(categoria_id); }
        const totalPuntuales = (await dbGet(queryP, paramsP)).total;

        // Gastos mensuales
        let queryM = "SELECT monto, desde, hasta FROM gastos_mensuales";
        const paramsM = [];
        if (categoria_id) { queryM += " WHERE categoria_id=?"; paramsM.push(categoria_id); }
        const gastosMensuales = await dbAll(queryM, paramsM);

        let totalMensuales = 0;
        gastosMensuales.forEach(g => {
            const gDesde = new Date(g.desde + "-28");
            const gHasta = g.hasta ? new Date(g.hasta + "-28") : new Date(9999,11,31);
            const end = hastaDate < gHasta ? hastaDate : gHasta;
            let current = new Date(gDesde > desdeDate ? gDesde : desdeDate);

            while (current <= end) {
                totalMensuales += g.monto;
                current.setMonth(current.getMonth() + 1);
            }
        });

        res.json({
            totalPuntuales,
            totalMensuales,
            totalGastos: totalPuntuales + totalMensuales
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== INGRESOS POR PERIODO ==================
app.get('/ingresos-periodo', async (req, res) => {
    try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        // Ingresos puntuales
        let queryP = "SELECT IFNULL(SUM(monto),0) as total FROM ingresos_puntuales WHERE fecha BETWEEN ? AND ?";
        const paramsP = [desde, hasta];
        if (categoria_id) { queryP += " AND categoria_id=?"; paramsP.push(categoria_id); }
        const totalPuntuales = (await dbGet(queryP, paramsP)).total;

        // Ingresos mensuales
        let queryM = "SELECT monto, desde, hasta FROM ingresos_mensuales";
        const paramsM = [];
        if (categoria_id) { queryM += " WHERE categoria_id=?"; paramsM.push(categoria_id); }
        const ingresosMensuales = await dbAll(queryM, paramsM);

        let totalMensuales = 0;
        ingresosMensuales.forEach(i => {
            const iDesde = new Date(i.desde + "-28");
            const iHasta = i.hasta ? new Date(i.hasta + "-28") : new Date(9999,11,31);
            const end = hastaDate < iHasta ? hastaDate : iHasta;
            let current = new Date(iDesde > desdeDate ? iDesde : desdeDate);

            while (current <= end) {
                totalMensuales += i.monto;
                current.setMonth(current.getMonth() + 1);
            }
        });

        // Cuenta remunerada (aportaciones iniciales, no los intereses)
        let queryCR = "SELECT monto, desde, hasta FROM cuenta_remunerada";
        const paramsCR = [];
        const cuentaRemunerada = await dbAll(queryCR, paramsCR);

        let totalCuentaRemunerada = 0;
        cuentaRemunerada.forEach(cr => {
            const crDesde = new Date(cr.desde + "-28");
            const crHasta = cr.hasta ? new Date(cr.hasta + "-28") : new Date(9999,11,31);
            const end = hastaDate < crHasta ? hastaDate : crHasta;
            let current = new Date(crDesde > desdeDate ? crDesde : desdeDate);

            while (current <= end) {
                totalCuentaRemunerada += cr.monto;
                current.setMonth(current.getMonth() + 1);
            }
        });

        res.json({
            totalPuntuales,
            totalMensuales,
            totalCuentaRemunerada,
            totalIngresos: totalPuntuales + totalMensuales + totalCuentaRemunerada
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== GASTOS VS MES ==================
app.get('/gastos-mes', async (req,res) => {
    try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const meses = [];
        let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
        const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
        while(current <= end){
            const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
            meses.push({ mes: mesStr, total: 0 });
            current.setMonth(current.getMonth()+1);
        }

        // Gastos puntuales
        let queryP = "SELECT fecha, monto FROM gastos_puntuales WHERE fecha BETWEEN ? AND ?";
        const paramsP = [desde, hasta];
        if(categoria_id){ queryP += " AND categoria_id=?"; paramsP.push(categoria_id); }
        const gastosP = await dbAll(queryP, paramsP);
        gastosP.forEach(g => {
            const mes = g.fecha.slice(0,7);
            const m = meses.find(x=>x.mes===mes);
            if(m) m.total += g.monto;
        });

        // Gastos mensuales
        let queryM = "SELECT monto, desde, hasta FROM gastos_mensuales";
        const paramsM = [];
        if(categoria_id){ queryM += " WHERE categoria_id=?"; paramsM.push(categoria_id); }
        const gastosMensuales = await dbAll(queryM, paramsM);
        gastosMensuales.forEach(g=>{
            const start = new Date(g.desde + "-28");
            const finish = g.hasta ? new Date(g.hasta + "-28") : new Date(9999,11,31);
            const endRef = hastaDate < finish ? hastaDate : finish;

            meses.forEach(m=>{
                const mes28 = new Date(m.mes + "-28");
                if(mes28 >= start && mes28 <= endRef){
                    m.total += g.monto;
                }
            });
        });

        res.json(meses);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== IMPUESTOS POR MES ==================
app.get('/impuestos-mes', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        // Crear array de meses
        const meses = [];
        let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
        const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
        while(current <= end){
            const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
            meses.push({ mes: mesStr, impuestos: 0 });
            current.setMonth(current.getMonth()+1);
        }

        // Impuestos de ingresos puntuales
        const ingresosPBruto = await dbAll(`
            SELECT bruto, monto, fecha 
            FROM ingresos_puntuales 
            WHERE fecha BETWEEN ? AND ? AND bruto IS NOT NULL AND bruto != monto
        `, [desde, hasta]);
        
        ingresosPBruto.forEach(i => {
            const mes = i.fecha.slice(0, 7);
            const m = meses.find(x => x.mes === mes);
            if(m) m.impuestos += i.bruto - i.monto;
        });

        // Impuestos de ingresos mensuales
        const ingresosMBruto = await dbAll(`
            SELECT bruto, monto, desde, hasta 
            FROM ingresos_mensuales 
            WHERE bruto IS NOT NULL AND bruto != monto
        `);
        
        ingresosMBruto.forEach(i => {
            meses.forEach(m => {
                const mes28 = new Date(m.mes + "-28");
                const inicio28 = new Date(i.desde + "-28");
                const fin28 = i.hasta ? new Date(i.hasta + "-28") : new Date(9999, 11, 31);
                
                if(mes28 >= inicio28 && mes28 <= fin28 && mes28 <= hastaDate) {
                    m.impuestos += i.bruto - i.monto;
                }
            });
        });

        res.json(meses);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== INGRESOS POR MES ==================
app.get('/ingresos-mes', async (req,res) => {  
try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const meses = [];
        let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
        const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
        while(current <= end){
            const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
            meses.push({ mes: mesStr, total: 0 });
            current.setMonth(current.getMonth()+1);
        }

        // Ingresos puntuales
        let queryP = "SELECT fecha, monto FROM ingresos_puntuales WHERE fecha BETWEEN ? AND ?";
        const paramsP = [desde, hasta];
        if(categoria_id){ queryP += " AND categoria_id=?"; paramsP.push(categoria_id); }
        const ingresosP = await dbAll(queryP, paramsP);
        ingresosP.forEach(i=>{
            const mes = i.fecha.slice(0,7);
            const m = meses.find(x=>x.mes===mes);
            if(m) m.total += i.monto;
        });

        // Ingresos mensuales
        let queryM = "SELECT monto, desde, hasta FROM ingresos_mensuales";
        const paramsM = [];
        if(categoria_id){ queryM += " WHERE categoria_id=?"; paramsM.push(categoria_id); }
        const ingresosMensuales = await dbAll(queryM, paramsM);
        ingresosMensuales.forEach(i=>{
            const start = new Date(i.desde + "-28");
            const finish = i.hasta ? new Date(i.hasta + "-28") : new Date(9999,11,31);
            const endRef = hastaDate < finish ? hastaDate : finish;

            meses.forEach(m=>{
                const mes28 = new Date(m.mes + "-28");
                if(mes28 >= start && mes28 <= endRef){
                    m.total += i.monto;
                }
            });
        });

        res.json(meses);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});




// ================== AHORROS VS MES ==================
app.get('/ahorros-mes', async (req, res) => {
    try {
        const { desde, hasta, categoria_id } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const meses = [];
        let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
        const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
        while(current <= end){
            const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
            meses.push({ mes: mesStr, ingresos: 0, cuentas_remuneradas: 0, gastos: 0, ahorros: 0 });
            current.setMonth(current.getMonth()+1);
        }

        // ==== Ingresos puntuales ====
        let queryIP = "SELECT fecha, monto FROM ingresos_puntuales WHERE fecha BETWEEN ? AND ?";
        const paramsIP = [desde, hasta];
        if(categoria_id){ queryIP += " AND categoria_id=?"; paramsIP.push(categoria_id); }
        const ingresosP = await dbAll(queryIP, paramsIP);
        ingresosP.forEach(i => {
            const mes = i.fecha.slice(0,7);
            const m = meses.find(x => x.mes === mes);
            if(m) m.ingresos += i.monto;
        });

        // ==== Ingresos mensuales ====
        let queryIM = "SELECT monto, desde, hasta FROM ingresos_mensuales";
        const paramsIM = [];
        if(categoria_id){ queryIM += " WHERE categoria_id=?"; paramsIM.push(categoria_id); }
        const ingresosM = await dbAll(queryIM, paramsIM);
        ingresosM.forEach(i => {
            const start = new Date(i.desde + "-28");
            const finish = i.hasta ? new Date(i.hasta + "-28") : new Date(9999,11,31);
            const endRef = hastaDate < finish ? hastaDate : finish;

            meses.forEach(m => {
                const mes28 = new Date(m.mes + "-28");
                if(mes28 >= start && mes28 <= endRef) m.ingresos += i.monto;
            });
        });

        // ==== Cuenta remunerada ====
        const queryCR = "SELECT monto, aportacion_mensual, interes, desde, hasta FROM cuenta_remunerada";
        const cuentasRemuneradas = await dbAll(queryCR);
        cuentasRemuneradas.forEach(cr => {
            const start = new Date(cr.desde + "-28");
            const finish = cr.hasta ? new Date(cr.hasta + "-28") : new Date(9999,11,31);
            const endRef = hastaDate < finish ? hastaDate : finish;

            // Calcular intereses mes a mes
            const interesesMensuales = calcularInteresesMensuales(cr.monto, cr.aportacion_mensual || 0, cr.interes || 0, cr.desde, cr.hasta);

            meses.forEach(m => {
                const mes28 = new Date(m.mes + "-28");
                if(mes28 >= start && mes28 <= endRef) {
                    m.cuentas_remuneradas += interesesMensuales[m.mes] || 0;
                }
            });
        });

        // ==== Gastos puntuales ====
        let queryGP = "SELECT fecha, monto FROM gastos_puntuales WHERE fecha BETWEEN ? AND ?";
        const paramsGP = [desde, hasta];
        if(categoria_id){ queryGP += " AND categoria_id=?"; paramsGP.push(categoria_id); }
        const gastosP = await dbAll(queryGP, paramsGP);
        gastosP.forEach(g => {
            const mes = g.fecha.slice(0,7);
            const m = meses.find(x => x.mes === mes);
            if(m) m.gastos += g.monto;
        });

        // ==== Gastos mensuales ====
        let queryGM = "SELECT monto, desde, hasta FROM gastos_mensuales";
        const paramsGM = [];
        if(categoria_id){ queryGM += " WHERE categoria_id=?"; paramsGM.push(categoria_id); }
        const gastosM = await dbAll(queryGM, paramsGM);
        gastosM.forEach(g => {
            const start = new Date(g.desde + "-28");
            const finish = g.hasta ? new Date(g.hasta + "-28") : new Date(9999,11,31);
            const endRef = hastaDate < finish ? hastaDate : finish;

            meses.forEach(m => {
                const mes28 = new Date(m.mes + "-28");
                if(mes28 >= start && mes28 <= endRef) m.gastos += g.monto;
            });
        });

        // ==== Calcular ahorros ====
        meses.forEach(m => m.ahorros = (m.ingresos + m.cuentas_remuneradas) - m.gastos);

        res.json(meses);

    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== DASHBOARD GENERAL ==================
app.get('/dashboard', async (req, res) => {
    try {
        const LIMIT = 500; // Limitar a 500 registros por tipo

        const gastos_puntuales = await dbAll(`
            SELECT g.id, g.fecha, g.descripcion, g.monto, c.nombre AS categoria
            FROM gastos_puntuales g
            JOIN categorias c ON g.categoria_id = c.id
            ORDER BY g.fecha DESC
            LIMIT ${LIMIT}
        `);

        const gastos_mensuales = await dbAll(`
            SELECT g.id, g.descripcion, g.monto, g.desde, g.hasta, c.nombre AS categoria
            FROM gastos_mensuales g
            JOIN categorias c ON g.categoria_id = c.id
            ORDER BY g.desde DESC
            LIMIT ${LIMIT}
        `);

        const ingresos_puntuales = await dbAll(`
            SELECT i.id, i.fecha, i.descripcion, i.monto, i.bruto, c.nombre AS categoria
            FROM ingresos_puntuales i
            JOIN categorias c ON i.categoria_id = c.id
            ORDER BY i.fecha DESC
            LIMIT ${LIMIT}
        `);

        const ingresos_mensuales = await dbAll(`
            SELECT i.id, i.descripcion, i.monto, i.bruto, i.desde, i.hasta, c.nombre AS categoria
            FROM ingresos_mensuales i
            JOIN categorias c ON i.categoria_id = c.id
            ORDER BY i.desde DESC
            LIMIT ${LIMIT}
        `);

        const cuenta_remunerada = await dbAll(`
            SELECT cr.id, cr.descripcion, cr.monto, cr.aportacion_mensual, cr.interes, cr.desde, cr.hasta, c.nombre AS categoria
            FROM cuenta_remunerada cr
            JOIN categorias c ON cr.categoria_id = c.id
            ORDER BY cr.desde DESC
            LIMIT ${LIMIT}
        `);

        // Calcular intereses generados para cada cuenta remunerada
        const cuenta_remunerada_con_interes = cuenta_remunerada.map(cr => ({
            ...cr,
            interes_generado: cr.interes ? calcularInteresGenerado(cr.monto, cr.aportacion_mensual || 0, cr.interes, cr.desde, cr.hasta) : 0
        }));

        res.json({
            gastos_puntuales,
            gastos_mensuales,
            ingresos_puntuales,
            ingresos_mensuales,
            cuenta_remunerada: cuenta_remunerada_con_interes
        });

    } catch(err) {
        console.error('Error en /dashboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// ================== CATEGORÍAS POR PERIODO ==================
app.get('/categorias-periodo', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const gastosCat = {};
        const ingresosCat = {};

        // Gastos puntuales
        const gastosP = await dbAll(`
            SELECT g.monto, c.nombre AS categoria
            FROM gastos_puntuales g
            JOIN categorias c ON g.categoria_id = c.id
            WHERE g.fecha BETWEEN ? AND ?
        `, [desde, hasta]);
        gastosP.forEach(g => gastosCat[g.categoria] = (gastosCat[g.categoria] || 0) + g.monto);

        // Gastos mensuales
        const gastosM = await dbAll(`
            SELECT g.monto, g.desde, g.hasta, c.nombre AS categoria
            FROM gastos_mensuales g
            JOIN categorias c ON g.categoria_id = c.id
        `);
        gastosM.forEach(g => {
            const gDesde = new Date(g.desde + "-28");
            const gHasta = g.hasta ? new Date(g.hasta + "-28") : new Date(9999,11,31);
            let current = new Date(Math.max(gDesde, desdeDate));
            current.setDate(28);
            const end = new Date(Math.min(gHasta, hastaDate));
            while(current <= end){
                gastosCat[g.categoria] = (gastosCat[g.categoria] || 0) + g.monto;
                current.setMonth(current.getMonth() + 1);
            }
        });

        // Ingresos puntuales
        const ingresosP = await dbAll(`
            SELECT i.monto, c.nombre AS categoria
            FROM ingresos_puntuales i
            JOIN categorias c ON i.categoria_id = c.id
            WHERE i.fecha BETWEEN ? AND ?
        `, [desde, hasta]);
        ingresosP.forEach(i => ingresosCat[i.categoria] = (ingresosCat[i.categoria] || 0) + i.monto);

        // Ingresos mensuales
        const ingresosM = await dbAll(`
            SELECT i.monto, i.desde, i.hasta, c.nombre AS categoria
            FROM ingresos_mensuales i
            JOIN categorias c ON i.categoria_id = c.id
        `);
        ingresosM.forEach(i => {
            const iDesde = new Date(i.desde + "-28");
            const iHasta = i.hasta ? new Date(i.hasta + "-28") : new Date(9999,11,31);
            let current = new Date(Math.max(iDesde, desdeDate));
            current.setDate(28);
            const end = new Date(Math.min(iHasta, hastaDate));
            while(current <= end){
                ingresosCat[i.categoria] = (ingresosCat[i.categoria] || 0) + i.monto;
                current.setMonth(current.getMonth() + 1);
            }
        });

        res.json({ gastos: gastosCat, ingresos: ingresosCat });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== GASTOS POR CATEGORÍA Y MES ==================
app.get('/gastos-categoria-mes', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);

        const meses = [];
        let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
        const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
        while(current <= end){
            const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
            meses.push(mesStr);
            current.setMonth(current.getMonth() + 1);
        }

        const dataMesCat = {};
        meses.forEach(m => dataMesCat[m] = {});

        // Gastos puntuales
        const gastosP = await dbAll(`
            SELECT g.monto, c.nombre AS categoria, g.fecha
            FROM gastos_puntuales g
            JOIN categorias c ON g.categoria_id = c.id
            WHERE g.fecha BETWEEN ? AND ?
        `, [desde, hasta]);
        gastosP.forEach(g => {
            const mes = g.fecha.slice(0,7);
            if(dataMesCat[mes]) dataMesCat[mes][g.categoria] = (dataMesCat[mes][g.categoria] || 0) + g.monto;
        });

        // Gastos mensuales
        const gastosM = await dbAll(`
            SELECT g.monto, g.desde, g.hasta, c.nombre AS categoria
            FROM gastos_mensuales g
            JOIN categorias c ON g.categoria_id = c.id
        `);
        gastosM.forEach(g => {
            meses.forEach(m => {
                const mes28 = new Date(m + "-28");
                const gDesde = new Date(g.desde + "-28");
                const gHasta = g.hasta ? new Date(g.hasta + "-28") : new Date(9999,11,31);
                if(mes28 >= gDesde && mes28 <= gHasta && mes28 <= hastaDate){
                    dataMesCat[m][g.categoria] = (dataMesCat[m][g.categoria] || 0) + g.monto;
                }
            });
        });

        // Impuestos como categoría "taxes"
        // Impuestos puntuales
        const impuestosP = await dbAll(`
            SELECT i.monto, i.fecha
            FROM impuestos_puntuales i
            WHERE i.fecha BETWEEN ? AND ?
        `, [desde, hasta]);
        impuestosP.forEach(i => {
            const mes = i.fecha.slice(0,7);
            if(dataMesCat[mes]) dataMesCat[mes]['taxes'] = (dataMesCat[mes]['taxes'] || 0) + i.monto;
        });

        // Impuestos mensuales
        const impuestosM = await dbAll(`
            SELECT i.monto, i.desde, i.hasta
            FROM impuestos_mensuales i
        `);
        impuestosM.forEach(i => {
            meses.forEach(m => {
                const mes28 = new Date(m + "-28");
                const iDesde = new Date(i.desde + "-28");
                const iHasta = i.hasta ? new Date(i.hasta + "-28") : new Date(9999,11,31);
                if(mes28 >= iDesde && mes28 <= iHasta && mes28 <= hastaDate){
                    dataMesCat[m]['taxes'] = (dataMesCat[m]['taxes'] || 0) + i.monto;
                }
            });
        });

        res.json(dataMesCat);

    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== RESUMEN PERIODOS ==================
// Cache para resumen de períodos (se actualiza cada 5 minutos)
let resumenCache = null;
let resumenCacheTime = 0;
const CACHE_DURATION = 0.5 * 60 * 1000; // 0.5 minutos

app.get('/resumen-periodos', async (req,res) => {
    try {
        // Verificar si el cache es válido
        const ahora = Date.now();
        if (resumenCache && (ahora - resumenCacheTime) < CACHE_DURATION) {
            return res.json(resumenCache);
        }

        const hoy = new Date();
        const periodos = {
            '1mes': restarFecha(hoy, 1, 'months'),
            '3meses': restarFecha(hoy, 3, 'months'),
            '6meses': restarFecha(hoy, 6, 'months'),
            '1año': restarFecha(hoy, 1, 'years'),
            '5años': restarFecha(hoy, 5, 'years'),
            '10años': restarFecha(hoy, 10, 'years')
        };
        const resultado = {};

        // Cargar datos una sola vez
        const ingresosM = await dbAll(`SELECT monto, desde, hasta FROM ingresos_mensuales LIMIT 1000`);
        const cuentasRemuneradas = await dbAll(`SELECT monto, desde, hasta FROM cuenta_remunerada LIMIT 1000`);
        const gastosM = await dbAll(`SELECT monto, desde, hasta FROM gastos_mensuales LIMIT 1000`);
        const ingresosMBruto = await dbAll(`SELECT bruto, monto, desde, hasta FROM ingresos_mensuales WHERE bruto IS NOT NULL AND bruto != monto LIMIT 1000`);
        const impuestosMensuales = await dbAll(`SELECT monto, desde, hasta FROM impuestos_mensuales LIMIT 1000`);

        for(const [periodo, desde] of Object.entries(periodos)){
            const hasta = hoy;
            const desdeStr = desde.toISOString().slice(0,10);
            const hastaStr = hasta.toISOString().slice(0,10);

            // INGRESOS
            const ingresosP = (await dbGet(`SELECT IFNULL(SUM(monto),0) as total FROM ingresos_puntuales WHERE fecha BETWEEN ? AND ? LIMIT 1000`, [desdeStr, hastaStr])).total;

            let totalIngresosMensuales = 0;
            ingresosM.forEach(i => totalIngresosMensuales += i.monto * contarMesesDesde28(desdeStr, hastaStr, i.desde, i.hasta));

            let totalCuentaRemunerada = 0;
            cuentasRemuneradas.forEach(cr => totalCuentaRemunerada += cr.monto * contarMesesDesde28(desdeStr, hastaStr, cr.desde, cr.hasta));

            const totalIngresos = ingresosP + totalIngresosMensuales + totalCuentaRemunerada;

            // GASTOS
            const gastosP = (await dbGet(`SELECT IFNULL(SUM(monto),0) as total FROM gastos_puntuales WHERE fecha BETWEEN ? AND ? LIMIT 1000`, [desdeStr, hastaStr])).total;

            let totalGastosMensuales = 0;
            gastosM.forEach(g => totalGastosMensuales += g.monto * contarMesesDesde28(desdeStr, hastaStr, g.desde, g.hasta));

            const totalGastos = gastosP + totalGastosMensuales;

            // IMPUESTOS (from ingresos)
            const ingresosPBruto = await dbAll(`SELECT bruto, monto FROM ingresos_puntuales WHERE fecha BETWEEN ? AND ? AND bruto IS NOT NULL AND bruto != monto LIMIT 1000`, [desdeStr, hastaStr]);
            let totalImpuestosPuntuales = 0;
            ingresosPBruto.forEach(i => totalImpuestosPuntuales += i.bruto - i.monto);

            let totalImpuestosMensuales = 0;
            ingresosMBruto.forEach(i => {
                const meses = contarMesesDesde28(desdeStr, hastaStr, i.desde, i.hasta);
                totalImpuestosMensuales += (i.bruto - i.monto) * meses;
            });

            // IMPUESTOS STANDALONE
            const impuestosPuntuales = (await dbGet(`SELECT IFNULL(SUM(monto),0) as total FROM impuestos_puntuales WHERE fecha BETWEEN ? AND ? LIMIT 1000`, [desdeStr, hastaStr])).total;
            
            let totalImpuestosStandaloneMensuales = 0;
            impuestosMensuales.forEach(i => totalImpuestosStandaloneMensuales += i.monto * contarMesesDesde28(desdeStr, hastaStr, i.desde, i.hasta));

            const totalImpuestos = totalImpuestosPuntuales + totalImpuestosMensuales + impuestosPuntuales + totalImpuestosStandaloneMensuales;

            resultado[periodo] = {
                ingresos: parseFloat(totalIngresos.toFixed(2)),
                gastos: parseFloat(totalGastos.toFixed(2)),
                ahorro: parseFloat((totalIngresos - totalGastos).toFixed(2)),
                impuestos: parseFloat(totalImpuestos.toFixed(2))
            };
        }

        // Guardar en cache
        resumenCache = resultado;
        resumenCacheTime = ahora;

        res.json(resultado);

    } catch(err) {
        console.error('Error en /resumen-periodos:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==== Funciones auxiliares ====
function restarFecha(fecha, cantidad, unidad) {
    const nuevaFecha = new Date(fecha);
    if(unidad === 'years') nuevaFecha.setFullYear(nuevaFecha.getFullYear() - cantidad);
    else if(unidad === 'months') nuevaFecha.setMonth(nuevaFecha.getMonth() - cantidad);
    return nuevaFecha;
}

function contarMesesDesde28(desdeStr, hastaStr, inicioRepeticion, finRepeticion){
    const desde = new Date(desdeStr);
    const hasta = new Date(hastaStr);
    const inicio28 = new Date(inicioRepeticion + "-28");
    const fin28 = finRepeticion ? new Date(finRepeticion + "-28") : new Date(9999,11,31);

    let contador = 0;
    let current = new Date(inicio28.getFullYear(), inicio28.getMonth(), 28);

    while(current <= hasta && current <= fin28){
        if(current >= desde) contador++;
        current.setMonth(current.getMonth() + 1);
    }
    return contador;
}

// ================== ERROR HANDLING ==================
// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({ 
        error: err.message || 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;

