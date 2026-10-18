import React from "react";
import ReactDOM from "react-dom/client";
import Router from "./router";
import BrandOpening from "./BrandOpening";
import Sorts from "./Sorts";
import Preferences from "./Preferences";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Preferences>
      <BrandOpening />
      <Sorts>
        <Router />
      </Sorts>
    </Preferences>
  </React.StrictMode>
);
