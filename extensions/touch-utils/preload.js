const { contextBridge, ipcRenderer } = require('electron');
const { createMouseEvent, sendMouseEvent } = require('../../lib/utils.js')

const LONG_PRESS_DELAY = 500;	// longpress duration in ms
var longPressTimer = null;

var lastTouchedObject = null;	// necessary for doubletap
var touchTime = 0;

const fs = require('fs');
const path = require('path')
const bubbleStyle = fs.readFileSync(path.join(__dirname, './bubble.html'));
console.log("Bubble style:", bubbleStyle);

// detect long press (trigger left-click + contextmenu) and
// detect touched item for events sent from main
window.addEventListener('pointerdown', (e, input) => {
	// Start timer on mouse down
	if (!longPressTimer)
		longPressTimer = setTimeout(() => {
			// Trigger long press event after delay
			console.log("long pressss!!!");
			sendMouseEvent('contextmenu', e);
			sendMouseEvent('pointerdown', e);
		}, LONG_PRESS_DELAY);

	lastTouchedObject = e.target;
	touchTime = Date.now();
	

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
	if (longPressTimer) {
		clearTimeout(longPressTimer);
		longPressTimer = null;
	}
});
	
// radial double-click signal forward
ipcRenderer.on('double-click2', function (e, pos)
{
	var dbc_event = e;
	dbc_event.target = lastTouchedObject;
	dbc_event.clientX = pos.x;
	dbc_event.clientY = pos.x;
	const dblClickEvent = createMouseEvent('dblclick', dbc_event);
	// console.log("###lastItem:", lastTouchedObject);
	if (lastTouchedObject && Date.now() < touchTime + 1000)
		lastTouchedObject.dispatchEvent(dblClickEvent);
	else
		document.dispatchEvent(dblClickEvent);
});