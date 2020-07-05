import React, { CSSProperties } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import Leader from "./Leader";
import Teams from "./Teams";
import { FormikRenderProp } from "./FormikForm";
import CheckBoxData from "./CheckBoxData";
import RefWorkout from "./RefWorkout";
import Blackjack from "../../blackjack/blackjack";

const liStyles: CSSProperties = {
  float: "left",
  padding: "14px 9px",
  textAlign: "center",
  textDecoration: "none",
  listStyle: "none"
};

export default function App() {
  return (
    <Router>
      <div>
        <nav style={{ overflow: "hidden" }}>
          <ul>
            <li style={liStyles}>
              <Link to="/">Home</Link>
            </li>
            <li style={liStyles}>
              <Link to="/teams">Teams</Link>
            </li>
            <li style={liStyles}>
              <Link to="/leader">Leader</Link>
            </li>
            <li style={liStyles}>
              <Link to="/form">Form</Link>
            </li>
          </ul>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/leader">
            <Leader />
          </Route>
          <Route path="/teams">
            <Teams />
          </Route>
          <Route path="/form">
            <FormikRenderProp />
          </Route>
        </Switch>
        <Blackjack />
        {/*<RefWorkout/>*/}
        {/*<CheckBoxData />*/}
      </div>
    </Router>
  );
}
