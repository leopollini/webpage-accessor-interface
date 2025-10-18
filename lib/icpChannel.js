const { ipcRenderer, ipcMain } = require('electron')

class ipcChannel
{
    static newMainHandler(method_name, callback)
    {
		ipcMain.handle(method_name, callback);
    }

    static newRendererHandler(method_name, callback)
    {
		ipcRenderer.on(method_name, callback);
    }

    static sendSignalToRender(method, tab, contents)
    {
        tab.send(method, contents);
    }

    static sendSignalToMain(method, contents)
    {
        return ipcRenderer.invoke(method, contents);
    }

    static async sendSignalToMainSync(method, contents)
    {
        return await ipcRenderer.invoke(method, contents);
    }
}

module.exports = ipcChannel;