const { ipcRenderer } = require('electron');

const saveButton = document.getElementById('save-button');
const apiKeyInput = document.getElementById('api-key');
const proxyInput = document.getElementById('proxy');

ipcRenderer.on('load-settings', (event, settings) => {
    apiKeyInput.value = settings.apiKey || '';
    proxyInput.value = settings.proxy || '';
});

saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value;
    const proxy = proxyInput.value;

    ipcRenderer.send('save-settings', { apiKey, proxy });
});

ipcRenderer.send('get-settings');
