import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "./App";

export const TestContext = React.createContext(0);

ReactDOM.render(
    <TestContext.Provider value={0}>
        <App />
    </TestContext.Provider>,
    document.getElementById("content")
);