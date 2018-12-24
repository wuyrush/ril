import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import {
  Input,
  Container,
  Content,
  Box,
} from 'bloomer';

// polyfill is done during webpack bundling time

class Ril extends Component {
  constructor(props) {
    super(props);
    this.state = {
      savedTabs: null,  // TODO: fuzzysearch set data structure ?
    };

    console.log('Loading background stuff');
    // load variable from extension background
    browser.runtime.getBackgroundPage().then(
      bp => console.log(bp.savedTabs),
      err => console.log(`Error: ${error}`));
  }

  render() {
    return (
      <Container style={{ margin: 0, width: 400 }}>
        <Input
          type='text'
          placeholder='Search saved tabs ...'
          style={{ width: '100%', borderRadius: 0 }}
        >
        </Input>
        <Container style={{ margin: 0, width: '100%' }}>
          <Tab title='VVeryLongFooVeryLongFooVeryLongFooVeryLongFooVeryLongFooVeryLongFooVeryLongFooVeryLongFooVeryLongFooVeryLongFooVeryLongFooVeryLongFooeryLongFoo' url='http://yveryexample.com'/>
          <Tab title='Foo' url='https://example.com'/>
          <Tab title='Foo' url='https://example.com'/>
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
