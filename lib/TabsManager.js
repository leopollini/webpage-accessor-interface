// const { BaseWindow, WebContentsView } = require('electron');

class TabsManager
{
    static mainWindow = null;
    static mainTab = null;
    static tabs = {};
    static activeTab = null;
    static activeTabName = 'main';

    static setup(mainWindow, mainTab)
    {
        TabsManager.mainWindow = mainWindow;
        TabsManager.mainTab = mainTab;
    }

    static newTab(newTab, tabId)
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

    static unsetTab()
    {
        TabsManager.mainWindow.contentView.addChildView(TabsManager.mainTab);
        TabsManager.activeTab = TabsManager.mainTab;
        TabsManager.activeTabName = 'main';
    }

    static setNewTab(newTab, tabId)
    {
        TabsManager.newTab(newTab, tabId)
        TabsManager.setTab(tabId);
    }
}

// // wrapper for activeTab
// class activeTab
// {

// }

module.exports = TabsManager;