const url = require('url');
const Toolbar = require('../toolbar/main');
const BaseModule = require('../../lib/BaseModule');

class WebpageFilter extends BaseModule
{
	MODULE_NAME = 'webpage-filter';

	setup()
	{
		if (this.__conf.hosts_blacklist)
			this.log('Host blacklist:', this.__conf.hosts_blacklist);
		if (this.__conf.hosts_whitelist)
		this.log('Host whitelist:', this.__conf.hosts_whitelist);
	}

	onNewTabCreated(newTab)
	{
		newTab.webContents.once('did-start-navigation', (event, req_url) => {
			this.warn('Checking url:', req_url);
			if (this.isBadPage(url.parse(req_url)))
				Toolbar.requestCloseTab(newTab);
		});
	}

	// false -> page OK. true -> page NOT OK.
	isBadPage(page_info)
	{
		this.warn('page info:', page_info);
		let host = page_info.host;
		const host_split = host.split('.');
		if (host_split.length > 2)
			host = host_split.slice(1, host_split.length - 1).join("");
		this.warn('detected host:', host);
		if (host == 'blank')
			return false;
		if (this.__conf.hosts_blacklist && this.__conf.hosts_blacklist.includes(host))
			return true;
		if (this.__conf.hosts_whitelist && this.__conf.hosts_whitelist.length != 0)
			return this.__conf.hosts_whitelist.includes(host) ? false : true;
		return false;
	}
}

module.exports = WebpageFilter;