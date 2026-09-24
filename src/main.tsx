import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./api/client";
import "./i18n";
import { App } from "./app/app";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
