const { app } = require('electron')
const path = require('path')

EXT_CONFIGS_DIR = 'extensions_conf';
EXT_DATA_DIR = 'extensions_data'
APPDATA_DIRNAME = 'webpage-accessor';
DATA_CONF_PATH = 'extensions_conf/data.json';
LINUX_AUTOSTART_DIR = path.join(app.getPath('home'), '.config', 'autostart')
// APPDATA_SAFE_OVERRIDE = '';

module.exports = { EXT_CONFIGS_DIR, APPDATA_DIRNAME, DATA_CONF_PATH, EXT_DATA_DIR, LINUX_AUTOSTART_DIR };