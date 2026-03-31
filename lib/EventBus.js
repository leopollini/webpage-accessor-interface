const { EventEmitter } = require('events');

class AppEventBus extends EventEmitter {}

const eventBus = new AppEventBus();

module.exports = eventBus;

// actually just use the eventsystem in 'app'. Much cleaner

// Emit:
//      eventBus.emit('module:event', {data});
// Catch:
//      eventBus.on('module:event, callback);
