const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '..', 'finanzas.db');

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('gasto','ingreso','impuestos')) NOT NULL,
      UNIQUE(nombre, tipo)
  )`,
  `CREATE TABLE IF NOT EXISTS gastos_puntuales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      categoria_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS gastos_mensuales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      categoria_id INTEGER NOT NULL,
      desde TEXT NOT NULL,
      hasta TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS ingresos_puntuales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      bruto REAL DEFAULT NULL,
      categoria_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS ingresos_mensuales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      bruto REAL DEFAULT NULL,
      categoria_id INTEGER NOT NULL,
      desde TEXT NOT NULL,
      hasta TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS impuestos_puntuales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      categoria_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS impuestos_mensuales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      categoria_id INTEGER NOT NULL,
      desde TEXT NOT NULL,
      hasta TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS hucha (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concepto TEXT NOT NULL,
      cantidad REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS cuenta_remunerada (
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
  )`,
  `CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      ticker TEXT NOT NULL,
      shares REAL NOT NULL,
      purchase_price REAL NOT NULL,
      categoria_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS gastos_reales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      categoria_id INTEGER NOT NULL,
      archivo_origen TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS ingresos_reales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      categoria_id INTEGER NOT NULL,
      archivo_origen TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  )`
];

const indexStatements = [
  `CREATE INDEX IF NOT EXISTS idx_gastos_puntuales_fecha ON gastos_puntuales(fecha)`,
  `CREATE INDEX IF NOT EXISTS idx_gastos_puntuales_categoria ON gastos_puntuales(categoria_id)`,
  `CREATE INDEX IF NOT EXISTS idx_gastos_mensuales_desde ON gastos_mensuales(desde)`,
  `CREATE INDEX IF NOT EXISTS idx_gastos_mensuales_hasta ON gastos_mensuales(hasta)`,
  `CREATE INDEX IF NOT EXISTS idx_gastos_mensuales_categoria ON gastos_mensuales(categoria_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ingresos_puntuales_fecha ON ingresos_puntuales(fecha)`,
  `CREATE INDEX IF NOT EXISTS idx_ingresos_puntuales_categoria ON ingresos_puntuales(categoria_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ingresos_mensuales_desde ON ingresos_mensuales(desde)`,
  `CREATE INDEX IF NOT EXISTS idx_ingresos_mensuales_hasta ON ingresos_mensuales(hasta)`,
  `CREATE INDEX IF NOT EXISTS idx_ingresos_mensuales_categoria ON ingresos_mensuales(categoria_id)`,
  `CREATE INDEX IF NOT EXISTS idx_impuestos_puntuales_fecha ON impuestos_puntuales(fecha)`,
  `CREATE INDEX IF NOT EXISTS idx_impuestos_puntuales_categoria ON impuestos_puntuales(categoria_id)`,
  `CREATE INDEX IF NOT EXISTS idx_impuestos_mensuales_desde ON impuestos_mensuales(desde)`,
  `CREATE INDEX IF NOT EXISTS idx_impuestos_mensuales_hasta ON impuestos_mensuales(hasta)`,
  `CREATE INDEX IF NOT EXISTS idx_impuestos_mensuales_categoria ON impuestos_mensuales(categoria_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cuenta_remunerada_desde ON cuenta_remunerada(desde)`,
  `CREATE INDEX IF NOT EXISTS idx_cuenta_remunerada_hasta ON cuenta_remunerada(hasta)`,
  `CREATE INDEX IF NOT EXISTS idx_assets_ticker ON assets(ticker)`,
  `CREATE INDEX IF NOT EXISTS idx_assets_categoria ON assets(categoria_id)`
];

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function formatDateFull(year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${dd}/${mm}/${year}`;
}

function formatDateMonth(year, month) {
  const mm = String(month).padStart(2, '0');
  return `${year}-${mm}`;
}

async function seed() {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const db = new sqlite3.Database(dbPath);

  try {
    for (const stmt of schemaStatements) {
      await run(db, stmt);
    }

    for (const stmt of indexStatements) {
      await run(db, stmt);
    }

    const categorias = [
      { nombre: 'Housing', tipo: 'gasto' },
      { nombre: 'Groceries', tipo: 'gasto' },
      { nombre: 'Transport', tipo: 'gasto' },
      { nombre: 'Health', tipo: 'gasto' },
      { nombre: 'Leisure', tipo: 'gasto' },
      { nombre: 'Subscriptions', tipo: 'gasto' },
      { nombre: 'Education', tipo: 'gasto' },
      { nombre: 'Salary', tipo: 'ingreso' },
      { nombre: 'Freelance', tipo: 'ingreso' },
      { nombre: 'Investments', tipo: 'ingreso' },
      { nombre: 'Dividends', tipo: 'ingreso' },
      { nombre: 'Sales', tipo: 'ingreso' },
      { nombre: 'Assets', tipo: 'ingreso' },
      { nombre: 'Withholding', tipo: 'impuestos' },
      { nombre: 'VAT', tipo: 'impuestos' },
      { nombre: 'Other', tipo: 'impuestos' }
    ];

    for (const cat of categorias) {
      await run(db, `INSERT INTO categorias (nombre, tipo) VALUES (?, ?)`, [cat.nombre, cat.tipo]);
    }

    const catRows = await all(db, `SELECT id, nombre, tipo FROM categorias`);
    const catMap = Object.fromEntries(catRows.map(r => [`${r.tipo}:${r.nombre}`, r.id]));

    const monthlyExpenses = [
      { descripcion: 'Rent', monto: 1050, categoria: 'Housing' },
      { descripcion: 'Groceries', monto: 420, categoria: 'Groceries' },
      { descripcion: 'Public transport', monto: 95, categoria: 'Transport' },
      { descripcion: 'Health insurance', monto: 180, categoria: 'Health' },
      { descripcion: 'Digital subscriptions', monto: 38, categoria: 'Subscriptions' }
    ];

    for (const item of monthlyExpenses) {
      await run(db, `
        INSERT INTO gastos_mensuales (descripcion, monto, categoria_id, desde, hasta)
        VALUES (?, ?, ?, ?, ?)
      `, [
        item.descripcion,
        item.monto,
        catMap[`gasto:${item.categoria}`],
        formatDateMonth(2024, 1),
        formatDateMonth(2026, 12)
      ]);
    }

    const monthlyIncome = [
      { descripcion: 'Primary salary', monto: 3200, bruto: 3800, categoria: 'Salary' },
      { descripcion: 'Retainer freelance', monto: 750, bruto: 900, categoria: 'Freelance' }
    ];

    for (const item of monthlyIncome) {
      await run(db, `
        INSERT INTO ingresos_mensuales (descripcion, monto, bruto, categoria_id, desde, hasta)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        item.descripcion,
        item.monto,
        item.bruto,
        catMap[`ingreso:${item.categoria}`],
        formatDateMonth(2024, 1),
        formatDateMonth(2026, 12)
      ]);
    }

    const monthlyTaxes = [
      { descripcion: 'Salary withholding', monto: 420, categoria: 'Withholding' },
      { descripcion: 'Services VAT', monto: 120, categoria: 'VAT' }
    ];

    for (const item of monthlyTaxes) {
      await run(db, `
        INSERT INTO impuestos_mensuales (descripcion, monto, categoria_id, desde, hasta)
        VALUES (?, ?, ?, ?, ?)
      `, [
        item.descripcion,
        item.monto,
        catMap[`impuestos:${item.categoria}`],
        formatDateMonth(2024, 1),
        formatDateMonth(2026, 12)
      ]);
    }

    const gastosPuntuales = [
      { fecha: formatDateFull(2024, 2, 15), descripcion: 'Car repair', monto: 620, categoria: 'Transport' },
      { fecha: formatDateFull(2024, 6, 20), descripcion: 'Summer trip', monto: 1200, categoria: 'Leisure' },
      { fecha: formatDateFull(2025, 1, 10), descripcion: 'Online course', monto: 250, categoria: 'Education' },
      { fecha: formatDateFull(2025, 9, 5), descripcion: 'New glasses', monto: 180, categoria: 'Health' },
      { fecha: formatDateFull(2026, 3, 8), descripcion: 'Kitchen remodel', monto: 1450, categoria: 'Housing' }
    ];

    for (const item of gastosPuntuales) {
      await run(db, `
        INSERT INTO gastos_puntuales (fecha, descripcion, monto, categoria_id)
        VALUES (?, ?, ?, ?)
      `, [item.fecha, item.descripcion, item.monto, catMap[`gasto:${item.categoria}`]]);
    }

    const ingresosPuntuales = [
      { fecha: formatDateFull(2024, 4, 5), descripcion: 'Special project', monto: 1600, bruto: 1900, categoria: 'Freelance' },
      { fecha: formatDateFull(2025, 7, 12), descripcion: 'Equipment sale', monto: 820, bruto: 820, categoria: 'Sales' },
      { fecha: formatDateFull(2026, 6, 30), descripcion: 'Performance bonus', monto: 2400, bruto: 2800, categoria: 'Salary' }
    ];

    for (const item of ingresosPuntuales) {
      await run(db, `
        INSERT INTO ingresos_puntuales (fecha, descripcion, monto, bruto, categoria_id)
        VALUES (?, ?, ?, ?, ?)
      `, [item.fecha, item.descripcion, item.monto, item.bruto, catMap[`ingreso:${item.categoria}`]]);
    }

    const impuestosPuntuales = [
      { fecha: formatDateFull(2024, 4, 30), descripcion: 'Quarterly VAT payment', monto: 380, categoria: 'VAT' },
      { fecha: formatDateFull(2025, 10, 15), descripcion: 'Tax adjustment', monto: 540, categoria: 'Other' }
    ];

    for (const item of impuestosPuntuales) {
      await run(db, `
        INSERT INTO impuestos_puntuales (fecha, descripcion, monto, categoria_id)
        VALUES (?, ?, ?, ?)
      `, [item.fecha, item.descripcion, item.monto, catMap[`impuestos:${item.categoria}`]]);
    }

    const huchaMovimientos = [
      { concepto: 'Vacation savings', cantidad: 600 },
      { concepto: 'Emergency fund', cantidad: 1500 },
      { concepto: 'Laptop goal', cantidad: 900 }
    ];

    for (const item of huchaMovimientos) {
      await run(db, `
        INSERT INTO hucha (concepto, cantidad)
        VALUES (?, ?)
      `, [item.concepto, item.cantidad]);
    }

    await run(db, `
      INSERT INTO cuenta_remunerada (descripcion, monto, aportacion_mensual, interes, interes_generado, categoria_id, desde, hasta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Premium savings account',
      12000,
      200,
      2.8,
      680,
      catMap['ingreso:Investments'],
      formatDateMonth(2024, 1),
      formatDateMonth(2026, 12)
    ]);

    await run(db, `
      INSERT INTO assets (company, ticker, shares, purchase_price, categoria_id)
      VALUES (?, ?, ?, ?, ?)
    `, ['TechNova', 'TNV', 28, 145.5, catMap['ingreso:Assets']]);

    await run(db, `
      INSERT INTO assets (company, ticker, shares, purchase_price, categoria_id)
      VALUES (?, ?, ?, ?, ?)
    `, ['GreenGrid', 'GRD', 42, 88.3, catMap['ingreso:Assets']]);

    const gastosReales = [
      { fecha: formatDateFull(2026, 1, 12), descripcion: 'Restaurant', monto: 48.5, categoria: 'Leisure' },
      { fecha: formatDateFull(2026, 2, 2), descripcion: 'Fuel', monto: 74.2, categoria: 'Transport' },
      { fecha: formatDateFull(2026, 2, 18), descripcion: 'Pharmacy', monto: 32.1, categoria: 'Health' }
    ];

    for (const item of gastosReales) {
      await run(db, `
        INSERT INTO gastos_reales (fecha, descripcion, monto, categoria_id, archivo_origen)
        VALUES (?, ?, ?, ?, ?)
      `, [item.fecha, item.descripcion, item.monto, catMap[`gasto:${item.categoria}`], 'extracto_banco.csv']);
    }

    const ingresosReales = [
      { fecha: formatDateFull(2026, 1, 30), descripcion: 'Client payment', monto: 980, categoria: 'Freelance' },
      { fecha: formatDateFull(2026, 2, 5), descripcion: 'Dividend payout', monto: 210, categoria: 'Dividends' }
    ];

    for (const item of ingresosReales) {
      await run(db, `
        INSERT INTO ingresos_reales (fecha, descripcion, monto, categoria_id, archivo_origen)
        VALUES (?, ?, ?, ?, ?)
      `, [item.fecha, item.descripcion, item.monto, catMap[`ingreso:${item.categoria}`], 'extracto_banco.csv']);
    }

    console.log('✅ finanzas.db generado con datos de muestra');
  } finally {
    db.close();
  }
}

seed().catch((err) => {
  console.error('❌ Error generando finanzas.db:', err);
  process.exitCode = 1;
});
