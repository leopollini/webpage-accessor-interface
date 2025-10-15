const { contextBridge, ipcRenderer } = require('electron');
const { createMouseEvent, sendMouseEvent } = require('../../lib/utils.js')
const fs = require('fs');
const path = require('path')

class TouchUtils_preload extends require('../../lib/BasePreload.js')
{
	LONG_PRESS_DELAY = 500;	// longpress duration in ms
	longPressTimer = null;

	lastTouchedObject = null;	// necessary for doubletap
	touchTime = 0;

	setup()
	{
		const bubbleStyle = fs.readFileSync(path.join(__dirname, 'bubble.html'));
		console.log("Bubble style:", bubbleStyle);

		// detect long press (trigger left-click + contextmenu) and
		// detect touched item for events sent from main
		window.addEventListener('pointerdown', (e, input) => {
			// Start timer on mouse down
			if (!this.longPressTimer)
				this.longPressTimer = setTimeout(() => {
					// Trigger long press event after delay
					console.log("long pressss!!!");
					sendMouseEvent('contextmenu', e);
					sendMouseEvent('pointerdown', e);
				}, this.LONG_PRESS_DELAY);

			this.lastTouchedObject = e.target;
			this.touchTime = Date.now();
			

			// Summon Bubble when screen is touched
			const bubble = document.createElement("span");
			bubble.classList.add("bubble");
			bubble.style.left = `${e.clientX - bubble.style.width}px`;
			bubble.style.top = `${e.clientY - bubble.style.height}px`;

			const style = document.createElement("style");
			style.textContent = bubbleStyle;
			document.head.appendChild(style);
			document.body.appendChild(bubble);

			// remove after animation ends
			bubble.addEventListener("animationend", () => {
			bubble.remove();
			});
		});

		// same
		window.addEventListener('pointerup', (event) => {
			// Cancel timer on mouseup
			if (this.longPressTimer) {
				clearTimeout(this.longPressTimer);
				this.longPressTimer = null;
			}
		});
			
		// radial double-click signal forward
		ipcRenderer.on('double-click2', function (e, pos)
		{
			var dbc_event = e;
			dbc_event.target = this.lastTouchedObject;
			dbc_event.clientX = pos.x;
			dbc_event.clientY = pos.x;
			const dblClickEvent = createMouseEvent('dblclick', dbc_event);
			if (this.lastTouchedObject && Date.now() < this.touchTime + 1000)
				this.lastTouchedObject.dispatchEvent(dblClickEvent);
			else
				document.dispatchEvent(dblClickEvent);
		});
	}
}

module.exports = TouchUtils_preload