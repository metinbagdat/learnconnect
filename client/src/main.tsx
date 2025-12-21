import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeGA } from "./lib/google-analytics";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Initialize Google Analytics
initializeGA();

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <SpeedInsights />
  </>
);
