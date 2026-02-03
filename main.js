const path = require('./lib/path2');
const { app, WebContentsView, BaseWindow, screen } = require('electron');
const url = require('url');
const Env = require('./env');
const PackageCreator = require('./PackageCreator');
const TabsManager = require('./lib/TabsManager');
const Loader = require('./extensions/loader');
const kleur = require('kleur');
const Toolbar = require('./extensions/toolbar/main');

// setup Globals
app.args = process.argv.slice(3);
app.conf = {};
app.data = {};
app.enabled_modules = [];
app.app_info = {};

Env.ROOT_LOCATION = __dirname;

// Infodump
console.log('app root is at', __dirname);
console.log('AppData is at', path.appDataDir);
console.log('Printing Env', Env);
console.log('config.json is at', PackageCreator.CONF_FILE_PATH);

// Creates window, loads extensions and created default page
async function startApplication() {
	new PackageCreator();

	if (!PackageCreator.PC_SUCCESS) return; // Problems from PackageCreator: Exceptions should be found in the output terminal
	if (Env.DEBUG_MODE && app.data && app.data.version) console.log('### WELCOME TO VERSION', app.data.version, '###');

	const mainWindow = createMainWindow();
	TabsManager.setup(mainWindow);

	console.log('Loading extensions...');
	app.enabled_modules = Loader.load(app.data);
	console.log('Extensions loaded!');

	if (Env.DEBUG_MODE) checkActiveModules();

	loadDefaultWebpage();

	// After all extensions have been started, call LateSetup on every on every extension
	console.log('Calling lateSetup...');
	Loader.lateLoad();
}

function loadDefaultWebpage() {
	try {
		if (app.data.webpages.length != 0) {
			if (new Toolbar().isActive())
				for (let i = 0; i < app.data.webpages.length; i++) {
					const PAGE_URL = app.data && app.data.webpages[i] && url.format(app.data.webpages[i]);
					console.log('## Creating tab at', PAGE_URL);
					new Toolbar().requestNewTab(PAGE_URL);
				}
			else {
				// Only one tab since Toolbar is missing :(
				const PAGE_URL = app.data && app.data.webpages[0] && url.format(app.data.webpages[0]);
				console.log('Loading page:', PAGE_URL);
				const mainTab = new WebContentsView({
					webPreferences: {
						preload: path.join(__dirname, 'extensions/preload.js'), // Secure bridge
						...Env.WEBVIEW_DEFAULT_PREFERENCES,
					},
				});
				mainTab.webContents.loadURL(PAGE_URL);
				TabsManager.setNewTab(mainTab, 'main', true, undefined, null);
			}
		} else console.log('No default page');
	} catch (error) {
		console.log('lel.');
	}
}

function createMainWindow() {
	const { height, width } = screen.getPrimaryDisplay().workAreaSize;
	app.displaySize = { height: height, width: width };
	return new BaseWindow({
		tabbingIdentifier: 'myTabs',
		title: app.app_info.app_name || 'Electron',
		width: width / 2,
		height: height / 2,
		fullscreenable: true,
		autoHideMenuBar: true,
		icon: path.join(__dirname, 'builds/icons/icon.png'),
	});
}

// Only main-side!!! Check app console for preload fails
function checkActiveModules() {
	console.log('CHECKING ACTIVE MODULES:');
	app.enabled_modules.forEach(function (mod) {
		mod.log(mod.status, mod.fail_reason ? '(' + mod.fail_reason + ')' : '');
	});
	console.log('DONE CHECK');
}

app.on('ready', startApplication);

module.exports = { checkActiveModules };
