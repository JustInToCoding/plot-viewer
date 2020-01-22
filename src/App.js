import React, { Component } from "react";
import "./App.css";
import Viewer from "./viewer/viewer";
import { OpenLayers } from "./open-layers/open-layers";
import { Route, Switch } from "react-router-dom";
import { Pic } from "./pic";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Switch>
          <Route
            exact
            path="/"
            render={() => {
              return <Viewer promptInstall={this.props.promptInstall}></Viewer>;
            }}
          />
          <Route exact path="/pic" component={Pic} />
          <Route path="/v2" component={OpenLayers} />
        </Switch>
      </div>
    );
  }
}

export default App;
