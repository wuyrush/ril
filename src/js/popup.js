import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import {
  Input,
  Container, 
} from 'bloomer';

class Ril extends Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }

  render() {
    return (
      <>
      <Input type='text' placeholder='Search saved tabs ...' ></Input>
      <Container>
        <div>Foo</div>
        <div>Foo</div>
        <div>Foo</div>
      </Container>
      </>
    );
  }
}

ReactDOM.render(
  <Ril />,
  document.getElementById('app')
)
