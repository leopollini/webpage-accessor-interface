const fs = require('fs');
const path = require('path');
const Env = require('../env');

const LOAD_DIR = __dirname;

// V2
window.enabled_extensions = []
fs.readdirSync(LOAD_DIR).forEach(function (ext) {
	const preload = path.join(LOAD_DIR, ext, 'preload.js');
	if (!fs.existsSync(preload)) return
	try
	{
	console.log('preloadimg', preload);
		const PreloadClass = require(preload);
	console.log('preloadimg', preload);
		console.log(new PreloadClass());
		if (typeof(PreloadClass) !== typeof(function () {}) || Object.getPrototypeOf(PreloadClass) !== BasePreload) { console.log(kleur.grey("Not loading " + ext + ": not a module")); return } ;
	console.log('preloadimg', preload);
		// const t = new PreloadClass();
		// enabled_modules.push(t);
		// t.__start(mainWindow, mainTab, data);
	}
	catch (e)
	{
		if (Env.DEBUG_MODE)
			console.log(ext, "not preloaded");
	}
});

// // Loads all active modules preload
// fs.readdirSync(LOAD_DIR).forEach(function (dir) {
// 	const fullpath = path.join(LOAD_DIR, dir);
// 	const stat = fs.statSync(fullpath);
// 	try
// 	{
// 		require(fullpath);
// 	}
// 	catch (e)
// 	{
// 		console.log('Module', dir, 'not loaded:', e);
// 	}
// 	if (Env.DEBUG_MODE)
// 		console.log('preloaded', dir);
// });
