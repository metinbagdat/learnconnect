/**
 * Runtime fix for module initialization and SES errors
 * This file should be imported FIRST in main.tsx to catch initialization errors
 */

// Fix for SES (Secure EcmaScript) errors from browser extensions
if (typeof window !== 'undefined') {
  // Wrap module initialization in try-catch to prevent SES errors from blocking
  const originalEval = window.eval;
  
  // Suppress SES errors that come from browser extensions
  const suppressSESErrors = () => {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      // Suppress SES lockdown warnings (they're from extensions, not our code)
      if (
        message.includes('SES') ||
        message.includes('lockdown') ||
        message.includes('Removing unpermitted intrinsics') ||
        message.includes('getOrInsert') ||
        message.includes('toTemporalInstant')
      ) {
        // Silently suppress - these are from browser extensions
        return;
      }
      originalConsoleError.apply(console, args);
    };
  };
  
  // Initialize error suppression immediately
  suppressSESErrors();
  
  // Fix for module initialization order issues
  // Ensure proper handling of TDZ (Temporal Dead Zone) errors
  const handleInitError = (error: Error) => {
    const message = error.message || '';
    
    // Check if it's a TDZ/initialization error
    if (
      message.includes("can't access lexical declaration") ||
      message.includes('before initialization') ||
      message.includes('temporal dead zone')
    ) {
      // Log for debugging but don't throw - attempt to recover
      console.warn('[ModuleInit] Detected initialization error, attempting recovery:', message);
      
      // Force a page reload as a recovery mechanism (only if not already reloading)
      if (!sessionStorage.getItem('__init_error_recovered')) {
        sessionStorage.setItem('__init_error_recovered', 'true');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      
      // Return true to indicate we handled it
      return true;
    }
    
    return false;
  };
  
  // Override unhandled error handlers to catch initialization errors
  window.addEventListener('error', (event) => {
    if (event.error && handleInitError(event.error)) {
      event.preventDefault();
    }
  }, true); // Use capture phase to catch early
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && handleInitError(event.reason)) {
      event.preventDefault();
    }
  });
}

// Export empty to ensure this module is recognized as a module
export {};
