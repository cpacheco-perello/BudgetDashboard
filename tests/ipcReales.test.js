jest.mock('electron');

const { registerIpcHandlers } = require('../src/ipc/ipcHandlers');
const { runMigrations } = require('../src/database/migrationRunner');
const db = require('../src/config/database');
const { dbGet } = require('../src/utils/dbHelpers');
const { __handlers } = require('electron');
const fs = require('fs');
const path = require('path');

describe('IPC CRUD - todas las tablas', () => {
    let gastoCategoriaId;
    let ingresoCategoriaId;
    let impuestoCategoriaId;
    const createdUsers = [];

    const call = (name, payload) => {
        const handler = __handlers.get(name);
        if (!handler) {
            throw new Error(`Handler no registrado: ${name}`);
        }
        return handler(null, payload);
    };

    beforeAll(async () => {
        await runMigrations();
        registerIpcHandlers();

        await call('add-categoria', { nombre: 'Gasto Base', tipo: 'gasto' });
        await call('add-categoria', { nombre: 'Ingreso Base', tipo: 'ingreso' });
        await call('add-categoria', { nombre: 'Impuesto Base', tipo: 'impuestos' });

        const gastoRow = await dbGet(db, "SELECT id FROM categorias WHERE nombre = ? AND tipo = ?", ['Gasto Base', 'gasto']);
        const ingresoRow = await dbGet(db, "SELECT id FROM categorias WHERE nombre = ? AND tipo = ?", ['Ingreso Base', 'ingreso']);
        const impuestoRow = await dbGet(db, "SELECT id FROM categorias WHERE nombre = ? AND tipo = ?", ['Impuesto Base', 'impuestos']);

        gastoCategoriaId = gastoRow.id;
        ingresoCategoriaId = ingresoRow.id;
        impuestoCategoriaId = impuestoRow.id;
    });

    afterAll(async () => {
        await new Promise((resolve, reject) => {
            db.close(err => (err ? reject(err) : resolve()));
        });

        const usersRoot = path.join(process.cwd(), 'usuarios');
        createdUsers.forEach(name => {
            const userDir = path.join(usersRoot, name);
            if (fs.existsSync(userDir)) {
                fs.rmSync(userDir, { recursive: true, force: true });
            }
        });

        const currentUserFile = path.join(usersRoot, '.current_user.json');
        if (fs.existsSync(currentUserFile)) {
            fs.rmSync(currentUserFile, { force: true });
        }
    });

    test('categorias: add/update/delete', async () => {
        await call('add-categoria', { nombre: 'Temp Cat', tipo: 'gasto' });
        const tempRow = await dbGet(db, "SELECT id, nombre FROM categorias WHERE nombre = ? AND tipo = ?", ['Temp Cat', 'gasto']);
        expect(tempRow.nombre).toBe('Temp Cat');

        await call('update-categoria', { id: tempRow.id, nombre: 'Temp Cat 2' });
        const updated = await dbGet(db, "SELECT nombre FROM categorias WHERE id = ?", [tempRow.id]);
        expect(updated.nombre).toBe('Temp Cat 2');

        await call('delete-categoria', { id: tempRow.id });
        const deleted = await dbGet(db, "SELECT id FROM categorias WHERE id = ?", [tempRow.id]);
        expect(deleted).toBeUndefined();
    });

    test('gastos puntuales: add/update/delete', async () => {
        await call('add-gasto-puntual', {
            fecha: '2026-01-02',
            descripcion: 'Gasto puntual',
            monto: 10.5,
            categoria_id: gastoCategoriaId
        });
        const row = await dbGet(db, "SELECT id, descripcion FROM gastos_puntuales LIMIT 1");
        await call('update-gasto-puntual', { id: row.id, descripcion: 'Gasto puntual editado', monto: 12 });
        const updated = await dbGet(db, "SELECT descripcion, monto FROM gastos_puntuales WHERE id = ?", [row.id]);
        expect(updated.descripcion).toBe('Gasto puntual editado');

        await call('delete-gasto-puntual', { id: row.id });
        const deleted = await dbGet(db, "SELECT id FROM gastos_puntuales WHERE id = ?", [row.id]);
        expect(deleted).toBeUndefined();
    });

    test('gastos mensuales: add/update/delete', async () => {
        await call('add-gasto-mensual', {
            descripcion: 'Gasto mensual',
            monto: 30,
            categoria_id: gastoCategoriaId,
            desde: '2026-01',
            hasta: '2026-03'
        });
        const row = await dbGet(db, "SELECT id FROM gastos_mensuales LIMIT 1");
        await call('update-gasto-mensual', { id: row.id, descripcion: 'Gasto mensual editado', monto: 35 });
        const updated = await dbGet(db, "SELECT descripcion, monto FROM gastos_mensuales WHERE id = ?", [row.id]);
        expect(updated.descripcion).toBe('Gasto mensual editado');

        await call('delete-gasto-mensual', { id: row.id });
        const deleted = await dbGet(db, "SELECT id FROM gastos_mensuales WHERE id = ?", [row.id]);
        expect(deleted).toBeUndefined();
    });

    test('ingresos puntuales: add/update/delete', async () => {
        await call('add-ingreso-puntual', {
            fecha: '2026-01-05',
            descripcion: 'Ingreso puntual',
            monto: 100,
            bruto: 120,
            categoria_id: ingresoCategoriaId
        });
        const row = await dbGet(db, "SELECT id FROM ingresos_puntuales LIMIT 1");
        await call('update-ingreso-puntual', { id: row.id, descripcion: 'Ingreso puntual editado', monto: 110, bruto: 130 });
        const updated = await dbGet(db, "SELECT descripcion, monto, bruto FROM ingresos_puntuales WHERE id = ?", [row.id]);
        expect(updated.descripcion).toBe('Ingreso puntual editado');

        await call('delete-ingreso-puntual', { id: row.id });
        const deleted = await dbGet(db, "SELECT id FROM ingresos_puntuales WHERE id = ?", [row.id]);
        expect(deleted).toBeUndefined();
    });

    test('ingresos mensuales: add/update/delete', async () => {
        await call('add-ingreso-mensual', {
            descripcion: 'Ingreso mensual',
            monto: 1000,
            bruto: 1200,
            categoria_id: ingresoCategoriaId,
            desde: '2026-01',
            hasta: '2026-03'
        });
        const row = await dbGet(db, "SELECT id FROM ingresos_mensuales LIMIT 1");
        await call('update-ingreso-mensual', { id: row.id, descripcion: 'Ingreso mensual editado', monto: 1100, bruto: 1300 });
        const updated = await dbGet(db, "SELECT descripcion, monto, bruto FROM ingresos_mensuales WHERE id = ?", [row.id]);
        expect(updated.descripcion).toBe('Ingreso mensual editado');

        await call('delete-ingreso-mensual', { id: row.id });
        const deleted = await dbGet(db, "SELECT id FROM ingresos_mensuales WHERE id = ?", [row.id]);
        expect(deleted).toBeUndefined();
    });

    test('impuestos puntuales: add/update/delete', async () => {
        await call('add-impuesto-puntual', {
            fecha: '2026-01-07',
            descripcion: 'Impuesto puntual',
            monto: 15,
            categoria_id: impuestoCategoriaId
        });
        const row = await dbGet(db, "SELECT id FROM impuestos_puntuales LIMIT 1");
        await call('update-impuesto-puntual', { id: row.id, descripcion: 'Impuesto puntual editado', monto: 18 });
        const updated = await dbGet(db, "SELECT descripcion, monto FROM impuestos_puntuales WHERE id = ?", [row.id]);
        expect(updated.descripcion).toBe('Impuesto puntual editado');

        await call('delete-impuesto-puntual', { id: row.id });
        const deleted = await dbGet(db, "SELECT id FROM impuestos_puntuales WHERE id = ?", [row.id]);
        expect(deleted).toBeUndefined();
    });

    test('impuestos mensuales: add/update/delete', async () => {
        await call('add-impuesto-mensual', {
            descripcion: 'Impuesto mensual',
            monto: 20,
            categoria_id: impuestoCategoriaId,
            desde: '2026-01',
            hasta: '2026-02'
        });
        const row = await dbGet(db, "SELECT id FROM impuestos_mensuales LIMIT 1");
        await call('update-impuesto-mensual', { id: row.id, descripcion: 'Impuesto mensual editado', monto: 22 });
        const updated = await dbGet(db, "SELECT descripcion, monto FROM impuestos_mensuales WHERE id = ?", [row.id]);
        expect(updated.descripcion).toBe('Impuesto mensual editado');

        await call('delete-impuesto-mensual', { id: row.id });
        const deleted = await dbGet(db, "SELECT id FROM impuestos_mensuales WHERE id = ?", [row.id]);
        expect(deleted).toBeUndefined();
    });

    test('reales: add/update/delete', async () => {
        await call('add-gasto-real', {
            fecha: '2026-01-10',
            descripcion: 'Gasto real',
            monto: 3.5,
            categoria_id: gastoCategoriaId,
            archivo_origen: 'manual'
        });

        await call('add-ingreso-real', {
            fecha: '2026-01-11',
            descripcion: 'Ingreso real',
            monto: 1200,
            categoria_id: ingresoCategoriaId,
            archivo_origen: 'manual'
        });

        const gastoRow = await dbGet(db, "SELECT id FROM gastos_reales LIMIT 1");
        await call('update-gasto-real', { id: gastoRow.id, descripcion: 'Gasto real editado' });
        const gastoUpdated = await dbGet(db, "SELECT descripcion FROM gastos_reales WHERE id = ?", [gastoRow.id]);
        expect(gastoUpdated.descripcion).toBe('Gasto real editado');

        const ingresoRow = await dbGet(db, "SELECT id FROM ingresos_reales LIMIT 1");
        await call('delete-ingreso-real', { id: ingresoRow.id });
        const ingresoDeleted = await dbGet(db, "SELECT id FROM ingresos_reales WHERE id = ?", [ingresoRow.id]);
        expect(ingresoDeleted).toBeUndefined();
    });

    test('hucha: add/update/delete', async () => {
        await call('add-hucha', { concepto: 'Hucha test', cantidad: 50 });
        const row = await dbGet(db, "SELECT id FROM hucha LIMIT 1");
        await call('update-hucha', { id: row.id, concepto: 'Hucha editada', cantidad: 75 });
        const updated = await dbGet(db, "SELECT concepto, cantidad FROM hucha WHERE id = ?", [row.id]);
        expect(updated.concepto).toBe('Hucha editada');

        await call('delete-hucha', { id: row.id });
        const deleted = await dbGet(db, "SELECT id FROM hucha WHERE id = ?", [row.id]);
        expect(deleted).toBeUndefined();
    });

    test('cuenta remunerada: add/update/delete', async () => {
        await call('add-cuenta-remunerada', {
            descripcion: 'Cuenta test',
            monto: 1000,
            aportacion_mensual: 50,
            interes: 2.5,
            categoria_id: ingresoCategoriaId,
            desde: '2026-01',
            hasta: '2026-06'
        });
        const row = await dbGet(db, "SELECT id FROM cuenta_remunerada LIMIT 1");
        await call('update-cuenta-remunerada', {
            id: row.id,
            descripcion: 'Cuenta editada',
            monto: 1100,
            aportacion_mensual: 60,
            interes: 2.8,
            categoria_id: ingresoCategoriaId,
            desde: '2026-01',
            hasta: '2026-06'
        });
        const updated = await dbGet(db, "SELECT descripcion, monto FROM cuenta_remunerada WHERE id = ?", [row.id]);
        expect(updated.descripcion).toBe('Cuenta editada');

        await call('delete-cuenta-remunerada', { id: row.id });
        const deleted = await dbGet(db, "SELECT id FROM cuenta_remunerada WHERE id = ?", [row.id]);
        expect(deleted).toBeUndefined();
    });

    test('assets: add/update/delete', async () => {
        await call('add-asset', {
            company: 'Empresa Test',
            ticker: 'TST',
            shares: 2,
            purchase_price: 100
        });

        const row = await dbGet(db, "SELECT id FROM assets LIMIT 1");
        await call('update-asset', {
            id: row.id,
            company: 'Empresa Editada',
            ticker: 'TST',
            shares: 3,
            purchase_price: 110
        });
        const updated = await dbGet(db, "SELECT company, shares FROM assets WHERE id = ?", [row.id]);
        expect(updated.company).toBe('Empresa Editada');

        await call('delete-asset', { id: row.id });
        const deleted = await dbGet(db, "SELECT id FROM assets WHERE id = ?", [row.id]);
        expect(deleted).toBeUndefined();
    });

    test('usuarios: carpetas y datos aislados', async () => {
        const userA = `test_user_a_${Date.now()}`;
        const userB = `test_user_b_${Date.now()}`;
        createdUsers.push(userA, userB);

        await call('create-user', { name: userA });
        await call('create-user', { name: userB });

        const list = await call('list-users');
        expect(list.users).toEqual(expect.arrayContaining([userA, userB]));

        await call('set-current-user', { name: userA });
        await call('add-categoria', { nombre: 'Solo A', tipo: 'gasto' });
        const catA = await dbGet(db, "SELECT nombre FROM categorias WHERE nombre = ?", ['Solo A']);
        expect(catA.nombre).toBe('Solo A');

        await call('set-current-user', { name: userB });
        const catB = await dbGet(db, "SELECT nombre FROM categorias WHERE nombre = ?", ['Solo A']);
        expect(catB).toBeUndefined();

        await call('add-categoria', { nombre: 'Solo B', tipo: 'gasto' });
        const catB2 = await dbGet(db, "SELECT nombre FROM categorias WHERE nombre = ?", ['Solo B']);
        expect(catB2.nombre).toBe('Solo B');

        await call('set-current-user', { name: userA });
        const catA2 = await dbGet(db, "SELECT nombre FROM categorias WHERE nombre = ?", ['Solo A']);
        const catA3 = await dbGet(db, "SELECT nombre FROM categorias WHERE nombre = ?", ['Solo B']);
        expect(catA2.nombre).toBe('Solo A');
        expect(catA3).toBeUndefined();

        const usersRoot = path.join(process.cwd(), 'usuarios');
        const userAFinanzas = path.join(usersRoot, userA, 'finanzas', 'finanzas.db');
        const userAUploads = path.join(usersRoot, userA, 'uploads', 'importaciones');
        const userBFinanzas = path.join(usersRoot, userB, 'finanzas', 'finanzas.db');
        const userBUploads = path.join(usersRoot, userB, 'uploads', 'importaciones');

        expect(fs.existsSync(userAFinanzas)).toBe(true);
        expect(fs.existsSync(userAUploads)).toBe(true);
        expect(fs.existsSync(userBFinanzas)).toBe(true);
        expect(fs.existsSync(userBUploads)).toBe(true);
    });
});
