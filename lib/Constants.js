const { app } = require('electron')
const path = require('path')
const os = require('os');

// APPDATA_SAFE_OVERRIDE = '';

module.exports = 
{
    EXT_CONFIGS_DIR: 'extensions_conf',
    EXT_DATA_DIR: 'extensions_data',
    APPDATA_DIRNAME: 'webpage-accessor',
    DATA_CONF_PATH: 'extensions_conf/data.json',
    LINUX_AUTOSTART_DIR: path.join(app.getPath('home'), '.config', 'autostart'),
    OPERATIVE_SYSTEM: os.platform()
};