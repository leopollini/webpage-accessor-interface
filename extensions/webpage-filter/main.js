const url = require('url');
const Toolbar = require('../toolbar/main');
const BaseModule = require('../../lib/BaseModule');
const kleur = require('kleur');
const { dialog } = require('electron');

class WebpageFilter extends BaseModule {
	MODULE_NAME = 'webpage-filter';
	// HIGHLIGHT = true;

	setup() {
		if (this.__conf.hosts_blacklist) this.log('Host blacklist:', this.__conf.hosts_blacklist);
		if (this.__conf.hosts_whitelist) this.log('Host whitelist:', this.__conf.hosts_whitelist);
	}

	onNewTabCreated(newTab) {
		let checker = (event, req_url) => {
			this.warn('Checking url:', req_url);
			let parsed = url.parse(req_url)
			if (this.isBadPage(parsed)) {
				event.preventDefault();
				dialog.showMessageBox(this.window, {
					type: 'info',
					title: parsed.host,
					message: 'You are not allowed to navigate here',
					buttons: ['Ok'],
				});
			}
		};

		// newTab.webContents.once('did-start-navigation', checker);
		newTab.webContents.on('will-navigate', checker);
	}

	// false -> page OK. true -> page NOT OK.
	isBadPage(page_info) {
		// this.warn('page info:', page_info);
		let host = page_info.host;
		const host_split = host.split('.');
		if (host_split.length > 2) host = host_split.slice(1, host_split.length - 1).join('');
		let check = () => {
			if (host == 'blank') res = false;
			if (this.__conf.hosts_blacklist && this.__conf.hosts_blacklist.includes(host)) return true;
			if (this.__conf.hosts_whitelist && this.__conf.hosts_whitelist.length != 0)
				return this.__conf.hosts_whitelist.includes(host) ? false : true;
			return false;
		};
		let res = check();
		this.log('detected host:', (res ? kleur.bold().red : kleur.green)(host));
		return res;
	}
}

module.exports = WebpageFilter;
