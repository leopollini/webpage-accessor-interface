const { ipcMain, remote, dialog } = require('electron');
const { machineIdSync } = require('node-machine-id');
const ipcChannel = require('../../lib/icpChannel');
const os = require('os');

// Sample Module. Plase copy-paste this file into new module's main folder
class LocalKeysCheck extends require('../../lib/BaseModule') {
	MODULE_NAME = 'keys-checker';
	machine_id = null;
	real_machine_id;
	track_active_tab = false;

	setup() {
		ipcChannel.newMainHandler('get-info', async () => await this.getInfo());

		const id = machineIdSync();
		this.real_machine_id = machineIdSync(false);

		this.machine_id = this.__conf.custom_id || id;

		this.log('Loaded local id:', this.machine_id);

		this.warn('ip addressen:', this.getIpAddr(1));

		this.askStructureId();
	}

	async getInfo() {
		this.log(this.tab.webContents.getURL(), 'is trying to access local keys info');
		return {
			machine_id: this.machine_id,
			structure_id: this.__conf.structure_id,
			ip_address: this.getIpAddr(),
		};
	}

	getIpAddr(max_networks = 99) {
		const ifaces = os.networkInterfaces();
		let ipAdresse = [];
		Object.keys(ifaces).forEach(function (ifname) {
			let alias = 0;
			ifaces[ifname].forEach(function (iface) {
				if ('IPv4' !== iface.family || iface.internal !== false) {
					// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
					return;
				}

				if (alias < max_networks) {
					// this interface has only one ipv4 adress
					// console.log(ifname, iface.address);
					ipAdresse.push(iface.address);
				} else {
					// console.log(ifname + ':' + alias, iface.address);
					// this single interface has multiple ipv4 addresses
				}
				++alias;
			});
		});
		return ipAdresse;
	}

	askStructureId() {
		if (!this.__conf.structure_id)
			dialog.showMessageBox(this.window, {
				type: 'info',
				title: 'Set structure id',
				message: `Please set the app's structure id in ${this.getAppDataDir() + this.MODULE_NAME + '.json'}`,
				buttons: ['Ok'],
			});
	}
}

module.exports = LocalKeysCheck;
