'use strict';

/*
 * Extension business logic goes here.
 *
 * Some of its dependencies are from ``common.js``, which is loaded along with the script itself
 * in ``index.html``.
 */

const $ = require('./jquery.min.js'),
  hash = require('./string-hash.js');


function getSavedTabs() {
  return browser.runtime.getBackgroundPage().then(page => {
    return page.getSavedTabs();
  }).then(tabsData => {
    return Object.getOwnPropertyNames(tabsData).map(tabUrl => {
      let tabData = tabsData[tabUrl];
      return new Tab(tabUrl, tabData.summary, tabData.created);
    });
  }).catch(onError);
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
    removeTab(tab);
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
  return browser.runtime.getBackgroundPage().then(page => {
    return page.removeTab(tab.url);
  }).catch(onError).then(res => {
    // Remove the tab from UI only if removal done on storage layer so that customer is not
    // misled is sth bad happens during removal.
    let tabId = hash(tab.url);
    $("#" + tabId).remove();
  });
}


$(
  function() {
    // display saved tabs
    getSavedTabs().then(tabs => {
      if (tabs.length === 0) {
        console.debug("No saved tabs to display.");
        return;
      }

      tabs.sort((t1, t2) => {
        // sort tabs in ascending order of timstamp, so that the most recently added tabs come to
        // the top when displayed
        return t1.created - t2.created;
      }).forEach(addSavedTabToUI);
    }).catch(onError);
  }
);

