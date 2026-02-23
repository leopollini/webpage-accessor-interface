const { execSync } = require('child_process');
const fs = require('fs');

exports.default = async function (configuration) {
	const path = configuration.path; // The path to the .exe file to sign

	// Use the same environment variables electron-builder already looks for
	const cert = process.env.CSC_LINK; // Path to your .pfx
	const password = process.env.CSC_KEY_PASSWORD;

	if (!cert || !password || !fs.existsSync(path)) {
		console.warn('Skipping signing: CSC_LINK or CSC_KEY_PASSWORD not set.');
		return;
	}

	if (fs.existsSync(path + '.signed')) fs.rmSync(path + '.signed');

	console.log(`Signing ${path} with osslsigncode...`);

	// Construct the osslsigncode command
	const command = `osslsigncode sign -pkcs12 "${cert}" \
    -pass "${password}" \
    -n "${configuration.options.name || 'App'}" \
    -t http://timestamp.digicert.com \
    -in "${path}" \
    -out "${path}.signed" && mv ${path}.signed ${path}`;

	try {
		execSync(command, { stdio: 'inherit' });
	} catch (error) {
		console.error('Signing failed:', error);
		process.exit(1);
	}
};
