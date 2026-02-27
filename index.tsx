import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "./lib/env"; // Validate env vars
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ToastContext";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
