const fs = require('fs');
const path = require('path');
const Env = require('./env');

const LOAD_DIR = path.join(__dirname, 'extensions_preload');

// Loads all active modules preload
fs.readdirSync(LOAD_DIR).forEach(function (dir) {
	const fullpath = path.join(LOAD_DIR, dir);
	const stat = fs.statSync(fullpath);
	try
	{
		require(fullpath);
	}
	catch (e)
	{
		console.log('Module', dir, 'not loaded:', e);
	}
	if (Env.DEBUG_MODE)
		console.log('preloaded', dir);
});
