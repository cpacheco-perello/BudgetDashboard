const handlers = new Map();

const ipcMain = {
    handle: (channel, handler) => {
        handlers.set(channel, handler);
    }
};

module.exports = {
    ipcMain,
    __handlers: handlers
};
