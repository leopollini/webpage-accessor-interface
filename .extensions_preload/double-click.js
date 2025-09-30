const { contextBridge, ipcRenderer } = require('electron');
const { createMouseEvent } = require('../lib/utils.js')

var lastTouchedObject = null;
var touchTime = 0;
	
// detect touched item for events sent from main
document.addEventListener('pointerdown', function (e) {
	lastTouchedObject = e.target;
	touchTime = Date.now();
	// console.log("ASASD");
});

// radial double-click signal forward
ipcRenderer.on('double-click2', function (e, pos)
{
	var dbc_event = e;
	dbc_event.target = lastTouchedObject;
	dbc_event.clientX = pos.x;
	dbc_event.clientY = pos.x;
	const dblClickEvent = new createMouseEvent('dblclick', dbc_event);
	// console.log("###lastItem:", lastTouchedObject);
	if (lastTouchedObject && Date.now() < touchTime + 1000)
		lastTouchedObject.dispatchEvent(dblClickEvent);
	else
		document.dispatchEvent(dblClickEvent);
});