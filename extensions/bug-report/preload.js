const BaseModule = require('../../lib/BaseModule.js');
const ipcChannel = require('../../lib/icpChannel.js');

module.exports = class BugReport_preload extends BaseModule {
	MODULE_NAME = 'bug-report';

	setup() {
		window.onerror = function (message, source, lineno, colno, error) {
			ipcChannel.sendSignalToMain('error:GenericError', { message, source, lineno, colno, error });
		};

		window.onunhandledrejection = function (event) {
			ipcChannel.sendSignalToMain('error:UndanhledRejection', event);
		};
	}
};
