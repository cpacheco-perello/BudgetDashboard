const { app: electronApp, BrowserWindow } = require('electron');
const server = require('./app'); // tu Express app

let mainWindow;

async function startApp() {
    try {
        const PORT = 3000; // fijo, evita problemas con ESM

        // Iniciar backend
        const srv = server.listen(PORT, () => {
            console.log(`Backend escuchando en http://localhost:${PORT}`);

            // Crear ventana principal solo cuando el backend esté listo
            mainWindow = new BrowserWindow({
                width: 1200,
                height: 800,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            mainWindow.loadURL(`http://localhost:${PORT}`);

            mainWindow.on('closed', () => {
                mainWindow = null;
            });
        });

        srv.on('error', (err) => {
            console.error('❌ No se pudo iniciar el servidor. Tal vez el puerto 3000 está ocupado.', err);
        });

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
