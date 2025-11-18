const path = require('./lib/path2');
const {app, WebContentsView, BaseWindow, screen } = require('electron');
const url = require('url');
const fs = require('fs');
const Env = require('./env');
const pc = require('./PackageCreator');
const { DATA_FILE_PATH: DATA_CONF_PATH } = require('./lib/Constants');
const TabsManager = require('./lib/TabsManager');
const Loader = require('./extensions/loader');
const kleur = require('kleur');

const DATA_FILE_PATH = path.joinAppData(DATA_CONF_PATH);
const BASE_URL = url.format({
	// pathname: path.join(__dirname, "index.html"),
	pathname: path.join("example.com"),
	protocol: 'https'
	// protocol: 'file'
});

// During first execution create all config files
app.args = process.argv.slice(3);	
app.conf = {};
app.data = {};
app.enabled_modules = [];
app.app_info = {};

new pc();

async function createMainWindow()
{
	if (Env.DEBUG_MODE && app.data && app.data.version)
		console.log("### WELCOME TO VERSION", app.data.version, "###");

	const {height, width} = screen.getPrimaryDisplay().workAreaSize;
	app.displaySize = {height: height, width: width}
	const mainWindow = new BaseWindow({
		tabbingIdentifier: "myTabs",
		title: "Electron",
		// width: width / 2,
		// height: height / 2,
		fullscreenable: true,
		autoHideMenuBar: true,
		icon: path.join(__dirname, 'images/icon.png'),
	});
	TabsManager.setup(mainWindow);

	console.log("Loading extensions");
	app.enabled_modules = Loader.load(app.data);

	if (Env.DEBUG_MODE)
	{
		checkActiveModules();
	}

	Loader.lateLoad();

	if (app.data.webpages.length != 0)
	{
		const mainTab = new WebContentsView({
			webPreferences: {
				preload: path.join(__dirname, 'extensions/preload.js'), // Secure bridge
				...Env.WEBVIEW_DEFAULT_PREFERENCES
			}});
		const PAGE_URL = (app.data && app.data.webpages[0] && url.format(app.data.webpages[0])) || BASE_URL;
		mainTab.webContents.loadURL(PAGE_URL);
		
		TabsManager.setNewTab(mainTab, 'main');	// called manually since default tab is created before module initialization (FIX PLEASE)
		console.log("Loading page:", PAGE_URL);
	}
	// mainWindow.maximize();
}

// Only main-side!!! Check app console for preload fails
function checkActiveModules()
{
	console.log('CHECKING ACTIVE MODULES:');
	app.enabled_modules.forEach(function (e) {
		e.log(e.isActive() ? kleur.yellow('true') : kleur.red('false'));
	});
}

app.on('ready', createMainWindow);

module.exports = { checkActiveModules }
