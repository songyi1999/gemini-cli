const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const GoogleOAuth = require('electron-google-oauth');
const Store = require('electron-store');

const store = new Store();

let mainWindow;
let settingsWindow;

function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 300,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  settingsWindow.loadFile('settings.html');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (mainWindow === null) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

let chatHistory = [];

ipcMain.on('send-message', (event, message) => {
  chatHistory.push({ role: 'user', parts: [{ text: message }] });

  const apiKey = store.get('apiKey');
  const proxy = store.get('proxy');

  const env = { ...process.env };
  if (apiKey) {
    env.GEMINI_API_KEY = apiKey;
  }
  if (proxy) {
    env.HTTPS_PROXY = proxy;
  }

  const gemini = spawn('gemini', [JSON.stringify(chatHistory)], { env });

  let geminiResponse = '';

  gemini.stdout.on('data', (data) => {
    geminiResponse += data.toString();
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
    if (code === 0) {
      chatHistory.push({ role: 'model', parts: [{ text: geminiResponse }] });
    }
  });
});

ipcMain.on('open-settings', () => {
  createSettingsWindow();
});

ipcMain.on('save-settings', (event, settings) => {
  store.set('apiKey', settings.apiKey);
  store.set('proxy', settings.proxy);
  console.log('Settings saved:', settings);
  if (settingsWindow) {
    settingsWindow.close();
  }
});

ipcMain.on('get-settings', (event) => {
  const apiKey = store.get('apiKey');
  const proxy = store.get('proxy');
  event.sender.send('load-settings', { apiKey, proxy });
});

ipcMain.on('login', (event) => {
  const googleOauth = new GoogleOAuth({
    clientId: 'YOUR_CLIENT_ID', // Replace with your client ID
    clientSecret: 'YOUR_CLIENT_SECRET', // Replace with your client secret
    redirectUri: 'http://localhost:8080'
  });

  googleOauth.getAccessToken(['https://www.googleapis.com/auth/userinfo.email'])
    .then(token => {
      console.log('Token:', token);
      event.sender.send('login-reply', { success: true });
    })
    .catch(err => {
      console.error('Login error:', err);
      event.sender.send('login-reply', { success: false, error: err });
    });
});
