import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Viewer from './viewer/viewer';

class App extends Component {

  render() {
    return (
      <div className="App">
        <Viewer></Viewer>
      </div>
    );
  }
}

export default App;
