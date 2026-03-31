const url = require('url');
const BaseModule = require('../../lib/BaseModule');
const kleur = require('kleur');
const { dialog, session } = require('electron');

class WebpageFilter extends BaseModule {
	MODULE_NAME = 'webpage-filter';
	HIGHLIGHT = true;

	blocked_cache = {};

	setup() {
		if (this.__conf.hosts_blacklist) this.log('Hosts blacklist:', this.__conf.hosts_blacklist);
		if (this.__conf.hosts_whitelist) this.log('Hosts whitelist:', this.__conf.hosts_whitelist);
		session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
			// this.warn('Checking url:', req_url);
			const urlobj = new url.URL(details.url);
			const t = this.blocked_cache[urlobj.host];
			if (['mainFrame', 'fetch', 'script', 'subFrame'].includes(details.resourceType)) {
			this.log(details.resourceType);
				if (t || (t === undefined && this.isBadPage(urlobj.host))) {
					if (details.resourceType == 'mainFrame')
						dialog.showMessageBox(this.window, {
							type: 'info',
							title: urlobj.host,
							message: 'You are not allowed to navigate here',
							buttons: ['Ok'],
						});
					this.blocked_cache[urlobj.host] = true;
					return callback({ cancel: true });
				}
			}
			this.blocked_cache[urlobj.host] = false;
			callback({});
		});
	}

	// false -> page OK. true -> page NOT OK.
	isBadPage(domain) {
		// this.warn('page info:', page_info);
		// let domain = page_info.host;
		// const host_split = domain_full.split('.');
		// const domain = host_split.length > 2 ? host_split.slice(1, host_split.length - 1).join('') : domain_full;

		if (domain.includes('blank')) res = false;
		if (this.__conf.hosts_allowed && this.__conf.hosts_allowed.some((host) => domain.includes(host))) return false;
		// this.log(domain, 'in', this.__conf.hosts_blacklist, '??');
		if (this.__conf.hosts_blacklist && this.__conf.hosts_blacklist.some((host) => domain.includes(host)))
			return true;
		// this.log(domain, 'in', this.__conf.hosts_whitelist, '??');
		if (this.__conf.hosts_whitelist) return !this.__conf.hosts_whitelist.some((host) => domain.includes(host));
		return false;
	}
}

module.exports = WebpageFilter;
