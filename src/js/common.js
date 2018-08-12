'use strict';

/* Common utils shared by front-end and background scripts. */


// Individual tab saved by user
class Tab {
  constructor(url, summary, created) {
    this.url = url;             // identifier of a tab. Meanwhile we need it to re-open the tab
    this.summary = summary;     // for searching. Default to the tab title. User is able to customize it for noting purpose. 
    this.created = created;     // mark when it is saved and categorize tabs when display
  }
}

console.debug('Common utils loaded');

