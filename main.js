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
const Toolbar = require('./extensions/toolbar/main');

// During first execution create all config files
app.args = process.argv.slice(3);
app.conf = {};
app.data = {};
app.enabled_modules = [];
app.app_info = {};

Env.ROOT_LOCATION = __dirname;

try {
	console.log("Is Executable TESTS", app.isPackaged, !!process.env.APPIMAGE, require('path').extname(app.getPath('exe')).toLowerCase() === '.exe');
} catch {}
console.log("app root is at", __dirname);
console.log("AppData is at", path.appDataDir);
console.log("Printing Env", Env);
console.log("config.json is at", pc.CONF_FILE_PATH);


async function createMainWindow()
{
	new pc();
	
	if (!pc.PC_SUCCESS)
		return ;
	if (Env.DEBUG_MODE && app.data && app.data.version)
		console.log("### WELCOME TO VERSION", app.data.version, "###");

	const {height, width} = screen.getPrimaryDisplay().workAreaSize;
	app.displaySize = {height: height, width: width}
	// console.log('######## ICON FILE>', fs.existsSync( path.join(__dirname, 'build/icons/icon.png'),));
	const mainWindow = new BaseWindow({
		tabbingIdentifier: "myTabs",
		title: app.app_info.app_name || "Electron",
		width: width / 2,
		height: height / 2,
		fullscreenable: true,
		autoHideMenuBar: true,
		icon: path.join(__dirname, 'build/icons/icon.png'),
	});
	TabsManager.setup(mainWindow);

	console.log("Loading extensions");
	app.enabled_modules = Loader.load(app.data);

	if (Env.DEBUG_MODE)
	{
		checkActiveModules();
	}

	try {
		if (app.data.webpages.length != 0)
		{
			if (new Toolbar().isActive())
				for (let i = 0; i < app.data.webpages.length; i++)
				{
					const PAGE_URL = (app.data && app.data.webpages[i] && url.format(app.data.webpages[i]));
					console.log("## Creating tab at", PAGE_URL);
					new Toolbar().requestNewTab(PAGE_URL);
				}
			else
			{
				// Only one tab since there is no Toolbar :(
				const PAGE_URL = (app.data && app.data.webpages[0] && url.format(app.data.webpages[0]));
				console.log("Loading page:", PAGE_URL);
				const mainTab = new WebContentsView({
					webPreferences: {
						preload: path.join(__dirname, 'extensions/preload.js'), // Secure bridge
						...Env.WEBVIEW_DEFAULT_PREFERENCES
					}});
				mainTab.webContents.loadURL(PAGE_URL);
				TabsManager.setNewTab(mainTab, 'main', true, undefined, null);	// called manually since default tab is created before module initialization (FIX PLEASE)
			}
		}
		else
			console.log("No default page");
	} catch (error) {
		console.log("lel.");
	}

	Loader.lateLoad();
	// mainWindow.maximize();
	
}

// Only main-side!!! Check app console for preload fails
function checkActiveModules()
{
	console.log('CHECKING ACTIVE MODULES:');
	app.enabled_modules.forEach(function (mod) {
		mod.log(mod.isActive() ? kleur.yellow('true') : kleur.red('false') + " (" + (mod.fail_reason ? mod.fail_reason : "unknown") + ")");
	});
	console.log('DONE CHECK');
}

app.on('ready', createMainWindow);

module.exports = { checkActiveModules }
