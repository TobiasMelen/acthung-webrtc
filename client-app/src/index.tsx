import React from "react";
import { render } from "react-dom";
import App from "./components/App";
import viewportScale from "./viewportScale";

if (viewportScale !== 1) {
  document.documentElement.style.fontSize = `${16 * viewportScale}px`;
}

render(<App />, document.getElementById("app-root"));
