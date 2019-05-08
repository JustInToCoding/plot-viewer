import React, { Component } from "react";
import "./App.css";
import Viewer from "./viewer/viewer";
import { OpenLayers } from "./open-layers/open-layers";
import { Route, Switch } from "react-router-dom";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Switch>
          <Route exact path="/" component={Viewer} />
          <Route path="/v2" component={OpenLayers} />
        </Switch>
      </div>
    );
  }
}

export default App;
