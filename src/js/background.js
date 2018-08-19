/**
 * Listen to user's save tab actions and react: Cache the pages user saved. Persist the saved
 * pages to storage layer asynchornously.
 *
 * Some utils are from the common module.
 */

'use strict';

// cache for saved tabs. Extension configuration, if any, should go directly to storage layer.
var cache = {}

function getSavedTabs() {
  // tabs in cache
  if (Object.getOwnPropertyNames(cache).length > 0) {
    return Promise.resolve(cache);
  }

  // TODO: if cache empty, try loading from local or sync storage layer.
  // Given the background page is loaded(and executed) when the extension is loaded to browser,
  // possible scenarios are user has saved tabs in sync storage layer and
  // reinstall the extension or install the extension in other browser instances.
  // TODO: refactor when store extension configuration values
  return browser.storage.local.get().then(results => {
    // fill the cache
    cache = {...cache, ...results};
    return cache;
  });
}

// save tab data to cache, local (and TODO: sync) storage area
function saveTab() {
  let gettingCurrentBrowserTabs = browser.tabs.query({currentWindow: true, active: true});
  return gettingCurrentBrowserTabs.then(tabs => {
    if (tabs.length != 1) {
      let err = `Multiple active tabs being selected: ${tabs}`;
      console.error(err);
      throw err;
    }
 
    let tab = tabs[0];
    // save in overwrite mode -- no need to do retrieve-check-then-save/update, which can be
    // time consuming.
    let tabData = { summary: tab.title, created: getEpochSeconds() };
    cache[tab.url] = tabData;
    // Neither { tab.url: tabData  } nor (let tabUrl = tab.url; return {tabUrl: data} is correct.
    // https://stackoverflow.com/a/2274327
    return { [tab.url]: tabData };
  }).catch(onError).then(tabToSave => browser.storage.local.set(tabToSave));
}

// remove saved tab data from cache and storage layer given tab url.
function removeTab(tabUrl) {
  delete cache[tabUrl];
  return browser.storage.local.remove(tabUrl);
}

// listen to save-tab action of user
browser.commands.onCommand.addListener(cmd => {
  if (cmd == "ril-save-tab") {
    console.debug("Save-tab event triggered");
    saveTab();
  }
})
