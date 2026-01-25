const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.json());
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

// ================== CREAR TABLAS ==================

db.serialize(() => {

db.run(`PRAGMA foreign_keys = ON`);

db.run(`
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('gasto','ingreso')) NOT NULL,
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
    categoria_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
)`);

db.run(`
CREATE TABLE IF NOT EXISTS ingresos_mensuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL,
    categoria_id INTEGER NOT NULL,
    desde TEXT NOT NULL,
    hasta TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
)`);
});

// ================== CATEGORÍAS ==================

app.post('/add/categoria', async (req, res) => {
    const { nombre, tipo } = req.body;
    try {
        await dbRun("INSERT INTO categorias (nombre, tipo) VALUES (?, ?)", [nombre, tipo]);
        res.sendStatus(200);
    } catch {
        res.status(400).send("Categoría ya existe");
    }
});

app.get('/categorias', async (req, res) => {
    const gastos = await dbAll("SELECT * FROM categorias WHERE tipo='gasto' ORDER BY nombre");
    const ingresos = await dbAll("SELECT * FROM categorias WHERE tipo='ingreso' ORDER BY nombre");
    res.json({ gastos, ingresos });
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

// ================== INGRESOS ==================

app.post('/add/ingreso_puntual', async (req, res) => {
    const { fecha, descripcion, monto, categoria_id } = req.body;
    await dbRun(`
        INSERT INTO ingresos_puntuales (fecha, descripcion, monto, categoria_id)
        VALUES (?, ?, ?, ?)
    `, [fecha, descripcion, monto, categoria_id]);
    res.sendStatus(200);
});

app.post('/delete/ingreso_puntual', async (req, res) => {
    await dbRun("DELETE FROM ingresos_puntuales WHERE id = ?", [req.body.id]);
    res.json({ ok: true });
});

app.post('/update/ingreso_puntual', async (req, res) => {
    const { id, fecha, descripcion, monto, categoria } = req.body;
    try {
        // Obtener el id de la categoría desde el nombre
        const cat = await dbGet("SELECT id FROM categorias WHERE nombre = ? AND tipo = 'ingreso'", [categoria]);
        if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
        
        await dbRun(`
            UPDATE ingresos_puntuales 
            SET fecha = ?, descripcion = ?, monto = ?, categoria_id = ?
            WHERE id = ?
        `, [fecha, descripcion, monto, cat.id, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/add/ingreso_mensual', async (req, res) => {
    const { descripcion, monto, categoria_id, desde, hasta } = req.body;
    await dbRun(`
        INSERT INTO ingresos_mensuales (descripcion, monto, categoria_id, desde, hasta)
        VALUES (?, ?, ?, ?, ?)
    `, [descripcion, monto, categoria_id, desde, hasta]);
    res.sendStatus(200);
});

app.post('/delete/ingreso_mensual', async (req, res) => {
    await dbRun("DELETE FROM ingresos_mensuales WHERE id = ?", [req.body.id]);
    res.json({ ok: true });
});

app.post('/update/ingreso_mensual', async (req, res) => {
    const { id, desde, hasta, descripcion, monto, categoria } = req.body;
    try {
        // Obtener el id de la categoría desde el nombre
        const cat = await dbGet("SELECT id FROM categorias WHERE nombre = ? AND tipo = 'ingreso'", [categoria]);
        if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
        
        await dbRun(`
            UPDATE ingresos_mensuales 
            SET desde = ?, hasta = ?, descripcion = ?, monto = ?, categoria_id = ?
            WHERE id = ?
        `, [desde, hasta, descripcion, monto, cat.id, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
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

        res.json({
            totalPuntuales,
            totalMensuales,
            totalIngresos: totalPuntuales + totalMensuales
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

// ================== INGRESOS VS MES ==================
app.get('/ingresos-mes', async (req,res)=>{
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
app.get('/gastos-periodo', (req, res) => {
    const { desde, hasta, categoria_id } = req.query;
    if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

    const desdeDate = new Date(desde);
    const hastaDate = new Date(hasta);

    // 1️⃣ Gastos puntuales
    let queryP = "SELECT IFNULL(SUM(monto),0) as total FROM gastos_puntuales WHERE fecha BETWEEN ? AND ?";
    const paramsP = [desde, hasta];
    if (categoria_id) { queryP += " AND categoria_id=?"; paramsP.push(categoria_id); }
    const totalPuntuales = db.prepare(queryP).get(...paramsP).total;

    // 2️⃣ Gastos mensuales (regla del 28)
    let queryM = "SELECT monto, desde, hasta FROM gastos_mensuales";
    const paramsM = [];
    if (categoria_id) { queryM += " WHERE categoria_id=?"; paramsM.push(categoria_id); }
    const gastosMensuales = db.prepare(queryM).all(...paramsM);

    let totalMensuales = 0;

    gastosMensuales.forEach(g => {
        // Fechas reales de cobro (día 28)
        const gDesde = new Date(g.desde + "-28");
        const gHasta = g.hasta ? new Date(g.hasta + "-28") : new Date(9999, 11, 31);

        // Recorte al rango solicitado
        const end = hastaDate < gHasta ? hastaDate : gHasta;
        let current = new Date(gDesde > desdeDate ? gDesde : desdeDate);

        // Contar solo meses cuyo 28 esté dentro del rango
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
});

// ================== TOTAL INGRESOS POR PERIODO ==================
app.get('/ingresos-periodo', (req, res) => {
    const { desde, hasta, categoria_id } = req.query;
    if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

    const desdeDate = new Date(desde);
    const hastaDate = new Date(hasta);

    // 1️⃣ Ingresos puntuales
    let queryP = "SELECT IFNULL(SUM(monto),0) as total FROM ingresos_puntuales WHERE fecha BETWEEN ? AND ?";
    const paramsP = [desde, hasta];
    if (categoria_id) { queryP += " AND categoria_id=?"; paramsP.push(categoria_id); }
    const totalPuntuales = db.prepare(queryP).get(...paramsP).total;

    // 2️⃣ Ingresos mensuales (regla 28)
    let queryM = "SELECT monto, desde, hasta FROM ingresos_mensuales";
    const paramsM = [];
    if (categoria_id) { queryM += " WHERE categoria_id=?"; paramsM.push(categoria_id); }
    const ingresosMensuales = db.prepare(queryM).all(...paramsM);

    let totalMensuales = 0;
    ingresosMensuales.forEach(i => {
        const iDesde = new Date(i.desde + "-28");
        const iHasta = i.hasta ? new Date(i.hasta + "-28") : new Date(9999, 11, 31);
        const end = hastaDate < iHasta ? hastaDate : iHasta;

        let current = new Date(iDesde > desdeDate ? iDesde : desdeDate);

        while (current <= end) {
            totalMensuales += i.monto;
            current.setMonth(current.getMonth() + 1);
        }
    });

    res.json({ totalPuntuales, totalMensuales, totalIngresos: totalPuntuales + totalMensuales });
});


// ================== GASTOS VS MES ==================
app.get('/gastos-mes', (req,res)=>{
    const { desde, hasta, categoria_id } = req.query;
    if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

    const desdeDate = new Date(desde);
    const hastaDate = new Date(hasta);

    // Crear array de meses
    const meses = [];
    let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
    const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
    while(current <= end){
        const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
        meses.push({ mes: mesStr, total: 0 });
        current.setMonth(current.getMonth()+1);
    }

    // Fecha de referencia para la regla del 28
    const fechaReferencia = hastaDate;

    // ==== Gastos puntuales ====
    let queryP = "SELECT fecha, monto FROM gastos_puntuales WHERE fecha BETWEEN ? AND ?";
    const paramsP = [desde, hasta];
    if(categoria_id){ queryP += " AND categoria_id=?"; paramsP.push(categoria_id); }
    db.prepare(queryP).all(...paramsP).forEach(g=>{
        const mes = g.fecha.slice(0,7);
        const m = meses.find(x=>x.mes===mes);
        if(m) m.total += g.monto;
    });

    // ==== Gastos mensuales (regla 28) ====
    let queryM = "SELECT monto, desde, hasta FROM gastos_mensuales";
    const paramsM = [];
    if(categoria_id){ queryM += " WHERE categoria_id=?"; paramsM.push(categoria_id); }
    db.prepare(queryM).all(...paramsM).forEach(g=>{
        const start = new Date(g.desde + "-28");
        const finish = g.hasta ? new Date(g.hasta + "-28") : new Date(9999,11,31);
        const end = fechaReferencia < finish ? fechaReferencia : finish;

        meses.forEach(m=>{
            const mes28 = new Date(m.mes + "-28");
            if(mes28 >= start && mes28 <= end){
                m.total += g.monto;
            }
        });
    });

    res.json(meses);
});

// ================== INGRESOS VS MES ==================
app.get('/ingresos-mes', (req,res)=>{
    const { desde, hasta, categoria_id } = req.query;
    if (!desde || !hasta) return res.status(400).send("Debes enviar desde y hasta en formato YYYY-MM-DD");

    const desdeDate = new Date(desde);
    const hastaDate = new Date(hasta);

    // Crear array de meses
    const meses = [];
    let current = new Date(desdeDate.getFullYear(), desdeDate.getMonth(), 1);
    const end = new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1);
    while(current <= end){
        const mesStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
        meses.push({ mes: mesStr, total: 0 });
        current.setMonth(current.getMonth()+1);
    }

    // Fecha de referencia: hasta que el usuario indicó
    const fechaReferencia = hastaDate;

    // ==== Ingresos puntuales ====
    let queryP = "SELECT fecha, monto FROM ingresos_puntuales WHERE fecha BETWEEN ? AND ?";
    const paramsP = [desde, hasta];
    if(categoria_id){ queryP += " AND categoria_id=?"; paramsP.push(categoria_id); }
    db.prepare(queryP).all(...paramsP).forEach(i=>{
        const mes = i.fecha.slice(0,7);
        const m = meses.find(x=>x.mes===mes);
        if(m) m.total += i.monto;
    });

    // ==== Ingresos mensuales (regla 28) ====
    let queryM = "SELECT monto, desde, hasta FROM ingresos_mensuales";
    const paramsM = [];
    if(categoria_id){ queryM += " WHERE categoria_id=?"; paramsM.push(categoria_id); }
    db.prepare(queryM).all(...paramsM).forEach(i=>{
        const start = new Date(i.desde + "-28");
        const finish = i.hasta ? new Date(i.hasta + "-28") : new Date(9999,11,31);
        const end = fechaReferencia < finish ? fechaReferencia : finish;

        meses.forEach(m=>{
            const mes28 = new Date(m.mes + "-28");
            if(mes28 >= start && mes28 <= end){
                m.total += i.monto;
            }
        });
    });

    res.json(meses);
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
            meses.push({ mes: mesStr, ingresos: 0, gastos: 0, ahorros: 0 });
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
        meses.forEach(m => m.ahorros = m.ingresos - m.gastos);

        res.json(meses);

    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== DASHBOARD GENERAL ==================
app.get('/dashboard', async (req, res) => {
    try {
        const gastos_puntuales = await dbAll(`
            SELECT g.id, g.fecha, g.descripcion, g.monto, c.nombre AS categoria
            FROM gastos_puntuales g
            JOIN categorias c ON g.categoria_id = c.id
            ORDER BY g.fecha DESC
        `);

        const gastos_mensuales = await dbAll(`
            SELECT g.id, g.descripcion, g.monto, g.desde, g.hasta, c.nombre AS categoria
            FROM gastos_mensuales g
            JOIN categorias c ON g.categoria_id = c.id
            ORDER BY g.desde DESC
        `);

        const ingresos_puntuales = await dbAll(`
            SELECT i.id, i.fecha, i.descripcion, i.monto, c.nombre AS categoria
            FROM ingresos_puntuales i
            JOIN categorias c ON i.categoria_id = c.id
            ORDER BY i.fecha DESC
        `);

        const ingresos_mensuales = await dbAll(`
            SELECT i.id, i.descripcion, i.monto, i.desde, i.hasta, c.nombre AS categoria
            FROM ingresos_mensuales i
            JOIN categorias c ON i.categoria_id = c.id
            ORDER BY i.desde DESC
        `);

        res.json({
            gastos_puntuales,
            gastos_mensuales,
            ingresos_puntuales,
            ingresos_mensuales
        });

    } catch(err) {
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

        res.json(dataMesCat);

    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== RESUMEN PERIODOS ==================
app.get('/resumen-periodos', async (req,res) => {
    try {
        const hoy = new Date();
        const periodos = {
            '10años': restarFecha(hoy, 10, 'years'),
            '5años': restarFecha(hoy, 5, 'years'),
            '1año': restarFecha(hoy, 1, 'years'),
            '6meses': restarFecha(hoy, 6, 'months'),
            '3meses': restarFecha(hoy, 3, 'months'),
            '1mes': restarFecha(hoy, 1, 'months')
        };
        const resultado = {};

        for(const [periodo, desde] of Object.entries(periodos)){
            const hasta = hoy;
            const desdeStr = desde.toISOString().slice(0,10);
            const hastaStr = hasta.toISOString().slice(0,10);

            const ingresosP = (await dbGet(`SELECT IFNULL(SUM(monto),0) as total FROM ingresos_puntuales WHERE fecha BETWEEN ? AND ?`, [desdeStr, hastaStr])).total;
            const ingresosM = await dbAll(`SELECT monto, desde, hasta FROM ingresos_mensuales`);

            let totalIngresosMensuales = 0;
            ingresosM.forEach(i => totalIngresosMensuales += i.monto * contarMesesDesde28(desdeStr, hastaStr, i.desde, i.hasta));

            const totalIngresos = ingresosP + totalIngresosMensuales;

            const gastosP = (await dbGet(`SELECT IFNULL(SUM(monto),0) as total FROM gastos_puntuales WHERE fecha BETWEEN ? AND ?`, [desdeStr, hastaStr])).total;
            const gastosM = await dbAll(`SELECT monto, desde, hasta FROM gastos_mensuales`);

            let totalGastosMensuales = 0;
            gastosM.forEach(g => totalGastosMensuales += g.monto * contarMesesDesde28(desdeStr, hastaStr, g.desde, g.hasta));

            const totalGastos = gastosP + totalGastosMensuales;
            resultado[periodo] = {
                ingresos: parseFloat(totalIngresos.toFixed(2)),
                gastos: parseFloat(totalGastos.toFixed(2)),
                ahorro: parseFloat((totalIngresos - totalGastos).toFixed(2))
            };
        }

        res.json(resultado);

    } catch(err) {
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




module.exports = app;

