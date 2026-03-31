const BaseModule = require('../../lib/BaseModule');
const { Menu, MenuItem, ipcMain, app } = require('electron');
const TabsManager = require('../../lib/TabsManager');
const ipcChannel = require('../../lib/icpChannel');
const Toolbar = require('../toolbar/main');
const Env = require('../../env');
const Autoupdate = require('../autoupdate/main');

module.exports = class ContextMenu extends BaseModule {
	MODULE_NAME = 'context-menu';

	on_new_tab_created(new_tab) {
		this.log('context-menu registered');
		new_tab.webContents.on('context-menu', (e, params) => {
			const menu = new Menu();

			// 1. NAVIGATION & RELOAD (Always present, like Chrome)
			menu.append(
				new MenuItem({
					label: 'Back',
					enabled: new_tab.webContents.navigationHistory.canGoBack(),
					click: () => new_tab.webContents.navigationHistory.goBack(),
				}),
			);
			menu.append(
				new MenuItem({
					label: 'Forward',
					enabled: new_tab.webContents.navigationHistory.canGoForward(),
					click: () => new_tab.webContents.navigationHistory.goForward(),
				}),
			);
			menu.append(
				new MenuItem({
					label: 'Reload',
					accelerator: 'Ctrl+R', // umm does not work ):
					click: () => new_tab.webContents.reload(),
				}),
			);

			// 2. DATA SPECIFIC: IMAGES
			if (params.mediaType === 'image') {
				menu.append(new MenuItem({ type: 'separator' }));
				menu.append(
					new MenuItem({
						label: 'Copy Image',
						click: () => new_tab.webContents.copyImageAt(params.x, params.y),
					}),
				);
				menu.append(
					new MenuItem({
						label: 'Save Image As...',
						click: () => {
							// You can use dialog.showSaveDialog here
							new_tab.webContents.downloadURL(params.srcURL);
						},
					}),
				);
			}

			// 3. DATA SPECIFIC: LINKS
			if (params.linkURL) {
				menu.append(new MenuItem({ type: 'separator' }));
				menu.append(
					new MenuItem({
						label: 'Open Link in Browser',
						click: () => new Toolbar().requestNewTab(params.linkURL),
					}),
				);
				menu.append(
					new MenuItem({
						label: 'Copy Link Address',
						click: () => {
							require('electron').clipboard.writeText(params.linkURL);
						},
					}),
				);
			}

			// 4. DATA SPECIFIC: TEXT SELECTION
			if (params.selectionText) {
				menu.append(new MenuItem({ type: 'separator' }));
				menu.append(new MenuItem({ role: 'copy' }));
				// menu.append(
				// 	new MenuItem({
				// 		label: `Search Google for "${params.selectionText.trim().substring(0, 20)}..."`,
				// 		click: () => {
				// 			new Toolbar().requestNewTab(
				// 				`https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`
				// 			);
				// 		},
				// 	}),
				// );
			}

			// 5. DATA SPECIFIC: EDITABLE FIELDS (Input/Textarea)
			if (params.isEditable) {
				menu.append(new MenuItem({ type: 'separator' }));
				menu.append(new MenuItem({ role: 'paste' }));
				menu.append(new MenuItem({ role: 'cut' }));
			}

			// 6. DEVELOPER TOOLS (The classic 'Inspect')
			// menu.append(
			// 	new MenuItem({
			// 		label: 'Inspect Element',
			// 		click: () => new_tab.webContents.inspectElement(params.x, params.y),
			// 	}),
			// );

			menu.popup();
		});
	}

	late_setup() {
		try {
			if (Env.DEBUG_MODE)
				Toolbar.toolbar_tab.webContents.on('context-menu', (e, params) => {
					const menu = new Menu();
					menu.append(
						new MenuItem({
							label: 'Clear Configurations',
							click: () => {
								require('../../PackageCreator').clearConfigs();
								app.quit();
							},
						}),
					);
					menu.append(
						new MenuItem({
							label: 'Update check',
							click: () => new Autoupdate().tryUpdate(),
						}),
					);
					menu.append(
						new MenuItem({
							label: 'Do bug',
							click: () => {
								throw new BaseModule.ModuleError('Some unhandled exception');
							},
						}),
					);
					menu.popup();
				});
		} catch {
			// Toolbar module missing
		}
	}
};
