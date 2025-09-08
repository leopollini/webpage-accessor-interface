
const path = require('./lib/path2');
const {app, WebContentsView, BaseWindow, screen } = require('electron');
const url = require('url');
const fs = require('fs');
const Env = require('./env');
const pc = require('./PackageCreator');
const kleur = require('kleur');
const { DATA_CONF_PATH } = require('./lib/Constants');

const DATA_FILE_PATH = path.joinAppData(DATA_CONF_PATH);
const LOAD_DIR = path.join(__dirname, 'extensions_main');
const PAGE_URL = url.format({
	pathname: path.join(__dirname, "index.html"),
	// pathname: path.join("reception.parchotels.it"),
	// protocol: 'http'
	protocol: 'file'
});

const enabled_modules = [];

// During first execution create all config files
app.args = process.argv.slice(3);	
app.conf = {};
app.data = {};

// loads data file, if present
if (fs.existsSync(DATA_FILE_PATH))
	try {app.data = JSON.parse(fs.readFileSync(DATA_FILE_PATH));}
	catch {console.log('Main: could not load data file'); }
// loads config file
try {app.conf = JSON.parse(fs.readFileSync(pc.CONF_FILE_PATH));}
catch {console.log('Main: could not load data file'); } // new pc(); return ;}


async function createMainWindow()
{
	if (!app.data.is_configured) 
		try {new pc(app.conf)}
		catch (e) {console.log("FAILED:", e)}
		finally {console.log("### CONFIGURATION FINISHED ###")};

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
		autoHideMenuBar: true
	});
	const mainTab = new WebContentsView({
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'), // Secure bridge
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false
		}});


	mainWindow.contentView.addChildView(mainTab);

	mainTab.setBounds({x: 0, y: 0  , height: mainWindow.getContentBounds().height, width: mainWindow.getContentBounds().width});

	mainTab.webContents.loadURL(PAGE_URL);


	// Loads all active modules preload
	fs.readdirSync(LOAD_DIR).forEach(function (ext)
	{
		const fullpath = path.join(LOAD_DIR, ext);
		
		if (Env.DEBUG_MODE)
			console.log("loading", kleur.green(ext));
		try
		{
			const ModuleClass = require(fullpath);
			if (typeof(ModuleClass) !== typeof(function () {})) { console.log(kleur.grey("Not loading " + ext + ": not a module")); return } ;
			const t = new ModuleClass()
			enabled_modules.push(t);
			t.__start(mainWindow, mainTab);
		}
		catch (e)
		{ 
			console.log("Module not loaded:", e);
		}
	});


	mainTab.webContents.toggleDevTools();

	if (Env.DEBUG_MODE)
	{
		checkActiveModules();
	}
	// mainWindow.maximize();
}

// Only main-side!!! Check app console for preload fails
function checkActiveModules()
{
	console.log('CHECKING ACTIVE MODULES:');
	enabled_modules.forEach(function (e) {
		e.log(e.isActive());
	});
}

app.on('ready', createMainWindow);

module.exports = { checkActiveModules }
