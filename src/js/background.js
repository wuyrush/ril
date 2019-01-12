"use strict";

var log = console;

if (typeof browser === 'undefined' || browser === null) {
  throw 'Webextension polyfill not found. Have you included it into background scripts?'
}

log.debug('All dependencies loaded');

const KEY_TITLE = 'title',
  KEY_URL = 'url',
  KEY_TABS = 'tabs',
  KEY_ERR = 'errors';

// configure fuzzy search engine - better to read source code(index.js specifically) to figure out
// the meaning of each attribute
var options = {
  shouldSort: true,
//  includeScore: true, individual result will key with "item" and "score" if specified
  threshold: 0.8,
  location: 0,
  distance: 150,
  maxPatternLength: 64,
  minMatchCharLength: 1,
  keys: [
    KEY_TITLE,
    KEY_URL,
  ],
  // id: KEY_URL, result only contains ids if specified
};

var _savedTabs = {};

/*
 * All tab-related operations below return promise of boolean value indicating succeed / failure.
 *
 */

function saveTab({title, url}) {
  // check whether the tab had already existed or not. Returns if so.
  if (_savedTabs.hasOwnProperty(url)) {
    log.debug('Tab already saved.')
    return Promise.resolve(true);
  }
  // otherwise populate the tab data to cache, local and sync storage. The propagation must succeeds
  // in cache and local storage layer for the whole operation to be considered as succeeded.
  let tabToSave = { [url]: title };
  return browser.storage.sync.set(tabToSave).then(
    () => { return { [KEY_ERR]: [] } },
    err => {
      log.error('Failed to save tab', tabToSave, 'to sync storage. Error:', err);
      return { [KEY_ERR]: ['Failed to save tab to sync storage'] };
    }
  ).then(
    re => {
      return browser.storage.local.set(tabToSave).then(
        () => {
          // succeeded at local, modify cache
          _savedTabs[url] = title;
          return { [KEY_ERR]: [].concat(re[KEY_ERR]) }
        },
        err => {
          log.error('Failed to save tab', tabToSave, 'to local storage. Error:', err)
          return false;
        }
      )
    }
  );
}

function deleteTab(url) {
  // remove the tab from sync layer in best-effort manner, then do cleanup in cache and local
  // storage layer. If the latter failed the whole operation is deemed failed.
  return browser.storage.sync.remove(url).then(
    () => { return { [KEY_ERR]: [] } },
    err => {
      let errMsg = `Failed to remove tab with url ${url} from sync storage`;
      log.error(errMsg, err);
      return { [KEY_ERR]: [errMsg] };
    }
  ).then(
    re => {
      return browser.storage.local.remove(url).then(
        () => {
          try {
            delete _savedTabs[url];
          } catch (error) {
            log.warn('Attempted to remove own non-configurable keys', url);
          }
          return { [KEY_ERR]: [].concat(re[KEY_ERR]) };
        },
        err => {
          log.error(`Failed to remove tab with URL ${url} from local storage.`, "Error:", err)
          return false;
        }
      );
    }
  );
}

function listTabs() {
  // note chances are we save tabs in different browser instances and we need to surface all of them
  // by always querying the sync layer
  let gettingfromSync = browser.storage.sync.get(null).then(
    tabs => {
      return { [KEY_TABS]: tabs, [KEY_ERR]: [] };
    },
    err => {
      let errMsg = 'Failed to get data from sync storage';
      log.error(errMsg, err);
      return { [KEY_TABS]: {}, [KEY_ERR]: [errMsg] };
    }
  );
  let gettingFromLocal = browser.storage.local.get(null).then(
    tabs => {
      return { [KEY_TABS]: tabs, [KEY_ERR]: [] };
    },
    err => {
      let errMsg = 'Failed to get data from local storage';
      log.error(errMsg, err);
      return { [KEY_TABS]: {}, [KEY_ERR]: [errMsg] };
    }
  );
  return Promise.all([
    gettingFromLocal, gettingfromSync
  ]).then(([local, sync]) => {
    // merge data from both sources and dump it to cache
    _savedTabs = Object.assign(_savedTabs, local[KEY_TABS], sync[KEY_TABS]);
    return {
      [KEY_TABS]: Object.entries(_savedTabs).map(([url, title]) => {
        return { [KEY_URL]: url, [KEY_TITLE]: title };
      }),
      [KEY_ERR]: local[KEY_ERR].concat(sync[KEY_ERR])
    }
  }).catch(err => {
    log.error('Got error when retrieving list of saved tabs', err);
    return false;
  });
}

function handleSaveTab() {
  // make sure we only capture the active tab in the current window, which user has focus on
  browser.tabs.query({ active: true, currentWindow: true }).then(
    activeTabs => {
      log.debug('Got active and current tabs of length %d', activeTabs.length);
      let tab = activeTabs[0];
      return saveTab({ [KEY_URL]: tab.url, [KEY_TITLE]: tab.title });
    },
    err => {
      log.error('Error when getting the current tab', err)
    }
  ).catch(err => log.error('Failed to save tab', err));
}

// Add handler for tab-saving events
browser.commands.onCommand.addListener(cmd => {
  if (cmd === 'ril-save-tab') {
    log.debug('Save-tab event triggered');
    handleSaveTab();
  }
});

log.debug('Background script loaded')
