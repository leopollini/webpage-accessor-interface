const kleur = require('kleur');
const BaseModule = require('../../lib/BaseModule');
const net = require('node:net');
const { dialog, app } = require('electron');
const { BaseLogger } = require('../../lib/BaseLogger');
const Autoupdate = require('../autoupdate/main');
const LocalKeysCheck = require('../keys-checker/main');

class SocketLogger extends BaseLogger {
	sock;
	constructor(s, log_level) {
		super();
		this.sock = s;

		switch (log_level) {
			default:
			case 'LOG':
				this.log = (module_name, message, highlight) =>
					this.sock.write(
						`LOG|${(highlight ? kleur.bold().green : kleur.green)(module_name)}: ${message.join(' ')}\n`,
					);
			case 'WARNING':
				this.warn = (module_name, message, highlight) =>
					this.sock.write(
						`WARN|${(highlight ? kleur.bold().yellow : kleur.yellow)(module_name)}: ${message.join(' ')}\n`,
					);
			case 'ERROR':
				this.err = (module_name, message, highlight) =>
					this.sock.write(
						`ERR|${(highlight ? kleur.bold().red : kleur.red)(module_name)}: ${message.join(' ')}\n`,
					);
		}
	}
}

module.exports = class RemoteControls extends BaseModule {
	MODULE_NAME = 'remote-controls';
	ENTRY_STATUS = kleur.blue('connecting...');
	required_modules = [];
	// HIGHLIGHT = true;

	connected = false;
	failed_retries = 1;
	sockLogger;

	sock;
	addresses = [];
	addr_index = 0;

	setup() {
		// socket setup takes place in late_setup
		this.sockLogger = new SocketLogger(this.sock, this.__conf.log_level);
		if (!this.__conf.retry_timeout) this.__conf.retry_timeout = 2;
	}

	late_setup() {
		this.addresses = [...new Set(new LocalKeysCheck().getIpAddr().concat(this.__conf.other_hosts))];
		this.log('starting socket. Checking at hosts:', this.addresses);
		this.scanHostsAndConnect();
	}

	async scanHostsAndConnect() {
		if (this.failed_retries >= (this.__conf.max_retries | 1)) {
			this.err('Connection failed: too many retries');
			this.failed('Connection refused too many times');
			return;
		}
		this.log(`Scanning ${this.addresses.length} addresses...`);

		const results = await Promise.all(
			this.addresses.map((ip) => {
				return new Promise((resolve) => {
					const socket = new net.Socket();

					// Set a timeout to avoid hanging
					socket.setTimeout(this.__conf.conn_timeout * 1000 || 2000);

					socket.on('connect', () => {
						// socket.write('lel\n');
						socket.destroy(); // Close immediately once connected
						resolve({ ip, status: 'open' });
					});
					socket.on('timeout', () => {
						socket.destroy();
						resolve({ ip, status: 'timeout' });
					});
					socket.on('error', (e) => {
						socket.destroy();
						resolve({ ip, status: 'closed' });
					});
					socket.connect(this.__conf.port, ip);
				});
			}),
		);

		const successful = results.filter((r) => r.status === 'open');

		if (!successful.length) {
			this.failed_retries++;
			this.warn('No available hosts! Retrying...');
			setTimeout(() => this.scanHostsAndConnect(), this.__conf.retry_timeout * 1000); //try again after some time
			return;
		}
		console.table(results);
		this.createSocket(successful[0].ip);
	}

	createSocket(ip) {
		this.sock = new net.Socket();

		this.sock.on('connect', () => {
			this.setStatus(kleur.green('OK'));
			this.failed_retries = 0;
			this.connected = true;
			this.log('Succesfully connected to', ip + ':' + this.__conf.port);
			this.sock.write('Hello I am ' + this.__data.terminal_id + '\n');
			this.sock.on('close', () => {
				this.connected = false;
				this.failed_retries++;
				this.setStatus(kleur.blue('Connecting...'));
				setTimeout(() => this.scanHostsAndConnect(), this.__conf.retry_timeout * 1000); //try again after some time
			});
			this.sock.on('data', (msg) => {
				this.parseRequest(msg.toString());
			});
		});
		this.sock.on('error', (err) => {
			this.setStatus(kleur.red('Disconnected: ') + err);
		});

		this.sock.connect(this.__conf.port, ip);
	}

	parseRequest(data) {
		const [cmd, ...content] = data.toString().split(' ');
		switch (cmd.toString().trim()) {
			default:
				this.err(cmd.toString().trim() + ': Invalid request');
				break;
			case 'SHUTDOWN':
				this.warn('Shudown request from Server!!!');
				dialog
					.showMessageBox(this.window, {
						type: 'info',
						title: 'Shutting down',
						message:
							'The Server decreted that this terminal session be shut down: ' + content.join(' ').trim(),
						buttons: ['Comply', 'Complain'],
					})
					.then((result) => {
						this.log(result);
						this.sock.write('OK\n');
						app.exit();
					});
				break;
			case 'WARNING':
				this.warn('Server sent you a warning!!!');
				dialog
					.showMessageBox(this.window, {
						type: 'info',
						title: 'Server warning',
						message: 'The Server has sent you a warning: ' + content.join(' ').trim(),
						buttons: ['Ok', 'Complain'],
					})
					.then();
				this.sock.write('OK\n');
				break;
			case 'MSG':
				this.log(`You got a message from Server: '${content.join(' ').trim()}'`);
				dialog
					.showMessageBox(this.window, {
						type: 'info',
						title: 'Server message',
						message: 'The Server has sent you a message: ' + content.join(' ').trim(),
						buttons: ['Ok'],
					})
					.then();
				this.sock.write('OK\n');
				break;
			case 'ID':
				this.log('Server has requested your id');
				this.sock.write(parseInt(this.__data.terminal_id).toString() + 'OK\n');
				break;
			case 'UPDATE':
				this.log('Server has requested to update app');
				new Autoupdate().tryUpdate();
				this.sock.write('OK\n');
				break;
		}
	}

	on_new_tab_created(newTab) {}
};
