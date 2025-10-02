const { WebContentsView } = require('electron');
const TabsManager = require('../../lib/TabsManager');


// Sample Module. Plase copy-paste this file into new module's main folder
class Splashscreen extends require('../../lib/BaseModule')
{
    MODULE_NAME = "splashscreen";    // MUST be the same as the 'extension' field in config.json
    required_modules = ['window-events'];

    setup()
    {
        this.splash = new WebContentsView({
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false
		}});

        // this.window.contentView.addChildView(this.splash);
    
        this.splash.setBounds({x: 0, y: 0  , height: this.window.getContentBounds().height, width: this.window.getContentBounds().width});
    
        this.splash.webContents.loadURL("https://google.com");

        const mainTab = TabsManager.activeTabName;

        TabsManager.setNewTab(this.splash, "splash");

        setTimeout(TabsManager.setTab, 5000, mainTab);
    }
} 

module.exports = Splashscreen;