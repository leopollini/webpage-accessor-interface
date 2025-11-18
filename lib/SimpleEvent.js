class SimpleEvent
{
    defaultPrevented = false;

    preventDefault()
    {
        this.defaultPrevented = true;
    }
}

module.exports = SimpleEvent;