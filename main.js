const { app: electronApp, BrowserWindow } = require('electron');
const path = require('path');
const { registerIpcHandlers } = require('./src/ipc/ipcHandlers');

let mainWindow;

async function startApp() {
    try {
        console.log('🚀 Iniciando aplicación...');

        // Registrar handlers IPC
        registerIpcHandlers();

        // Crear ventana principal
        mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
                devTools: false
            }
        });

        // Cargar el archivo HTML directamente
        mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

        mainWindow.on('closed', () => {
            mainWindow = null;
        });

        console.log('✅ Aplicación iniciada correctamente');

    } catch (err) {
        console.error('❌ Error iniciando la app:', err);
    }
}

// Eventos de Electron
electronApp.on('ready', startApp);

electronApp.on('window-all-closed', () => {
    if (process.platform !== 'darwin') electronApp.quit();
});

electronApp.on('activate', () => {
    if (!mainWindow) startApp();
});
