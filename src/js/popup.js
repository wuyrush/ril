'use strict';

/*
 * Extension business logic goes here.
 *
 * Some of its dependencies are from ``common.js``, which is loaded along with the script itself
 * in ``index.html``.
 */

const $ = require('./jquery.min.js'),
  hash = require('./string-hash.js');

// for generic debugging purpose
function onError(err) { console.error(err); }

function getEpochSeconds() {
  return Math.floor(Date.now() / 1000);
}

function getTabsFromStorage() {
  return browser.storage.local.get("tabs").then(results => {
    return results["tabs"];
  });
}

function saveTabsToStorage(tabs) {
  // Overwrite the old data when saving, since we don't know what 
  // the storage layer  gave us is a pointer to the original object or a new copy.
  return browser.storage.local.set({"tabs": tabs});
}

function onSaveTabBtnClicked() {
  let gettingCurrentBrowserTabs = browser.tabs.query({currentWindow: true, active: true});
  let gettingSavedTabs = getTabsFromStorage();

  Promise.all([gettingCurrentBrowserTabs, gettingSavedTabs]).then(
    ([currentBrowserTabs, savedTabs]) => {
      if (currentBrowserTabs.length != 1) {
        console.error(`Multiple active tabs being selected: ${currentBrowserTabs}`);
        return;
      }
      let currentBrowserTab = currentBrowserTabs[0];

      if (savedTabs === undefined) {
        console.debug("No saved tabs in storage layer");
        savedTabs = {};
      }

      if (currentBrowserTab.url in savedTabs) {
        console.debug("Tab already saved.");
        return;
      } 

      let currentTab = new Tab(currentBrowserTab.url, currentBrowserTab.title, getEpochSeconds());
      addSavedTabToUI(currentTab);
      // we don't need to save Tab instance as-it-is into storage layer. Rule out redundant data to
      // greatest extent when storing. In our case, We shall not store the url as part of the
      // value, since it is already the key.
      savedTabs[currentTab.url] = { summary: currentTab.summary, created: currentTab.created };
      return saveTabsToStorage(savedTabs);
    }
  ).catch(onError);
}

function addSavedTabToUI(tab) {
  let summaryDiv = $("<div>", { "class": "summary" }).html(tab.summary);
  let urlDiv = $("<small>", { "class": "url" }).html(tab.url);
  let summaryUrlWrapperDiv = $("<div>", { "class": "summary-url-wrapper" });
  summaryUrlWrapperDiv.append(summaryDiv, [urlDiv]);

  let rmvBtnDiv = $("<button>", { "class": "rmv-tab-btn"}).html("X");

  let tabId = hash(tab.url);
  let tabDiv = $("<div>", { id: tabId, "class": "tab" });
  tabDiv.append(summaryUrlWrapperDiv, [rmvBtnDiv]);

  rmvBtnDiv.click(() => {
    removeTab(tab).catch(onError);
  });
  summaryUrlWrapperDiv.click(() => {
    browser.tabs.create({ active: true, url: tab.url }).catch(onError);
    // remove the tab from storage then close the popup so that user can focus on the opened page
    removeTab(tab).then(window.close).catch(onError);
  });

  $('#tabs').prepend(tabDiv);
}

// remove the corresponding tab from both UI and storage layer
function removeTab(tab) {
  let tabId = hash(tab.url);
  $("#" + tabId).remove();
  return removeTabFromStorage(tab);
}

function removeTabFromStorage(tab) {
  let gettingTabs = getTabsFromStorage();
  return gettingTabs.then(tabs => {
    delete tabs[tab.url];
    // save in overwriting manner 
    return saveTabsToStorage(tabs);
  });
}


$(
  function() {
    $('#save-tab-btn').click(onSaveTabBtnClicked);
    // display saved tabs
    getTabsFromStorage().then(tabs => {
      if (tabs === undefined) {
        console.debug("No saved tabs to display.");
        return;
      }
      Object.getOwnPropertyNames(tabs).map(url => {
        let tab = tabs[url];
        tab.url = url;
        return tab;
      }).sort((t1, t2) => {
        // sort tabs in ascending order of timstamp, so that the most recently added tabs come to
        // the top when displayed
        return t1.created - t2.created;
      }).forEach(addSavedTabToUI);
    }).catch(onError);
  }
);

