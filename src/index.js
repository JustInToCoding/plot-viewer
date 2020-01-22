import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { BrowserRouter } from "react-router-dom";

let deferredPrompt;

window.addEventListener("beforeinstallprompt", e => {
  // Stash the event so it can be triggered later.
  console.log(3253);
  deferredPrompt = e;
});

const promptInstall = () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt = undefined;
  }
};

ReactDOM.render(
  <BrowserRouter basename={process.env.PUBLIC_URL}>
    <App promptInstall={promptInstall} />
  </BrowserRouter>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register({
  onUpdate: () => {},
  onSuccess: () => {}
});
