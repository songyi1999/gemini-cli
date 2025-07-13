const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('send-message', message),
  onReply: (callback) => ipcRenderer.on('reply-message', (event, message) => callback(message)),
  openSettings: () => ipcRenderer.send('open-settings'),
  login: () => ipcRenderer.send('login'),
  onLoginReply: (callback) => ipcRenderer.on('login-reply', (event, response) => callback(response))
});
