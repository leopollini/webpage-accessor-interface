const { ipcRenderer } = require('electron');
const BasePreload = require('../../lib/BasePreload.js');

class Toolbar_preload extends BasePreload
{
    MODULE_NAME = "toolbar";
	contextbridge_expose = {
		'manage_tabs': {
			createdTab: (url) => ipcRenderer.invoke("created-tab", url),
			switchTab: (index) => ipcRenderer.invoke("switch-tab", index),
			closeTab: (index) => ipcRenderer.invoke("closed-tab", index),
			onDoCreateTab: (cb) => ipcRenderer.on("create-tab", (_, data) => cb(data)),
			onDoCloseTab: (cb) => ipcRenderer.on("close-tab", (_, data) => cb(data)),
			onRenameTab: (cb) => ipcRenderer.on("rename-tab", (_, data) => cb(data))
		}
	}

	setup() {}
}

module.exports = Toolbar_preload;