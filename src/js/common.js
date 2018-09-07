'use strict';

/* Common utils shared by front-end and background scripts. */

// for generic debugging purpose
function onError(err) { console.error(err); }

function getEpochSeconds() {
  // faster hack: https://stackoverflow.com/q/4228356
  return ~~(Date.now() / 1000);
}

// Individual tab saved by user
class Tab {
  constructor(url, summary, created) {
    this.url = url;             // identifier of a tab. Meanwhile we need it to re-open the tab
    this.summary = summary;     // for searching. Default to the tab title. User is able to customize it for noting purpose. 
    this.created = created;     // mark when it is saved and categorize tabs when display
  }
}

// Used in the data structure representing tabs saved to the sync storage area, serving as the
// separator between summary and created timestamp.
const SEP = '|';

console.debug('Common utils loaded');

