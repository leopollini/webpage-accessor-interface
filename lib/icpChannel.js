const { contextBridge, ipcRenderer, ipcMain } = require('electron');
const kleur = require('kleur');
const Env = require('../env');

// static class, used for bidirectional main-renderer communication
class ipcChannel {
	static HIGHLIGHT = true;
	static methods_list_main = [];
	static methods_list_rend = [];

	static newMainHandler(method_name, callback) {
		ipcChannel.log('new main handler registered:', method_name);
		ipcMain.handle(method_name, callback);
		ipcChannel.methods_list_main.push(method_name);
	}

	static newRendererHandler(method_name, callback) {
		ipcChannel.log('new renderer handler registered:', method_name);
		ipcRenderer.on(method_name, callback);
		ipcChannel.methods_list_rend.push(method_name);
	}

	static sendSignalToRender(method, tab, contents) {
		// if (!this.methods_list_rend.find((s) => s == method))
		// 	console.log("Method not registered!!");
		if (!tab || !tab.webContents) return ipcChannel.err('Trying to send a', method, 'to an invalid tab:', tab);
		ipcChannel.log('sending', method, 'request to renderer');
		tab.webContents.send(method, contents);
	}

	static sendSignalToMain(method, contents) {
		// if (!this.methods_list_main.find((s) => s == method))
		// 	console.log("Method not registered!!");
		ipcChannel.log('sending', method, ' request to main');
		return ipcRenderer.invoke(method, contents);
	}

	static async sendSignalToMainSync(method, contents) {
		ipcChannel.log('sending', method, ' request to main');
		return await ipcRenderer.invoke(method, contents);
	}

	static exposeAPI(service_name = 'electronAPI', apis = {}) {
		ipcChannel.log('exposing', apis, 'for', service_name);
		contextBridge.exposeInMainWorld(service_name, apis);
	}

	static exposeContextBridge(obj) {
		for (const [serv, api] of Object.entries(obj)) ipcChannel.exposeAPI(serv, api);
	}

	// Colored logging! Use this instead of console.log()
	static log(...message) {
		if (Env.DEBUG_MODE)
			console.log(
				'[',
				(ipcChannel.HIGHLIGHT ? kleur.bold().green : kleur.green)('contextBridge'),
				']:',
				...message,
			);
	}
	static warn(...message) {
		if (Env.DEBUG_MODE)
			console.log(
				'[',
				(ipcChannel.HIGHLIGHT ? kleur.bold().yellow : kleur.yellow)('contextBridge'),
				']:',
				...message,
			);
	}
	static err(...message) {
		if (Env.DEBUG_MODE)
			console.log('[', (ipcChannel.HIGHLIGHT ? kleur.red().green : kleur.red)('contextBridge'), ']:', ...message);
	}
}

module.exports = ipcChannel;
