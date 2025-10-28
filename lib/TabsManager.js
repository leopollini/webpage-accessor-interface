// const { BaseWindow, WebContentsView } = require('electron');

const kleur = require("kleur");

// To ensure consistency
class TabWrapper
{
    tab;

    constructor(assigned_tab) {this.tab = assigned_tab;}
}

class TabsManager
{
    static mainWindow = null;
    static mainTab = null;
    static tabs = {};
    static activeTab;
    static astiveSideTabs = [];
    static activeTabName = 'main';
    static lastActiveTabName;

    static setup(mainWindow, mainTab)
    {
        this.TabLog("setting up main configuration...");
        TabsManager.mainWindow = mainWindow;
        TabsManager.mainTab = mainTab;
    }

    static newTab(newTab, tabId)
    {
        this.TabLog("Adding new tab to list");
        TabsManager.tabs[tabId] = new TabWrapper(newTab);
        // return newTab;
    }

    static setTab(tabId)
    {
        this.TabLog("Switching to", tabId);
        if (TabsManager.tabs[tabId])
        {
            if (TabsManager.activeTab) TabsManager.mainWindow.contentView.removeChildView(TabsManager.activeTab.tab);
            TabsManager.activeTab = TabsManager.tabs[tabId];
            TabsManager.mainWindow.contentView.addChildView(TabsManager.tabs[tabId].tab);
            TabsManager.lastActiveTabName = TabsManager.activeTabName;
            TabsManager.activeTabName = tabId;
            // return TabsManager.tabs[tabId];
        }
        else
            throw('Trying to set a non existing tab');
    }

    static unsetTab()
    {
        const lastTabName = TabsManager.lastActiveTabName || 'main'
        this.TabLog("Switching back to", lastTabName);
        if (TabsManager.activeTab) TabsManager.mainWindow.contentView.removeChildView(TabsManager.activeTab.tab);
        TabsManager.mainWindow.contentView.addChildView(TabsManager.tabs[lastTabName].tab);
        TabsManager.activeTab = TabsManager.tabs[lastTabName];
        TabsManager.activeTabName = lastTabName;
    }

    static setNewTab(newTab, tabId)
    {
        TabsManager.newTab(newTab, tabId);
        TabsManager.setTab(tabId);
    }

    static TabLog(...msg)
    {
        console.log("[", kleur.grey("TabsManager"), "]:", ...msg);
    }
}

// // wrapper for activeTab
// class activeTab
// {

// }

module.exports = TabsManager;