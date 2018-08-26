'use strict';

/*
 * Extension business logic goes here.
 *
 * Some of its dependencies are from ``common.js``, which is loaded along with the script itself
 * in ``index.html``.
 */

const $ = require('./jquery.min.js'),
  hash = require('./string-hash.js'),
  browser = require('./browser-polyfill.js');


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

function displayTab(tab) {
  let tabUrl = tab.url;
  let summaryDiv = $("<div>", { "class": "summary" }).html(tab.summary);
  let urlDiv = $("<small>", { "class": "url" }).html(tabUrl);
  // Navigation via Tab key https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex 
  let tabId = hash(tabUrl);
  let tabDiv = $("<div>", { id: tabId, "class": "tab", "tabindex": 0 });
  tabDiv.append(summaryDiv, [urlDiv]);

  // bind event listeners
  tabDiv.click(e => openTab(tabUrl));
  tabDiv.keydown(e => {
    // Hitting enter to open the tab, and Ctrl-d to remove the tab
    if (e.key == 'Enter') {
      console.debug(`Open tab ${tabUrl}`);
      openTab(tabUrl);
    } else if (e.ctrlKey && e.key == 'd') {
      console.debug(`Remove tab ${tabUrl}`);
      removeTab(tabUrl);
    }
  });
  // highlight and blur the tab if it gains/loses focus
  function toggle() {
    summaryDiv.toggleClass("focused");
    urlDiv.toggleClass("focused");
  }
  tabDiv.focus(toggle)
  tabDiv.blur(toggle)

  $('#tabs').prepend(tabDiv);
}

function openTab(tabUrl) {
    browser.tabs.create({ active: true, url: tabUrl }).catch(onError);
    // remove the tab from storage then close the popup so that user can focus on the opened page
    removeTab(tabUrl).then(window.close).catch(onError);
}

// remove the corresponding tab from both UI and storage layer
function removeTab(tabUrl) {
  return browser.runtime.getBackgroundPage().then(page => {
    return page.removeTab(tabUrl);
  }).catch(onError).then(res => {
    // Remove the tab from UI only if removal done on storage layer so that customer is not
    // misled when sth bad happens during removal.
    let tabId = hash(tabUrl);
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
      }).forEach(displayTab);
    }).catch(onError);
  }
);

