import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Blackjack from "../../blackjack/blackjack";

export default function App() {
  return (
    <Router>
      <Blackjack />
    </Router>
  );
}
