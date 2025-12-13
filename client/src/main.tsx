import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeGA } from "./lib/google-analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";

// Initialize Google Analytics
initializeGA();

// Initialize Vercel Speed Insights
injectSpeedInsights();

createRoot(document.getElementById("root")!).render(<App />);
