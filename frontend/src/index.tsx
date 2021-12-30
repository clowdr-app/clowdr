import React from "react";
import ReactDOM from "react-dom";
import { ErrorBoundary } from "react-error-boundary";
import { App, AppError } from "./aspects/App";
import "./aspects/DataDog/DataDog";
import "./index.css";

window.global = window.global || {};
window.global.Uint8Array = Uint8Array;

window.process = window.process || {};
window.process.env = window.process.env || {};

ReactDOM.render(
    <React.StrictMode>
        <ErrorBoundary FallbackComponent={AppError}>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
    document.getElementById("root")
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
    import.meta.hot.accept();
}
