const { createMouseEvent, sendMouseEvent } = require('../../lib/utils.js');
const fs = require('fs');
const Env = require('../../env.js');
const path = require('../../lib/path2.js');
const ipcChannel = require('../../lib/icpChannel.js');

class TouchUtils_preload extends require('../../lib/BasePreload.js') {
	MODULE_NAME = 'touch-utils';

	LONG_PRESS_DELAY = 500; // longpress duration in ms
	longPressTimer = null;

	lastTouchedObject = null; // necessary for doubletap
	touchTime = 0;

	bubbleStyle = '';

	setup() {
		this.bubbleStyle = fs.readFileSync(path.join(__dirname, 'bubble.html'));
		// console.log("Bubble style:", this.bubbleStyle);

		// detect long press (trigger left-click + contextmenu) and
		// detect touched item for events sent from main
		window.addEventListener('pointerdown', (e) => this.clickStuff(e));

		// same
		window.addEventListener('pointerup', (event) => {
			// Cancel timer on mouseup
			if (this.longPressTimer) {
				clearTimeout(this.longPressTimer);
				this.longPressTimer = null;
			}
		});

		// long press to rightclick
		window.addEventListener('gestureLongTap', (e) => {
			sendMouseEvent('contextmenu', e);
			sendMouseEvent('pointerdown', e);
		});

		// radial double-click signal forward
		ipcChannel.newRendererHandler('double-click2', (e, pos) => {
			var dbc_event = e;
			dbc_event.target = this.lastTouchedObject;
			dbc_event.clientX = pos.x;
			dbc_event.clientY = pos.x;
			const dblClickEvent = createMouseEvent('dblclick', dbc_event);
			if (this.lastTouchedObject && Date.now() < this.touchTime + 1000)
				this.lastTouchedObject.dispatchEvent(dblClickEvent);
			else document.dispatchEvent(dblClickEvent);
			if (Env.VERBOSE)
				console.log('received doubleclick from main process');
		});

		// appends bubble dedicated style
		if (document.head) this.styleSetup();
		else
			window.addEventListener('DOMContentLoaded', () => {
				this.styleSetup();
			});
	}

	styleSetup() {
		this.style = document.createElement('style');
		this.style.textContent = this.bubbleStyle;
		document.head.appendChild(this.style);
	}

	clickStuff(e) {
		if (document.body) {
			// Summon Bubble when screen is touched
			const bubble = document.createElement('span');
			bubble.classList.add('bubble');

			bubble.style.left = `${e.clientX - 15}px`;
			bubble.style.top = `${e.clientY - 15}px`;

			// remove after animation ends
			bubble.addEventListener('animationend', () => {
				bubble.remove();
			});

			document.body.appendChild(bubble);
		}
	}
}

module.exports = TouchUtils_preload;
