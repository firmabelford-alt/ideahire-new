import React from "react";
import ReactDOM from "react-dom/client";
import Router from "./router";
import Sorts from "./Sorts";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Sorts>
      <Router />
    </Sorts>
  </React.StrictMode>
);
