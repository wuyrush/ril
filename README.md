# ril

Save tabs you want to read later to avoid millions of tabs opened in your browser.

## Updates

### 08/18/18
* Key bindings to display saved tabs(`Ctrl+Shift+Y`) and save tabs(`Ctrl+Y`);
* Cache saved tabs in background to avoid hitting storage layer directly too often when retrieving saved tabs; Otherwise the load time of popup page with saved tabs can be long(~1-2s);

Plues refactors to make the caching strategy work.

### 08/12/18
* MVP supporting core functionality without any key binding supports.
* TODOs:
    1. Key binding to a)trigger the extension, b)select saved tab and open it and c)remove selected tab;
    1. Fuzzy-search across saved tabs;
    1. Option page for extension configuration;
    1. Sync saved tabs across browser instance where user logs in;
    1. Better UI design.
