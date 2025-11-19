const { contextBridge, ipcRenderer, ipcMain } = require('electron');
const kleur = require('kleur');
const Env = require('../env');


class ipcChannel
{
	static methods_list_main = [];
	static methods_list_rend = [];

	static newMainHandler(method_name, callback)
	{
		this.log("new main handler registered:", method_name);
		ipcMain.handle(method_name, callback);
		this.methods_list_main.push(method_name);
	}

	static newRendererHandler(method_name, callback)
	{
		this.log("new renderer handler registered:", method_name);
		ipcRenderer.on(method_name, callback);
		this.methods_list_rend.push(method_name);
	}

	static sendSignalToRender(method, tab, contents)
	{
		// if (!this.methods_list_rend.find((s) => s == method))
		// 	console.log("Method not registered!!");
		if (!tab || !tab.webContents) return this.err('Trying to send a', method, 'to an invalid tab:', tab);
		this.log("sending", method, "request to renderer");
		tab.webContents.send(method, contents);
	}

	static sendSignalToMain(method, contents)
	{
		// if (!this.methods_list_main.find((s) => s == method))
		// 	console.log("Method not registered!!");
		this.log("sending", method, " request to main");
		return ipcRenderer.invoke(method, contents);
	}

	static async sendSignalToMainSync(method, contents)
	{
		this.log("sending", method, " request to main");
		return await ipcRenderer.invoke(method, contents);
	}

	static exposeAPI(service_name = 'electronAPI', apis = {})
	{
		this.log("exposing", apis, "for", service_name);
		contextBridge.exposeInMainWorld(service_name, apis);
	}

	static exposeContextBridge(obj)
	{
		for (const [serv, api] of Object.entries(obj))
			ipcChannel.exposeAPI(serv, api);
	}

	static log(...msg)
	{
		if (Env.DEBUG_MODE)
			console.log("[", kleur.green("contextBridge"), "]", ...msg);
	}
	static warn(...msg)
	{
		if (Env.DEBUG_MODE)
			console.log("[", kleur.yellow("contextBridge"), "]", ...msg);
	}
	static err(...msg)
	{
		if (Env.DEBUG_MODE)
			console.log("[", kleur.red("contextBridge"), "]", ...msg);
	}
}

module.exports = ipcChannel;