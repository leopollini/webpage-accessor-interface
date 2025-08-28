
const path = require('./lib/path2');
const {app, WebContentsView, BaseWindow, screen } = require('electron');
const url = require('url');
const fs = require('fs');
const Env = require('./env');
const pc = require('./PackageCreator');
const kleur = require('kleur');
const { DATA_CONF_PATH } = require('./lib/Constants');

const DATA_FILE_PATH = path.joinAppData(DATA_CONF_PATH, 'data.json');
const LOAD_DIR = path.join(__dirname, 'extensions_main');
const PAGE_URL = url.format({
		pathname: path.join(__dirname, "index.html"),
		// pathname: path.join("reception.parchotels.it"),
		// protocol: 'http'
		protocol: 'file'
	});

const enabled_modules = [];

async function createMainWindow()
{
	// During first execution create all config files
	app.conf = {};
	app.data = {};

	
	// if (!app.data.is_configured) 
		try {new pc()} catch (e) {console.log("### CONFIGURATION FAILED:", e, "###")};

	try {app.data = JSON.parse(fs.readFileSync(DATA_FILE_PATH));}
	catch {console.log('Could not load data file'); } // new pc(); return ;}

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
			console.log("loading", ext);
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
		console.log('CHECKING ACTIVE MODULES:');
		checkActiveModules();
	}
	// mainWindow.maximize();
}

// Only main-side!!! Check app console for preload fails
function checkActiveModules()
{
	enabled_modules.forEach(function (e) {
		e.log(e.isActive());
	});
}

app.on('ready', createMainWindow);
