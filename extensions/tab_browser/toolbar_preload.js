const { ipcRenderer } = require('electron');

class Toolbar_preload extends require('../../lib/BasePreload.js')
{
    MODULE_NAME = "toolbar";
	contextbridge_expose = {
		'manage_tabs': {
			createTab: (url) => ipcRenderer.invoke("create-tab", url),
			switchTab: (index) => ipcRenderer.invoke("switch-tab", index),
			onTabSwitched: (cb) => ipcRenderer.on("tab-switched", (_, data) => cb(data))
		}
	}
}

module.exports = Toolbar_preload;