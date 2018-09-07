/**
 * Listen to user's save tab actions and react: Cache the pages user saved. Persist the saved
 * pages to storage area asynchornously.
 *
 * Some utils are from the common module.
 */

'use strict';


// cache for saved tabs. Extension configuration, if any, should go directly to storage area.
var cache = {}

function getSavedTabs() {
  // tabs in cache
  if (Object.keys(cache).length > 0) {
    return Promise.resolve(cache);
  }

  return Promise.all([browser.storage.local.get(), browser.storage.sync.get()]).then(
    ([localData, syncData]) => {
      Object.entries(syncData).map(([url, shrinked]) => {
        // turn stuff in sync storage area to local tabs then add to cache
        let expanded = expand(shrinked);
        console.debug(`Expanded: ${expanded}`);
        Object.assign(cache, { [url]: expanded });
      });
      // then add local storage. No need to worry about the problem of overwrite for now since url,
      // which leads to the page we would like to resume, is the only thing that matters here.
      Object.assign(cache, localData);
      return cache;
    }
  );
}

// save tab data to cache and propagate the change to local and sync storage area
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
    // save to local and sync storage area; We need some transformation to be space efficient
    // TODO: maybe a more space-saving string-to-string compression algorithm?
    let shrinked = shrink(tabData);
    console.debug(`Shrinked data: ${shrinked}`);
    return Promise.all([
      browser.storage.local.set({ [tab.url]: tabData }),
      browser.storage.sync.set({ [tab.url]: shrinked })
    ]);
  }).catch(onError);
}

// shrink the summary and created timestamp into a string to be a bit space efficient
function shrink(tabData) {
  return `${tabData.summary}${SEP}${tabData.created}`;
}

// expand the shrinked summary and created timestamp string
function expand(shrinkedTabData) {
  console.debug('Data to expand: ' + shrinkedTabData);
  let separatorIdx = shrinkedTabData.lastIndexOf(SEP);
  if (separatorIdx < 0) {
    let err = `Invalid shrinked tab data: ${shrinkedTabData}`;
    throw err;
  }

  let summary = shrinkedTabData.substring(0, separatorIdx);
  let created = parseInt(shrinkedTabData.substring(separatorIdx + 1));
  return { summary, created };
}

// remove saved tab data from cache given tab url and propagate the change to all storage area.
function removeTab(tabUrl) {
  delete cache[tabUrl];

  return Promise.all([
    browser.storage.local.remove(tabUrl),
    browser.storage.sync.remove(tabUrl)
  ]);
}

// listens to change events wrt the sync storage area
function onSyncChange(changes, area) {
  if (area != 'sync') {
    return;
  }
  // compare with cache for each pair. Note the invariant we assume is local area is "sync"ed
  // with cache already. If we found discrepancy between cache and sync area, we apply changes
  // in sync area to both cache and local area.
  Object.entries(changes).map(([url, change]) => {
    if (change.oldValue !== undefined && change.newValue !== undefined) {
      console.debug(`Tab ${url} was updated. Updated from ${change.oldValue} to ${change.newValue},`);
      return;
    }

    if (change.oldValue === undefined && change.newValue !== undefined) {
      if (url in cache) {
        console.debug(`add-from-local: ${url}`);
        return;
      }
      console.debug(`add-from-remote: ${url}`);
      let expanded = expand(change.newValue);
      browser.storage.local.set({ [url]: expanded }).then(
        () => {
          cache[url] = expanded; 
        }
      ).catch(onError);
    } else {
      if (url in cache) {
        console.debug(`remove-from-remote: ${url}`);
        delete cache[url];
        browser.storage.local.remove(url).catch(onError);
        return;
      }
      console.debug(`remove-from-local: ${url}`);
    }
  });
}

function doSaveTab(cmd) {
  if (cmd == "ril-save-tab") {
    console.debug("Save-tab event triggered");
    saveTab();
  }
}

// listen to save-tab action of user
browser.commands.onCommand.addListener(doSaveTab);

// listen to change event on storage area
browser.storage.onChanged.addListener(onSyncChange);

/* Following will be executed upon loading. Normally it is only executed upon Browser (re)start or
 * extension (re)installation. */
console.debug('Loading data from local and sync storage area ...');

getSavedTabs().then(allData => {
  let tabCount = Object.keys(allData).length;
  console.debug(`Data loaded from storage area. No. tabs loaded: ${tabCount}`);
}).catch(onError);

console.debug('Background script loaded');

