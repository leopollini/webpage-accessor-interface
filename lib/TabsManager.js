// const { BaseWindow, WebContentsView } = require('electron');

class TabsManager
{
    static mainWindow = null;
    static tabs = {};
    static activeTab = null;
    static activeTabName = '';

    static setup(mainWindow)
    {
        TabsManager.mainWindow = mainWindow;
    }

    static addTab(newTab, tabId)
    {
        TabsManager.tabs[tabId] = newTab;
        // return newTab;
    }

    static setTab(tabId)
    {
        if (TabsManager.tabs[tabId])
        {
            if (TabsManager.activeTab) TabsManager.mainWindow.contentView.removeChildView(TabsManager.activeTab);
            TabsManager.activeTab = TabsManager.tabs[tabId];
            TabsManager.mainWindow.contentView.addChildView(TabsManager.tabs[tabId]);
            TabsManager.activeTabName = tabId;
            // return TabsManager.tabs[tabId];
        }
        else
            throw('Trying to set a non existing tab');
    }

    static setNewTab(newTab, tabId)
    {
        TabsManager.addTab(newTab, tabId)
        TabsManager.setTab(tabId);
    }
}

// // wrapper for activeTab
// class activeTab
// {

// }

module.exports = TabsManager;