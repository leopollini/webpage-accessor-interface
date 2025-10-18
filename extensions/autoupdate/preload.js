class Autoupdate_preload extends require('../../lib/BasePreload.js')
{
    update_check_timer = null;
    update_click_timeout;

    setup()
    {
        if (this.__conf.update_mode.mode == "long_press")
        {
            this.update_click_timeout = this.__conf.update_mode
            window.addEventListener('pointerdown', (event) => {
                this.update_check_timer = setTimeout(() => {this.updateCheckRequest()}, this.__conf.update_mode.duration * 1000);
            })
        }
    }

    updateCheckRequest()
    {
        this.warn("Update check requested!");
    }
}

module.exports = Autoupdate_preload
