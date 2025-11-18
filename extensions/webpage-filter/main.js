const url = require('url');
const Toolbar = require('../toolbar/main');
const BaseModule = require('../../lib/BaseModule');

class WebpageFilter extends BaseModule
{
	MODULE_NAME = 'webpage-filter';

	onNewTabCreated(newTab)
	{
		newTab.webContents.once('did-start-navigation', (event, req_url) => {
			this.warn('Checking url:', req_url);
			this.log('CLOSE?:', this.isBadPage(url.parse(req_url)));
			// 	new Toolbar().requestCloseTab(newTab);
		});
	}

	// false -> page OK. true -> page NOT OK.
	isBadPage(page_info)
	{
		// this.warn("Trying to create a page at", page_info);
		return page_info.protocol == 'file';
	}
}

module.exports = WebpageFilter;