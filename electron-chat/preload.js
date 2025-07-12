const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('send-message', message),
  onReply: (callback) => ipcRenderer.on('reply-message', (event, message) => callback(message))
});
