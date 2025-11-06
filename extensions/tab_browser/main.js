const { WebContentsView } = require('electron');
const path = require('../../lib/path2');
const TabsManager = require('../../lib/TabsManager');
const url = require('url');
const fs = require('fs');
const icpChannel = require('../../lib/icpChannel');

// Sample Module. Plase copy-paste this file into new module's main folder
class Toolbar extends require('../../lib/BaseModule')
{
	MODULE_NAME = "toolbar";    // MUST be the same as the 'extension' field in config.json
	toolbar_tab;
	tabs_count = 1;
	track_active_tab = false;

	// required_modules = ['window-events'];

	setup()
	{
		if (this.__conf.hidden != true)
		{
			this.toolbar_tab = new WebContentsView({
			webPreferences: {
				preload: path.join(__dirname, '../single_preload.js'),
				additionalArguments: ['--load-only=' + path.join(__dirname, 'toolbar_preload.js')],
				contextIsolation: true,
				nodeIntegration: false,
				sandbox: false
			}});
			this.tab = this.toolbar_tab;

			this.toolbar_tab.webContents.loadURL(url.format({
				pathname: path.join(__dirname, this.__conf.toolbar_html),
				protocol: 'file'
			}));

			this.warn({height: this.__conf.toolbar_width});
			TabsManager.newSideTab(this.toolbar_tab, 'toolbar', {height: this.__conf.toolbar_width});
			TabsManager.newDefaultBounds({y: this.__conf.toolbar_width});


			this.newCtrlShortcut('r', () => { this.toolbar_tab.webContents.reload(); });
			
			fs.watch(__dirname, (event) => {if (event == "change") {this.toolbar_tab.webContents.reload(); this.log(this.__conf.toolbar_html, "has been modified! Reloading toolbar.")}});

			icpChannel.newMainHandler('create-tab', (_, tab_url) => this.createNewTab(url.format(this.__conf.default_url)));
			icpChannel.newMainHandler('switch-tab', (_, index) => this.setActiveTab(index));

			
			this.toolbar_tab.webContents.openDevTools({mode: 'detach'});
		}
	}

	createNewTab(page_url)
	{
		const newTab = new WebContentsView({
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false
		}});

		const tab_url = url.format({pathname: 'service.parchotels.it', protocol: 'https'});
		newTab.webContents.loadURL(tab_url);
		TabsManager.setNewTab(newTab, "tab_" + this.tabs_count++);
		this.log("Created new tab at url:", tab_url);
	}

	setActiveTab(index) {
	if (index < 0 || index >= this.tabs_count) return;
	TabsManager.setTab(index == 0 ? 'main' : 'tab_' + index);
	// mainWindow.webContents.send("tab-switched", { index });
	}
} 

module.exports = Toolbar;