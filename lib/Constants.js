const { app } = require('electron')
const path = require('path')
const os = require('os');

// APPDATA_SAFE_OVERRIDE = '';

module.exports = 
{
	EXT_CONFIGS_DIR: 'extensions_conf',
	SAMPLE_CONFIGS_DIR: 'sample_configs',
	EXT_DATA_DIR: 'extensions_data',
	APPDATA_DIRNAME: 'webpage_accessor',
	DATA_FILE_PATH: 'data.json',
	LINUX_AUTOSTART_LOCATION: path.join((app ? app.getPath('home') : ""), '.config', 'autostart'),
	OPERATING_SYSTEM: os.platform(),
	HOME_BIN_LINUX: path.join((app ? app.getPath("home") : ""), ".local", "bin")
};