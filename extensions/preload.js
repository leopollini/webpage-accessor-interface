const fs = require('fs');
const path = require('path');
const Env = require('../env');

const LOAD_DIR = __dirname;

// V2
fs.readdirSync(LOAD_DIR).forEach(function (ext) {
	const preload = path.join(LOAD_DIR, ext, 'preload.js');
	if (!fs.existsSync(preload)) return
	try
	{
		require(preload);
		if (Env.DEBUG_MODE)
			console.log(ext, "preloaded");
	}
	catch (e)
	{
		console.log('Module', ext, 'not loaded:', e);
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
