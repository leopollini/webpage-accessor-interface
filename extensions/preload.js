const fs = require('fs');
const path = require('path');
const Env = require('../env');
const kleur = require('kleur');

const LOAD_DIR = __dirname;
const BasePreload = require("../lib/BasePreload");

// V2
window.enabled_extensions = []
fs.readdirSync(LOAD_DIR).forEach(function (ext) {
	const preload = path.join(LOAD_DIR, ext, 'preload.js');
	if (!fs.existsSync(preload)) return
	try
	{
		if (Env.DEBUG_MODE)
			console.log('preloadimg', ext + "...");
		const PreloadClass = require(preload);
		if (typeof(PreloadClass) !== typeof(function () {}) || Object.getPrototypeOf(PreloadClass) !== BasePreload) { console.log(kleur.grey("Not loading " + ext + ": not a module")); return } ;
		const t = new PreloadClass();
		window.enabled_extensions.push(t);
		t.__start(ext);
	}
	catch (e)
	{
		if (Env.DEBUG_MODE)
			console.log(ext, "not preloaded", e);
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
