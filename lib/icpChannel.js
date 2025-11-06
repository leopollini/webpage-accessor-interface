const { contextBridge, ipcRenderer, ipcMain } = require('electron');
const kleur = require('kleur');


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
		this.log("sending", method, " request to renderer");
		tab.send(method, contents);
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
		console.log("[", kleur.green("contextBridge"), "]", ...msg);
	}
}

module.exports = ipcChannel;