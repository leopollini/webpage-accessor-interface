const { WebContentsView } = require('electron');
const path = require('../../lib/path2');
const TabsManager = require('../../lib/TabsManager');
const url = require('url');
const icpChannel = require('../../lib/icpChannel');
const Env = require('../../env');
const { getPageTitle } = require('../../lib/utils');
const BaseModule = require('../../lib/BaseModule');
const kleur = require('kleur');

// Sample Module. Plase copy-paste this file into new module's main folder
class Toolbar extends BaseModule {
	MODULE_NAME = 'toolbar'; // MUST be the same as the 'extension' field in config.json
	static toolbar_tab;
	static tabs_count = 0;
	track_active_tab = false;
	first_avoided = false;
	hidden = false;

	on_new_tab_created(new_tab, old_tab) {
		new_tab.webContents.setWindowOpenHandler((details) => {
			this.log('preventing window creation by opening new tab at', details.url);
			// if (this.__conf.allow_target_blank == true) this.requestNewTab(details.url);
			this.focusToolbar();
			return { action: 'deny' };
		});
		this.log('done set');
	}

	setup() {
		this.tab = new WebContentsView({
			webPreferences: {
				preload: path.join(__dirname, '../single_preload.js'),
				additionalArguments: ['--load-only=' + path.join(__dirname, 'toolbar_preload.js')],
				...Env.WEBVIEW_DEFAULT_PREFERENCES,
			},
		});
		Toolbar.toolbar_tab = this.tab;
		this.tab.tab_id = 'toolbar';

		this.tab.webContents.loadURL(
			url.format({
				pathname: path.join(__dirname, this.__conf.toolbar_html),
				protocol: 'file',
			}),
		);
		this.default_page = this.__data.webpages[0];
		this.log('default page:', this.default_page);
		if (!this.default_page || !this.default_page.protocol || !this.default_page.pathname)
			throw new BaseModule.LoadError('Missing default page info.');
		if (this.default_page?.protocol == 'file')
			this.default_page.pathname = path.join(__dirname, this.default_page.pathname);

		this.hidden = this.__conf.hidden === true;
		if (!this.hidden) {
			TabsManager.newSideTab(this.tab, 'toolbar', {
				height: this.__conf.toolbar_width,
			});
			TabsManager.newDefaultBounds({ y: this.__conf.toolbar_width });
		}

		// this.newCtrlShortcut('r', () => { this.tab.webContents.reload(); });

		// fs.watch(__dirname, (event) => {if (event == "change") {this.tab.webContents.reload(); this.log(this.__conf.toolbar_html, "has been modified! Reloading toolbar.")}});

		icpChannel.newMainHandler('created-tab', (_, tab_url) => this.createNewTab(url.format(this.default_page)));
		icpChannel.newMainHandler('closed-tab', (_, index) => this.closeTab(TabsManager.idToName(index)));
		icpChannel.newMainHandler('switch-tab', async (_, index) => {
			this.setActiveTab(index);
		});
	}

	late_setup() {
		if (this.tab) {
			this.tab.devtools_detach = true;
			if (!this.hidden) new (require('../window-events/main'))().on_new_tab_created(this.tab);
			if (this.__data.webpages.length == 0 && this.__conf.create_on_open == true) this.requestNewTab();
		}
	}

	// this method can be called from ANYWHERE (after initialization), thanks to the singleton behaviour of the modules.
	// usage: new Toolbar().requestNewTab(url);
	async requestNewTab(req_url = this.default_page.pathname) {
		icpChannel.sendSignalToRender(
			'create-tab',
			this.tab,
			await this.createNewTab(typeof req_url == 'string' ? req_url : url.format(req_url), true),
		);
	}

	requestCloseTabId(tab_id) {
		this.requestCloseTab(TabsManager.getNameTab(tab_id));
	}

	requestCloseTab(tab) {
		if (!tab || !tab.tab_id) return console.log('[', kleur.green('toolbar'), '] cannot close', tab && tab.tab_id);
		console.log('[', kleur.green('toolbar'), '] closing', tab.tab_id);
		icpChannel.sendSignalToRender('close-tab', Toolbar.toolbar_tab, tab.tab_id.substring(4));
		this.focusToolbar();
		TabsManager.closeTab(tab);
	}

	// force_url can be set to true ONLY from this extension's context, NOT from the browser's new tab request
	async createNewTab(requested_url, force_url = false) {
		const newTab = new WebContentsView({
			webPreferences: {
				preload: path.join(__dirname, '../preload.js'), // Secure bridge
				...Env.WEBVIEW_DEFAULT_PREFERENCES,
			},
		});
		const tab_url = force_url ? requested_url : url.format(this.default_page);
		newTab.webContents.loadURL(tab_url);
		this.log('Created new tab at url:', tab_url, 'name:', 'tab_' + Toolbar.tabs_count);
		this.setContentsUpdateTracker(newTab);
		// this.warn(new url.URL(tab_url));
		return {
			success: await TabsManager.newTab(newTab, 'tab_' + Toolbar.tabs_count++),
			title: await getPageTitle(newTab.webContents),
			id: newTab.tab_id,
			host: new url.URL(tab_url).host,
		};
	}

	async setActiveTab(index) {
		if (index < 0 || index >= Toolbar.tabs_count) return;
		TabsManager.setTab(/*index == 0 ? 'main' : */ 'tab_' + index, true);
		this.backgroundColorChange(TabsManager.getActiveTab());
	}

	closeTab(tab_name) {
		this.log('renderer requested tab close');
		TabsManager.closeTabName(tab_name);
		this.focusToolbar();
	}

	setContentsUpdateTracker(tab) {
		// every time navigation
		tab.webContents.on('did-finish-load', () => {
			this.backgroundColorChange(tab);
		});
		tab.webContents.on('page-title-updated', (e, new_title) => {
			if (tab == TabsManager.getActiveTab()) this.window?.setTitle?.(new_title);
			icpChannel.sendSignalToRender('rename-tab', this.tab, {
				id: tab.tab_id,
				new_title: new_title,
				host: new url.URL(tab.webContents.getURL()).host,
			});
		});
	}

	focusToolbar() {
		this.tab.webContents.focus();
	}

	async backgroundColorChange(tab) {
		if (tab == TabsManager.getActiveTab()) {
			const col = await TabsManager.getActiveTab().webContents.executeJavaScript(
				'window?.getComputedStyle(document.body).backgroundColor;',
			);
			if (tab == TabsManager.getActiveTab())
				icpChannel.sendSignalToRender('update-bg', this.tab, {
					bg_color: col,
				});
		}
	}
}

module.exports = Toolbar;
