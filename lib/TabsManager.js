// const { BaseWindow, WebContentsView } = require('electron');

const { app } = require('electron');
const kleur = require("kleur");
const SimpleEvent = require('./SimpleEvent');

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
    static defaultTabName = 'main';


    static setup(mainWindow, mainTab)
    {
        TabsManager.mainWindow = mainWindow;
        
        if (mainTab) TabsManager.setNewTab(mainTab, 'main');
        
        TabsManager.mainWindow.on('resize', () => {
            if (!TabsManager.mainWindow.isFullScreen()) TabsManager.resetTabSize();
        });
        TabsManager.mainWindow.on('enter-full-screen', TabsManager.resetTabSize);
        TabsManager.mainWindow.on('leave-full-screen', TabsManager.resetTabSize);
        
        TabsManager.log("setup main configuration done");
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

    static newTab(newTab, tabname = 'tab', update_modules = true, bounds = TabsManager.default_bounds)
    {
        if (TabsManager.tabs[tabname]) throw TypeError('duplicate tab name: ' + tabname);
        if (update_modules)
        {
            const ev = new SimpleEvent();
            // Watch out! This emitter waits for any extension's opinion, but only if they are not async!
            this.log('informing extensions pre-tab creation');
            TabsManager.mainWindow.emit('before-new-tab-created', ev, newTab);
            if (ev.defaultPrevented)
            {
                TabsManager.log(ev.blocker ? ev.blocker : "an extension", 'prevented this tab\'s creation');
                this.closeTab(newTab);
                return false;
            }
        }

        TabsManager.log("Adding new tab to list");
        TabsManager.tabs[tabname] = new TabWrapper(newTab, bounds);
        newTab.tab_id = tabname;
        if (update_modules)
            // require('../extensions/loader').newTabCreated(newTab);  // This must be required like this otherwise it will have create dependencies
            TabsManager.mainWindow.emit('new-tab-created', new SimpleEvent(), newTab);
        return true;
    }

    static newDefaultBounds(new_bounds)
    {
        Object.assign(TabsManager.default_bounds, new_bounds);

        TabsManager.resetTabSize();
    }

    static newSideTab(newTab, tabname, bounds)
    {
        TabsManager.log("Adding SideTab to view");
        TabsManager.sideTabs[tabname] = new TabWrapper(newTab, bounds);   
        TabsManager.mainWindow.contentView.addChildView(newTab);
        return newTab;
    }

    static removeSideTab(tabname)
    {
        TabsManager.log("Removing SideTab from view");
        TabsManager.mainWindow.contentView.removeChildView(TabsManager.sideTabs[tabname].tab);
        delete TabsManager.sideTabs[tabname];
    }

    static setTab(tabname)
    {
        if (!tabname) { TabsManager.log("invalid input"); return false };
        if (tabname == TabsManager.activeTabName)
            return TabsManager.log("Already on", tabname);
        TabsManager.log("Switching to", tabname);
        if (TabsManager.tabs[tabname])
        {
            if (TabsManager.activeTab.tab) TabsManager.mainWindow.contentView.removeChildView(TabsManager.activeTab.tab);
            TabsManager.mainWindow.contentView.addChildView(TabsManager.tabs[tabname].tab);
            TabsManager.activeTab.tab = TabsManager.tabs[tabname].tab;
            TabsManager.activeTab.bounds = TabsManager.tabs[tabname].bounds;
            TabsManager.resizeTab(TabsManager.activeTab);
            TabsManager.lastActiveTabName = TabsManager.activeTabName;
            TabsManager.activeTabName = tabname;
            TabsManager.activeTab.tab.webContents.focus();
            // return TabsManager.tabs[tabname];
        }
        else
            TabsManager.log(tabname, "does not exist. Available tabs:", ...Object.keys(TabsManager.tabs));
        return true;
    }

    static unsetTab(setThisTab)
    {
        const lastTabName = TabsManager.lastActiveTabName || 'main';
        TabsManager.log("Switching back to", lastTabName);
        if (TabsManager.activeTab) TabsManager.mainWindow.contentView.removeChildView(TabsManager.activeTab.tab);
        TabsManager.mainWindow.contentView.addChildView(TabsManager.tabs[lastTabName].tab);
        TabsManager.setTab(setThisTab || TabsManager.lastActiveTabName || TabsManager.defaultTabName);
    }

    static setNewTab(newTab, tabname = 'tab', update_modules = true, bounds)
    {
        return TabsManager.newTab(newTab, tabname, update_modules, bounds) && TabsManager.setTab(tabname);
    }

    static getTabName(find_tab)
    {
        return find_tab.tabname;     // just in casi I forgor
    }

    // Could be undefined
    static getNameTab(tabname)
    {
        return (TabsManager.tabs[tabname] && TabsManager.tabs[tabname].tab);
    }

    static setDefaultTabName(new_name)
    {
        TabsManager.defaultTabName = new_name;
    }

    static closeTab(tab, setThisTab)
    {
        if (!TabsManager.tabs[tab.tab_id]) return this.err(tab, 'is not a valid closable tab!');
        TabsManager.mainWindow.emit('tab-closed', new SimpleEvent(), tab, tab.tab_id);
        TabsManager.mainWindow.contentView.removeChildView(tab);
        delete TabsManager.tabs[tab.tab_id];
        // TabsManager.setTab((setThisTab && setThisTab.tab_id) || TabsManager.defaultTabName);
    }

    static closeTabName(tabname, setThisTab)
    {
        if (!TabsManager.tabs[tabname]) return this.err(tabname, 'is not registerd in active closable tabs!');
        TabsManager.mainWindow.emit('tab-closed', new SimpleEvent(), TabsManager.tabs[tabname].tab, tabname);
        TabsManager.mainWindow.contentView.removeChildView(TabsManager.tabs[tabname].tab);
        delete TabsManager.tabs[tabname];
        // TabsManager.setTab((setThisTab && setThisTab.tab_id) || TabsManager.defaultTabName);
    }

    static getActiveTab()
    {
        return TabsManager.activeTab.tab;
    }

    static getDisplayedTabs()
    {
        // Watch out: sideTabs is a list of TabWrappers
        return {activeTab: TabsManager.activeTab.tab, sideTabs: TabsManager.sideTabs};
    }

    static closeTab(tab)
    {
        if (!TabsManager.tabs[tab.tab_id]) return this.err(tab, 'is not a valid closable tab!');
        TabsManager.mainWindow.emit('tab-closed', new SimpleEvent(), tab, tab.tab_id);
        TabsManager.mainWindow.contentView.removeChildView(tab);
        delete TabsManager.tabs[tab.tab_id];
    }

    static closeTabName(tabname)
    {
        if (!TabsManager.tabs[tabname]) return this.err(tabname, 'is not registerd in active closable tabs!');
        TabsManager.mainWindow.emit('tab-closed', new SimpleEvent(), TabsManager.tabs[tabname].tab, tabname);
        TabsManager.mainWindow.contentView.removeChildView(TabsManager.tabs[tabname].tab);
        delete TabsManager.tabs[tabname];
    }

    static isTabActive()
    {
        return !!TabsManager.activeTab.tab;
    }

    static log(...msg)
    {
        console.log("[", kleur.grey("TabsManager"), "]:", ...msg);
    }

    static warn(...msg)
    {
        console.log("[", kleur.yellow("TabsManager"), "]:", ...msg);
    }

    static err(...msg)
    {
        console.log("[", kleur.red("TabsManager"), "]:", ...msg);
    }

    static idToName(id)
    {
        return 'tab_' + id
    }
}

// // wrapper for activeTab
// class activeTab
// {

// }

module.exports = TabsManager;