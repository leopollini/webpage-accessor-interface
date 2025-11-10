const { app } = require('electron');

// utils
function createMouseEvent(name, e)
{
	return new MouseEvent(name, e);
}

// utils
function sendMouseEvent(name, e)
{
	e.target.dispatchEvent(createMouseEvent(name, e));
}

function findAppArg(arg)
{
	if (app.args)
		return app.args.find(function(v) {return v == arg});
	return ;
}

async function getPageTitle(webContents) {
	const check = () => {
		const t = webContents.getTitle();
		return t && t.trim().length > 0;
	};

	if (check()) return webContents.getTitle();

	return new Promise((resolve) => {
		const handler = (_, title) => {
		if (title && title.trim().length > 0) {
			webContents.removeListener('page-title-updated', handler);
			resolve(title);
		}
		};
		webContents.on('page-title-updated', handler);
		webContents.once('did-finish-load', () => {
		if (check()) resolve(webContents.getTitle());
		});
	});
}

module.exports = { createMouseEvent, sendMouseEvent, findAppArg, getPageTitle };