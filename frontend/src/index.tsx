import React from "react";
import ReactDOM from "react-dom";
import { ErrorBoundary } from "react-error-boundary";
import AppInner from "./App";
import { AppError } from "./AppError";
import "./aspects/DataDog/DataDog";
import "./index.css";

ReactDOM.render(
    <React.StrictMode>
        <ErrorBoundary FallbackComponent={AppError}>
            <AppInner />
        </ErrorBoundary>
    </React.StrictMode>,
    document.getElementById("root")
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
    import.meta.hot.accept();
}
