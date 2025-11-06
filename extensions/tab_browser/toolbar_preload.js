const { ipcRenderer } = require('electron');

class Toolbar_preload extends require('../../lib/BasePreload.js')
{
    MODULE_NAME = "toolbar";
	contextbridge_expose = {
		'manage_tabs': {
			createdTab: (url) => ipcRenderer.invoke("created-tab", url),
			switchTab: (index) => ipcRenderer.invoke("switch-tab", index),
			closeTab: (index) => ipcRenderer.invoke("close-tab", index),
			onDoCreateTab: (cb) => ipcRenderer.on("create-tab", (_, data) => cb(data))
		}
	}
}

module.exports = Toolbar_preload;