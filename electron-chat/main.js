const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('send-message', (event, message) => {
  const gemini = spawn('gemini', [message]);

  gemini.stdout.on('data', (data) => {
    event.sender.send('reply-message', data.toString());
  });

  gemini.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    event.sender.send('reply-message', `Error: ${data.toString()}`);
  });

  gemini.on('error', (error) => {
    console.error(`spawn error: ${error}`);
    dialog.showErrorBox('Error', 'gemini-cli not found. Please make sure it is installed and in your PATH.');
    event.sender.send('reply-message', 'Error: gemini-cli not found.');
  });

  gemini.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
});
