import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import {
  Input,
  Container,
  Content,
  Box,
  Notification,
} from 'bloomer';

import Fuse from 'fuse.js';

const KEY_TITLE = 'title',
  KEY_URL = 'url',
  KEY_TABS = 'tabs',
  KEY_ERR = 'errors';

var log = console;

var browser = require('webextension-polyfill');
if (typeof browser === 'undefined' || browser === null) {
  throw 'Webextension polyfill not found! Have you included it using webpack?'
} else if (typeof Fuse === 'undefined' || Fuse === null) {
  throw 'Fuse not found. Unable to perform fuzzy searching. Have you included it using webpack?'
}

class Ril extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: '',
      savedTabs: [],    // all the saved tabs
      matchedTabs: [],  // tabs in `savedTabs` which match the query
      errors: [],       // errors to display to the user, if present
      selectedTabIndex: 0, // index of the tab selected by user - This is an index of `matchedTabs` array
    };
    // reference to extension background page
    this.background = null;

    this.handleSearchQuery = this.handleSearchQuery.bind(this);
    this.handleSelectTab = this.handleSelectTab.bind(this);
    this.handleOpenTab = this.handleOpenTab.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleDeleteTab = this.handleDeleteTab.bind(this);
  }

  handleKeyDown(event) {
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        log.debug('Select tab event', event.key);
        this.handleSelectTab(event.key === 'ArrowDown');
        break;
      case 'Enter':
        log.debug('Open tab event', event.key);
        this.handleOpenTab();
        break;
      case 'd':
        if (!event.ctrlKey) {
          return;
        }
        this.handleDeleteTab()
    }
  }

  handleSearchQuery(event) {
    let query = event.target.value.trim();
    let result = null;
    // return all saved tabs if search query is empty
    if (query === '') {
      result = this.state.savedTabs;
    } else {
      let fuse = new Fuse(this.state.savedTabs, this.background.options);
      // TODO: search is synchronized - anyway to do it async?
      result = fuse.search(query);
    }
    // log.debug('Got search result for query "%s": %s', query, JSON.stringify(result));

    this.setState({
      matchedTabs: result,
      // reset the index of selected tab since the tab which got selected previously may be
      // filtered out by the current query
      selectedTabIndex: 0,
    });
  }

  handleSelectTab(next) {
    // Move the index of selected tab forwared if next is true else backward. Note this is relative
    // to the matched tab array. Wrap-over behavior is enforced so that if the current selected tab is the
    // 1st tab in the array and we are moving backwards, the newly selected tab will be the last
    // one in the array.
    log.debug('Current selected tab index %d. Move to next tab? %s', this.state.selectedTabIndex, next);
    // return if there is no matched tabs.
    let matchedTabs = this.state.matchedTabs;
    if (matchedTabs.length === 0) {
      return;
    }
    // move the index either forward or backward
    let move = next ? 1 : -1;
    // at this point matchedTabs has length > 0, and this.state.selectedTabIndex is guaranteed to be
    // >= 0, then the term before the modulo operator is guarantee to be >= 0 even if move == -1
    let newSelectedTabIndex = (matchedTabs.length + this.state.selectedTabIndex + move) % matchedTabs.length;
    log.debug('Tab with index %d is selected', newSelectedTabIndex);
    this.setState({selectedTabIndex: newSelectedTabIndex});
  }

  handleOpenTab() {
    log.debug('Open tab with index %d in matched tab array', this.state.selectedTabIndex);
    let tabToOpen = this.state.matchedTabs[this.state.selectedTabIndex];
    browser.tabs.create({
      active: true,
      url: tabToOpen[KEY_URL],
    }).then(
      _ => {
        // remove the opened tab from cache and storage
        return this.background.deleteTab(tabToOpen[KEY_URL]);
      },
      err => {
        log.error('Error opening tab %s: %s', JSON.stringify(tabToOpen), JSON.stringify(err));
      }
    ).catch(err => log.error(err));
  }

  handleDeleteTab() {
    let { matchedTabs, selectedTabIndex } = this.state;
    // if the matched tab array is empty then we done here
    if (matchedTabs.length === 0) {
      return;
    }
    // otherwise remove the selected tab via its index
    let tabToRemove = matchedTabs[selectedTabIndex];
    let url = tabToRemove[KEY_URL];
    this.background.deleteTab(url).then(
      re => {
        if (re === false) {
          let errMsg = `tab with url ${url} is not removed from local storage`;
          log.error(errMsg);
          this.setState({ errors: [errMsg] });
          return;
        }
        // tab removed from local storage and cache. Update UI state
        let copy = [...matchedTabs];
        copy.splice(selectedTabIndex, 1);
        let newSelectedTabIndex = selectedTabIndex;
        // edge case: remove the tailing tab
        if (copy.length <= selectedTabIndex) {
          newSelectedTabIndex = Math.max(0, selectedTabIndex - 1);
        }
        this.setState({ matchedTabs: copy, selectedTabIndex: newSelectedTabIndex });
      },
      err => {
        log.error('Error in background script when removing tab with url ', url, err);
        this.setState({ errors: [`Failed to remove the tab in background: ${JSON.stringify(err)}`] });
      }
    );
  }

  componentDidMount() {
    browser.runtime.getBackgroundPage().then(
      bg => {
        this.background = bg;
        return this.background.listTabs().then(
          re => {
            if (re === false) {
              errMsg = 'Failed to retrieve saved tabs';
              log.error(errMsg);
              this.setState({ errors: [errMsg] });
              return;
            }
            // otherwise the call succeeded
            this.setState({ savedTabs: re[KEY_TABS], matchedTabs: re[KEY_TABS], errors: re[KEY_ERR] });
          }
        )
      },
      err => {
        let errMsg = 'Failed to load background page';
        log.error(errMsg, err);
        this.setState({ errors: [errMsg] });
      }
    ).catch(
      err => {
        let errMsg = 'Failed to retrieve saved tabs';
        log.error(errMsg, err);
        this.setState({ errors: [errMsg] });
      }
    );
  }

  render() {
    // TODO: the error notification doesn't seem to work - need to figure out why
    return (
      <Container
        style={{ margin: 0, width: 400 }}
        onKeyDown={this.handleKeyDown}
      >
        {this.state.errors.length > 0 &&
          <Container>
            {
              this.state.errors.map((err, idx) => {
                <Notification isColor='danger' key={idx}>
                  {err}
                </Notification>
              })
            }
          </Container>
        }
        <SearchBox onChange={this.handleSearchQuery} />
        <Container style={{ margin: 0, width: '100%' }}>
        {
          this.state.matchedTabs.map(({title, url}, idx) => (
            <Tab
              title={title} url={url}
              selected={idx === this.state.selectedTabIndex}
              key={url}>
            </Tab>
          ))
        }
        </Container>
      </Container>
    );
  }
}

// Represents saved tabs
function Tab(props) {
  // Note in react the convention for names is camelCase
  return (
    <Box
      style={{
        padding: 3, margin: 0, width: '100%', borderRadius: 0,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        backgroundColor: props.selected ? '#0099ff7a' : '#fff'
      }}>
      {props.title}<br /><small>{props.url}</small>
    </Box>
  )
}

// Represents fuzzy search input widget
function SearchBox(props) {
  // return an input box with autofocus. Note the autofocus attribute depends on HTML5.
  return (
    <Input
      autoFocus
      type='text'
      placeholder='Search saved tabs ...'
      style={{ width: '100%', borderRadius: 0 }}
      onChange={props.onChange}
    >
    </Input>
  )
}

ReactDOM.render(
  <Ril />,
  document.getElementById('app')
)
