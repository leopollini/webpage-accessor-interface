// const { BaseWindow, WebContentsView } = require('electron');

const { app } = require('electron');
const kleur = require("kleur");

// To ensure consistency
class TabWrapper
{
    tab;
    bounds;

    constructor(assigned_tab, set_bounds) {this.tab = assigned_tab; this.bounds = set_bounds;}
}

class TabsManager
{
    static default_bounds = {};

    static mainWindow = null;
    static tabs = {};
    static activeTab = new TabWrapper();
    static sideTabs = {};
    static activeTabName = 'main';
    static lastActiveTabName;


    static setup(mainWindow, mainTab)
    {
        TabsManager.TabLog("setting up main configuration...");
        TabsManager.mainWindow = mainWindow;
        
        if (mainTab) TabsManager.setNewTab(mainTab, 'main');
        
        TabsManager.mainWindow.on('resize', () => {
			if (!TabsManager.mainWindow.isFullScreen()) TabsManager.resetTabSize();
        });
        TabsManager.mainWindow.on('enter-full-screen', TabsManager.resetTabSize);
        TabsManager.mainWindow.on('leave-full-screen', TabsManager.resetTabSize);
    }

    static resetTabSize()
    {
        if (TabsManager.activeTab.tab)
            TabsManager.resizeTab(TabsManager.activeTab);
        Object.values(TabsManager.sideTabs).forEach(element => {
            TabsManager.resizeTab(element);
        });
    }

    static resizeTab(tabwrap)
    {
        tabwrap.tab.setBounds({
            x: tabwrap.bounds.x || 0,
            y: tabwrap.bounds.y || 0,
            width: tabwrap.bounds.width || TabsManager.mainWindow.getContentBounds().width - (tabwrap.bounds.x || 0),
            height: tabwrap.bounds.height || TabsManager.mainWindow.getContentBounds().height - (tabwrap.bounds.y || 0)
        });
    }

    static newTab(newTab, tabId, update_modules = true, bounds = TabsManager.default_bounds)
    {
        TabsManager.TabLog("Adding new tab to list");
        TabsManager.tabs[tabId] = new TabWrapper(newTab, bounds);
        if (update_modules)
            require('../extensions/loader').newTabCreated(newTab);
        // return newTab;
    }

    static newDefaultBounds(new_bounds)
    {
        Object.assign(TabsManager.default_bounds, new_bounds);

        TabsManager.resetTabSize();
    }

    static newSideTab(newTab, tabId, bounds)
    {
        TabsManager.TabLog("Adding SideTab to view");
        TabsManager.sideTabs[tabId] = new TabWrapper(newTab, bounds);   
        TabsManager.mainWindow.contentView.addChildView(newTab);
        return newTab;
    }

    static removeSideTab(tabId)
    {
        TabsManager.TabLog("Adding SideTab to view");
        TabsManager.mainWindow.contentView.removeChildView(TabsManager.sideTabs[tabId].tab);
        delete TabsManager.sideTabs[tabId];
    }

    static setTab(tabId)
    {
        if (tabId == TabsManager.activeTabName)
            TabsManager.TabLog("Already on", tabId);
        TabsManager.TabLog("Switching to", tabId);
        if (TabsManager.tabs[tabId])
        {
            if (TabsManager.activeTab.tab) TabsManager.mainWindow.contentView.removeChildView(TabsManager.activeTab.tab);
            TabsManager.mainWindow.contentView.addChildView(TabsManager.tabs[tabId].tab);
            TabsManager.activeTab.tab = TabsManager.tabs[tabId].tab;
            TabsManager.activeTab.bounds = TabsManager.tabs[tabId].bounds;
            TabsManager.resizeTab(TabsManager.activeTab);
            TabsManager.lastActiveTabName = TabsManager.activeTabName;
            TabsManager.activeTabName = tabId;
            // return TabsManager.tabs[tabId];
        }
        else
            TabsManager.TabLog(tabId, "does not exist.");
    }

    static unsetTab()
    {
        const lastTabName = TabsManager.lastActiveTabName || 'main';
        TabsManager.TabLog("Switching back to", lastTabName);
        if (TabsManager.activeTab) TabsManager.mainWindow.contentView.removeChildView(TabsManager.activeTab.tab);
        TabsManager.mainWindow.contentView.addChildView(TabsManager.tabs[lastTabName].tab);
        TabsManager.activeTab.tab = TabsManager.tabs[lastTabName].tab;
        TabsManager.activeTab.bounds = TabsManager.tabs[lastTabName].bounds;
        TabsManager.activeTabName = lastTabName;
    }

    static setNewTab(newTab, tabId, update_modules = true, bounds)
    {
        TabsManager.newTab(newTab, tabId, update_modules, bounds);
        TabsManager.setTab(tabId);
    }

    static closeTab(tabId)
    {
        delete TabsManager.tabs["tab_" + tabId];
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