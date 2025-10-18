const { ipcRenderer, ipcMain } = require('electron')

class ipcChannel
{
	static methods_list_main = [];
	static methods_list_rend = [];

	static newMainHandler(method_name, callback)
	{
		ipcMain.handle(method_name, callback);
		this.methods_list_main.push(method_name);
	}

	static newRendererHandler(method_name, callback)
	{
		ipcRenderer.on(method_name, callback);
		this.methods_list_rend.push(method_name);
	}

	static sendSignalToRender(method, tab, contents)
	{
		// if (!this.methods_list_rend.find((s) => s == method))
		// 	console.log("Method not registered!!");
		tab.send(method, contents);
	}

	static sendSignalToMain(method, contents)
	{
		// if (!this.methods_list_main.find((s) => s == method))
		// 	console.log("Method not registered!!");
		return ipcRenderer.invoke(method, contents);
	}

	static async sendSignalToMainSync(method, contents)
	{
		return await ipcRenderer.invoke(method, contents);
	}
}

module.exports = ipcChannel;