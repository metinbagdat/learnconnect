// CRITICAL: Import SES guard first, before any other imports
// This ensures the guard is active before React and other modules load
import './lib/module-init-fix';

import React from 'react'
// Expose React on window to guard against environments that expect a global React
;(window as any).React = React;
import './index.css'

function isReactUndefinedRuntimeError(error: unknown): boolean {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as any).message || '')
      : String(error || '');

  return (
    message.includes('React is undefined') ||
    message.includes('useState", React is undefined') ||
    message.includes("useState', React is undefined")
  );
}

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

void bootstrap().catch((error) => {
  if (isReactUndefinedRuntimeError(error)) {
    try {
      const url = new URL(window.location.href);
      const alreadyRetried = url.searchParams.get('lc_react_retry') === '1';
      if (!alreadyRetried) {
        url.searchParams.set('lc_react_retry', '1');
        window.location.replace(url.toString());
        return;
      }
    } catch {
      // Ignore URL parse failures and continue to fallback UI.
    }
  }

  console.error('Bootstrap failed:', error);
  const root = document.getElementById('root');
  if (root) {
    root.textContent = 'Uygulama yüklenemedi. Lütfen sayfayı yenileyin veya güvenlik eklentisini kontrol edin.';
  }
});
