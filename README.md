# ril

Save tabs you want to read later to avoid millions of tabs opened in your browser.

## Installation

### Firefox/Chrome extension store
TODO

### Build from source

First we need to have Node and NPM installed. Recommended approach is via [NVM](https://github.com/creationix/nvm).

```shell
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
command -v nvm
nvm install node

# start a new shell session, then run following:
nvm use node
```

Then we can build `ril`:

```shell
git clone https://github.com/wuyrush/ril ~/ril
cd ~/ril
npm install && npm run build
```

The build process will generate a directory containing the extension bundle at `~/ril/addon`.

Now we can add the extension to the browser(instructions for [FireFox](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Temporary_Installation_in_Firefox) and [Chrome](https://developer.chrome.com/extensions/getstarted#manifest) to load extensions locally).

Enjoy!

## Updates

### 09/06/18
* Sync the changes of tabs saved to browser's sync storage area. Note this essentially exploits the extension sync storage area, which has strict 100KB space limit. Thus it can be the case where there exist tabs failed to make it to the sync storage area. As a consequence, the data persisted in cache and local storage layer in different browser instances will diverge.
* Refactors

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

