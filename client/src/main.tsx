// CRITICAL: Import SES guard first, before any other imports
// This ensures the guard is active before React and other modules load
import './lib/module-init-fix';

import React from 'react'
// Expose React on window to guard against environments that expect a global React
;(window as any).React = React;
import './index.css'

async function bootstrap() {
  // Load app modules only after global React is set.
  const ReactDOM = await import('react-dom/client');
  const { QueryClientProvider } = await import('@tanstack/react-query');
  const { queryClient } = await import('./lib/queryClient');
  const { default: App } = await import('./App.tsx');

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

bootstrap().catch((error) => {
  console.error('Error during app bootstrap:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding:16px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <h1>Something went wrong while starting the app.</h1>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
      </div>
    `;
  }
});
