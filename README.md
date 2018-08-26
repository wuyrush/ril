# ril

Save tabs you want to read later to avoid millions of tabs opened in your browser.

## Updates

### 08/24/18
* Select saved tab via `Tab` key(Reverse selection via `Shift+Tab`). Note not all keyboards have arrow keys;
* Open the selected tab via `Enter`;
* Remove the selected tab via `Ctrl+d`;
* Make the extension compatible with Google Chrome via `browser-polyfill`(with ugly UI still🙃)
* Highlight selected save tab;
* Remove redundant UI widgets.

### 08/18/18
* Key bindings to display saved tabs(`Ctrl+Shift+y`) and save tabs(`Ctrl+y`);
* Cache saved tabs in background to avoid hitting storage layer directly too often when retrieving saved tabs; Otherwise the load time of popup page with saved tabs can be long(~1-2s);
* TODOs:
    1. ~~Make the addon compatible with Chrome;~~
    1. ~~Select the saved tab to open via arrow keys or Tab key;~~
    1. ~~When a saved tab is selected, its background color changes to highlight itself.~~
        1. ~~The highlighting color MUST not reduce the readability of the summary and link of the tab.~~
    1. If the saved tab is still open, focus on that opened tab instead of opening a new one.

Plues refactors to make the caching strategy work.

### 08/12/18
* MVP supporting core functionality without any key binding supports.
* TODOs:
    1. ~~Key binding to a)trigger the extension, b)select saved tab and open it and c)remove selected tab;~~
    1. Fuzzy-search across saved tabs;
    1. Option page for extension configuration;
    1. Sync saved tabs across browser instance where user logs in;
    1. Better UI design.
