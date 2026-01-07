import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeGA } from "./lib/google-analytics";
import { initializeGlobalErrorHandler } from "./lib/global-error-handler";

// Initialize global error handler EARLY, before React mounts
// This catches SES and lexical errors that occur during script loading
// Wrap in try-catch to ensure it doesn't prevent app from loading
try {
  initializeGlobalErrorHandler({
    showDialogForTypes: ['network'], // Only show dialogs for network errors, not SES/lexical
    // Don't show dialogs for SES/lexical errors as they're from browser extensions
    // They'll still be tracked but won't interrupt the user
  });
} catch (error) {
  console.warn('[main.tsx] Failed to initialize global error handler:', error);
  // Continue anyway - error handler is not critical for app to function
}

// Initialize Google Analytics
try {
  initializeGA();
} catch (error) {
  console.warn('[main.tsx] Failed to initialize GA:', error);
}

// Mount React app with error handling
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error('[main.tsx] Failed to mount React app:', error);
  
  // Show fallback UI if React fails to mount
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="text-align: center; max-width: 600px;">
          <h1 style="color: #dc2626; margin-bottom: 16px;">Uygulama Yüklenemedi</h1>
          <p style="color: #6b7280; margin-bottom: 24px;">
            Uygulama başlatılırken bir hata oluştu. Lütfen sayfayı yenileyin veya tarayıcı uzantılarınızı kontrol edin.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;"
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    `;
  }
}
