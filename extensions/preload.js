const fs = require('fs');
const path = require('path');
const Env = require('../env');
const kleur = require('kleur');

const LOAD_DIR = __dirname;
const BasePreload = require("../lib/BasePreload");


async function preload_extension(preload_dir, extension_name)
{
	try
	{
		if (Env.DEBUG_MODE)
			console.log('preloadimg', extension_name + "...");
		const PreloadClass = require(preload_dir);
		if (typeof(PreloadClass) !== typeof(function () {}) || Object.getPrototypeOf(PreloadClass) !== BasePreload) { console.log(kleur.grey("Not loading " + ext + ": not a module")); return } ;
		const t = new PreloadClass();
		window.enabled_extensions.push(t);
		await t.__start(extension_name);
	}
	catch (e)
	{
		if (Env.DEBUG_MODE)
			console.log(extension_name, "not preloaded", e);
	}
}

window.enabled_extensions = []
fs.readdirSync(LOAD_DIR).forEach(async function (extension_name) {
	const preload_dir = path.join(LOAD_DIR, extension_name, 'preload.js');
	if (!fs.existsSync(preload_dir)) return
	await preload_extension(preload_dir, extension_name);
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
