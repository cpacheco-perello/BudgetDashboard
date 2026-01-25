const { app: electronApp, BrowserWindow } = require('electron');
const path = require('path');
const server = require('./app'); // apunta a tu app.js

// Arrancar el backend
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
});

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadURL(`http://localhost:${PORT}`);
}

electronApp.on('ready', createWindow);
