const { WebContentsView } = require('electron');
const path = require('../../lib/path2');
const TabsManager = require('../../lib/TabsManager');
const url = require('url');
const fs = require('fs');
const icpChannel = require('../../lib/icpChannel');
const Env = require('../../env');
const { getPageTitle } = require('../../lib/utils');

// Sample Module. Plase copy-paste this file into new module's main folder
class Toolbar extends require('../../lib/BaseModule')
{
	MODULE_NAME = "toolbar";    // MUST be the same as the 'extension' field in config.json
	static toolbar_tab;
	tabs_count = 0;
	track_active_tab = false;
	first_avoided = false;

	// required_modules = ['window-events'];

	onNewTabCreated(new_tab, old_tab)
	{
		new_tab.webContents.setWindowOpenHandler((details) => {
			this.log('preventing window creation by opening new tab at', details.url);
			if (this.__conf.allow_target_blank == true)
				this.requestNewTab(details.url);
			return {action: 'deny'}
		});
		this.log('done set');
	}

	setup()
	{
		if (this.__conf.hidden != true)
		{
			Toolbar.toolbar_tab = new WebContentsView({
			webPreferences: {
				preload: path.join(__dirname, '../single_preload.js'),
				additionalArguments: ['--load-only=' + path.join(__dirname, 'toolbar_preload.js')],
				...Env.WEBVIEW_DEFAULT_PREFERENCES
			}});

			this.tab = Toolbar.toolbar_tab;

			Toolbar.toolbar_tab.webContents.loadURL(url.format({
				pathname: path.join(__dirname, this.__conf.toolbar_html),
				protocol: 'file'
			}));

			this.warn({height: this.__conf.toolbar_width});
			if (this.__conf.default_url.protocol == 'file') this.__conf.default_url.pathname = path.join(__dirname, this.__conf.default_url.pathname);
			TabsManager.newSideTab(Toolbar.toolbar_tab, 'toolbar', {height: this.__conf.toolbar_width});
			TabsManager.newDefaultBounds({y: this.__conf.toolbar_width});


			this.newCtrlShortcut('r', () => { Toolbar.toolbar_tab.webContents.reload(); });
			
			fs.watch(__dirname, (event) => {if (event == "change") {Toolbar.toolbar_tab.webContents.reload(); this.log(this.__conf.toolbar_html, "has been modified! Reloading toolbar.")}});

			icpChannel.newMainHandler('created-tab', (_, tab_url) => this.createNewTab(url.format(this.__conf.default_url)));
			icpChannel.newMainHandler('switch-tab', (_, index) => this.setActiveTab(index));
			icpChannel.newMainHandler('close-tab', (_, index) => this.closeTab(index));

			Toolbar.toolbar_tab.webContents.openDevTools({mode: 'detach'});
		}
	}

	late_setup()
	{
		if (this.__conf.create_on_open == true)
			this.requestNewTab();
	}

	// this method can be called from ANYWHERE (after initialization), thanks to the singleton behaviour of the modules.
	async requestNewTab(req_url = this.__conf.default_url)
	{
		icpChannel.sendSignalToRender('create-tab', Toolbar.toolbar_tab, await this.createNewTab(typeof(req_url) == 'string' ? req_url : url.format(req_url), true));
	}

	// force_url can be set to true ONLY from this extension's context, NOT from the browser's new tab request
	async createNewTab(requested_url, force_url = false)
	{
		const newTab = new WebContentsView({
		webPreferences: {
			preload: path.join(__dirname, '../preload.js'), // Secure bridge
			...Env.WEBVIEW_DEFAULT_PREFERENCES
		}});
		TabsManager.setNewTab(newTab, "tab_" + this.tabs_count++);
		const tab_url = force_url ? requested_url : url.format(this.__conf.default_url);
		newTab.webContents.loadURL(tab_url);
		this.log("Created new tab at url:", tab_url);
		return getPageTitle(newTab.webContents);
	}

	setActiveTab(index) {
		if (index < 0 || index >= this.tabs_count) return;
		TabsManager.setTab(/*index == 0 ? 'main' : */'tab_' + index);
		// mainWindow.webContents.send("tab-switched", { index });
	}

	closeTab(tabId)
	{
		TabsManager.closeTab(tabId);
	}
} 

module.exports = Toolbar;