const { contextBridge, ipcRenderer } = require('electron');

function getKeyPlease()
{
	ipcRenderer.invoke('get-key').then(keys => {return keys.machine_id});
}

contextBridge.exposeInMainWorld('electronAPI', {
	readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
	getLocalKey: () => ipcRenderer.invoke('get-key'),
});
