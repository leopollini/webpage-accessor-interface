const { app } = require('electron');
const url = require('url');

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

function getPageTitle(webContents) {
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

async function getFavIco(domain) {
	// 1. Clean the input to get just the hostname (e.g., service.parchotels.it)
	// console.log("looking for favito at:", domain)
	if (!domain) return ''
    let hostParts = domain.split('.');
    
    // 2. We will try paths from longest to shortest (but stop at the main domain)
    // // Example: ['service', 'parchotels', 'it'] -> service.parchotels.it, then parchotels.it
    // while (hostParts.length >= 2) {
    //     const currentHost = hostParts.join('.');
    //     const iconUrl = `https://${currentHost}/favicon.ico`;

    //     try {
	// 		// console.log("favico checking:", iconUrl)
    //         const response = await fetch(iconUrl, { method: 'HEAD' }); // HEAD is faster; it only checks if file exists
    //         if (response.ok) {
    //             return iconUrl; // Found it!
    //         }
    //     } catch (err) {
    //         console.log(`Failed at ${currentHost}`);
    //     }

    //     hostParts.shift(); // Remove the leftmost subdomain and try again
    // }

    return 'default-icon.png'; // Ultimate fallback
}

module.exports = { createMouseEvent, sendMouseEvent, findAppArg, getPageTitle, getFavIco };