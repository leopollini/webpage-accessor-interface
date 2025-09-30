const { contextBridge, ipcRenderer } = require('electron');
const { sendMouseEvent } = require('../lib/utils.js')

const LONG_PRESS_DELAY = 500; // longpress duration in ms
var longPressTimer = null;

// detect long press (trigger left-click + contextmenu)
window.addEventListener('pointerdown', (e, input) => {
	// Start timer on mouse down
	if (!longPressTimer)
		longPressTimer = setTimeout(() => {
			// Trigger long press event after delay
			console.log("long pressss!!!");
			sendMouseEvent('contextmenu', e);
			sendMouseEvent('pointerdown', e);
		}, LONG_PRESS_DELAY);
});

// same
window.addEventListener('pointerup', (event) => {
	// Cancel timer on mouseup
	if (longPressTimer) {
		clearTimeout(longPressTimer);
		longPressTimer = null;
	}
});