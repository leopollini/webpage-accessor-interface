
const path = require('./lib/path2');
const {app, WebContentsView, BaseWindow, screen, dialog } = require('electron');
const url = require('url');
const fs = require('fs');
const os = require('os');
const Env = require('./env');
const pc = require('./PackageCreator');
const { DATA_CONF_PATH } = require('./lib/Constants');
const TabsManager = require('./lib/TabsManager');

const DATA_FILE_PATH = path.joinAppData(DATA_CONF_PATH);
const PAGE_URL = url.format({
	// pathname: path.join(__dirname, "index.html"),
	pathname: path.join("google.com"),
	protocol: 'https'
	// protocol: 'file'
});

console.log("I AMS", os.platform(), ", AN", os.arch());

// During first execution create all config files
app.args = process.argv.slice(3);	
app.conf = {};
app.data = {};
app.enabled_modules = [];

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
			preload: path.join(__dirname, 'extensions/preload.js'), // Secure bridge
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false
		}});
	TabsManager.setup(mainWindow, mainTab);


	mainTab.setBounds({x: 0, y: 0  , height: mainWindow.getContentBounds().height, width: mainWindow.getContentBounds().width});

	mainTab.webContents.loadURL(PAGE_URL);

	TabsManager.setNewTab(mainTab, 'main');

	app.enabled_modules = require('./extensions/loader').load(mainWindow, mainTab, app.data);

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
	app.enabled_modules.forEach(function (e) {
		e.log(e.isActive());
	});
}

const { autoUpdater } = require('electron-updater')
// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...')
  mainWindow?.webContents.send('update-check', { status: 'checking' })
})

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info)
  mainWindow?.webContents.send('update-available', info)
})

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available', info)
  mainWindow?.webContents.send('update-not-available', info)
})

autoUpdater.on('error', (err) => {
  log.error('Update error:', err)
  mainWindow?.webContents.send('update-error', { message: err == null ? "unknown" : (err.stack || err).toString() })
})

autoUpdater.on('download-progress', (progressObj) => {
  console.log('Download progress', progressObj)
  mainWindow?.webContents.send('update-download-progress', progressObj)
})

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded', info)
  // Option A: prompt user to restart now
  const choice = dialog.showMessageBoxSync(mainWindow, {
    type: 'question',
    buttons: ['Restart and install', 'Later'],
    defaultId: 0,
    cancelId: 1,
    title: 'Update ready',
    message: 'A new version has been downloaded. Restart the application to apply the update?'
  })
  if (choice === 0) {
    // Will quit and install on Windows/macOS (installer-specific)
    autoUpdater.quitAndInstall()
  } else {
    // user deferred; you can install later via IPC call to autoUpdater.quitAndInstall()
    mainWindow?.webContents.send('update-postponed')
  }
})



// app.on('browser-window-created', (event, window) => {
//   console.log('New window created:', window.id);
//   window.close();
//   // You can check window count here
// });


app.on('ready', createMainWindow);

module.exports = { checkActiveModules }
