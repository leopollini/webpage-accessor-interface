const kleur = require('kleur');
const BaseModule = require('../../lib/BaseModule');
const fs = require('fs');
const path = require('../../lib/path2');
const { app } = require('electron');
const ipcChannel = require('../../lib/icpChannel');

module.exports = class BugReport extends BaseModule {
	MODULE_NAME = 'bug-report';
	HIGHLIGHT = true;
	ENTRY_STATUS = kleur.blue('syncing...');
	track_active_tab = false;

	report_temp_dir = path.joinAppData('bug_reports');

	// FULL PROCESS CRASH AND RENDERER CRASH CANNOT (currently BE DETECTED
	setup() {
		if (!fs.existsSync(this.report_temp_dir)) fs.mkdirSync(this.report_temp_dir);

		process.on('uncaughtException', (e) => {
			this.store_bug(e, 'UncaughtException');
		});

		process.on('unhandledRejection', (e, promise) => {
			this.store_bug(e, 'UnhandledRejection');
		});

		app.on('renderer-process-crashed', (e, webContents, details) => {
			this.store_bug(e, 'RendererCrashed', details);
		});

		app.on('child-process-gone', (e, details) => {
			this.store_bug(e, 'ProcessCrashed', details);
		});

		app.on('gpu-process-crashed', (e) => {
			this.store_bug(e, 'GPUCrashed');
		});

		ipcChannel.newMainHandler('error:GenericError', (e) => {
			this.store_bug(e, 'RendererGenericError');
		});

		ipcChannel.newMainHandler('error:UndanhledRejection', (e) => {
			this.store_bug(e, 'RendererUnhandledRejection');
		});
	}

	on_new_tab_created(new_tab) {
		new_tab.webContents.on('crashed', (e) => {
			this.store_bug(e, 'RendererCrashed');
		});

		new_tab.webContents.on('unresponsive', () => {
			this.store_bug(e, 'RendererFrozen');
		});
	}

	late_setup() {
		this.sync_server();
	}

	async sync_server() {
		const endpoint = `${this.__conf.endpoint.protocol}://${this.__conf.source_of_validation}/${this.__conf.endpoint.path}`;
		let fail = false;

		if (!fs.existsSync(this.report_temp_dir))
			fs.mkdir(this.report_temp_dir);

		this.log('Beginning server sync.');
		fs.readdirSync(this.report_temp_dir).forEach(async (rep) => {
			if (fail) return;
			const report_path = path.join(this.report_temp_dir, rep);
			if (fs.statSync(report_path).isDirectory(() => {})) return;
			try {
				this.log('Syncing', rep + '...');

				const form = new FormData();
				form.append('file', new File([fs.readFileSync(report_path)], rep), rep);

				const res = await fetch(endpoint, {
					method: 'POST',
					body: form,
				});

				this.warn(await res.text());

				if (!res.ok) {
					this.err('failed.');
					this.setStatus(kleur.red('could not connect'));
					fail = true;
				} else {
					this.log('done.');
					fs.rename(report_path, path.join(this.report_temp_dir, 'sent', rep), () => {});
				}
			} catch (e) {
				this.err('failed:', e);
				this.failed(e);
				fail = true;
			}
		});
		if (!fail) {
			this.log('Synched!');
			this.setStatus(kleur.green('OK'));
		}
	}

	store_bug(event, type, details) {
		this.err('BUG REPORT:\n\t', type, event);

		fs.writeFileSync(
			path.join(this.report_temp_dir, new Date().toISOString().replace('/[:.]/g', '-') + '_' + type + '.txt'),
			`#### BUG EVENT ####
# detected by: ${this.__data.id}
# date: ${new Date().toISOString()}

# event: ${JSON.stringify(event, null, 2)}
${details ? '#details: ' + details : ''}`.replace('\\n', '\n'),
		);
	}
};
