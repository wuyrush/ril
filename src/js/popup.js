import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import {
  Input,
  Container,
  Content,
  Box,
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
      matchedTabs: [],  // result of fuzzy search on `query`
      errors: [],       // errors to display to the user, if present
    };
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
            this.setState({ savedTabs: re[KEY_TABS], errors: re[KEY_ERR] });
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
    return (
      <Container style={{ margin: 0, width: 400 }}>
        {this.state.errors.length > 0 &&
          <div>
            {errors}
          </div>
        }
        <Input
          type='text'
          placeholder='Search saved tabs ...'
          style={{ width: '100%', borderRadius: 0 }}
        >
        </Input>
        <Container style={{ margin: 0, width: '100%' }}>
        {
          this.state.savedTabs.map(({title, url}) => (
            <Tab title={title} url={url} />
          ))
        }
        </Container>
      </Container>
    );
  }
}

// Represents saved tabs
function Tab(props) {
  return (
    <Box
      style={{
        padding: 3, margin: 0, width: '100%', borderRadius: 0,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
      }}>
      {props.title}<br /><small>{props.url}</small>
    </Box>
  )
}

ReactDOM.render(
  <Ril />,
  document.getElementById('app')
)
