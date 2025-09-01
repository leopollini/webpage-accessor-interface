const { app } = require("electron");

// radial double-click
class DoubleClick extends require('../lib/BaseModule')
{
    MODULE_NAME = "touch-utils"; // MUST be the same as file name (required to access conf file)
    
    lstLeftPress = 0;
    lstLeftPos = {x: 0, y:0};
    lstRightPress = 0;
    lstRightPos = {x:0, y:0};
    
    //// Constructor trace, please leave commented, unless necessary.
    // constructor(window, tab) { super(window, tab); }


    setup()
    {
        this.tab.webContents.on('input-event', (event, input) => {
            if (input.type != 'mouseMove')
                this.log("sending an", input.type);
            switch(input.type)
            {
                case 'mouseDown':
                    switch(input.button)
                    {
                        case 'left':
                            this.looseDoubleClickCheck(input, event);
                            this.lstLeftPress = Date.now();
                            this.lstLeftPos = {x: input.x, y: input.y};
                         break ;
                        case 'right':
                            this.lstRightPress = Date.now();
                            this.lstRightPos = {x: input.x, y: input.y};
                         break ;
                    }
                 break ;
                case 'gestureTapDown' :
                    this.looseDoubleClickCheck(input, event);
                 break ;
            }
        });

        if (this.__conf.remap_to_pointeraction == true)
        {
            this.warn("mapping touch inputs to mouse imputs");
            app.commandLine.appendSwitch("touch-events", "disabled");
            app.commandLine.appendSwitch("enable-pointer-events");
        }

        if (this.__conf.disable_keyboard == true)
        {
            this.warn("disabling keyboard");
            this.tab.webContents.on("before-input-event", (event, input) => {
                if (input.type === 'keyDown' || input.type === 'keyUp')
                    event.preventDefault();
            });
        }
    }
    
    async looseDoubleClickCheck(input, event)
    {
        if (Date.now() > this.lstLeftPress + this.__conf.doubleclick_max_delay)
            return ;
        const dx = input.x - this.lstLeftPos.x;
        const dy = input.y - this.lstLeftPos.y;
        if ((dx != 0 || dy != 0) && dx * dx + dy * dy < this.__conf.doubleclick_sqr_radius)
        {
            this.tab.webContents.send('double-click2', { x: input.x, y: input.y });
            this.log("Firing!");
        }
        else
            this.log("radius exceeded or zero");
        this.lstLeftPress = 0;
    }
}

module.exports = DoubleClick;