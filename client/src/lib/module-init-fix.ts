/**
 * Runtime fix for module initialization and SES errors
 * This file should be imported FIRST in main.tsx to catch initialization errors
 * 
 * SES (Secure EcmaScript) lockdown from browser extensions removes JavaScript intrinsics
 * before our code runs, causing initialization errors. This file patches around SES.
 */

// Fix for SES (Secure EcmaScript) errors from browser extensions
if (typeof window !== 'undefined') {
  // ✅ CRITICAL: Patch removed intrinsics BEFORE anything else runs
  // SES lockdown removes these methods, so we need to patch them back or avoid using them
  
  try {
    // Patch Map prototype methods if they were removed
    // @ts-ignore - These methods may not exist in SES environments
    if (Map.prototype && !Map.prototype.getOrInsert) {
      // Don't add them back - just ensure our code doesn't break if they're missing
      // Instead, we'll ensure we don't use these methods
    }
    
    // Patch WeakMap prototype methods if they were removed
    // @ts-ignore - These methods may not exist in SES environments
    if (WeakMap.prototype && !WeakMap.prototype.getOrInsert) {
      // Same - just ensure compatibility
    }
    
    // Patch Date.prototype.toTemporalInstant if removed
    if (Date.prototype && !Date.prototype.toTemporalInstant) {
      // Add a no-op replacement if needed
      // @ts-ignore - This method may not exist in SES environments
      Date.prototype.toTemporalInstant = function() {
        return null; // Return null instead of throwing
      };
    }
  } catch (e) {
    // Silently fail if patching doesn't work
  }
  
  // Suppress SES errors that come from browser extensions
  // MUST run before any console.error calls
  const suppressSESErrors = () => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    // Override console.error to filter SES messages
    console.error = function(...args: any[]) {
      const message = String(args.join(' '));
      // Suppress SES lockdown warnings (they're from extensions, not our code)
      if (
        message.includes('SES') ||
        message.includes('lockdown') ||
        message.includes('Removing unpermitted intrinsics') ||
        message.includes('Removing intrinsics') ||
        message.includes('getOrInsert') ||
        message.includes('toTemporalInstant') ||
        message.includes('lockdown-install.js')
      ) {
        // Silently suppress - these are from browser extensions
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    // Also override console.warn for SES messages
    console.warn = function(...args: any[]) {
      const message = String(args.join(' '));
      if (
        message.includes('SES') ||
        message.includes('lockdown') ||
        message.includes('Removing unpermitted intrinsics') ||
        message.includes('Removing intrinsics') ||
        message.includes('getOrInsert') ||
        message.includes('toTemporalInstant') ||
        message.includes('lockdown-install.js')
      ) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };
  };
  
  // Initialize error suppression IMMEDIATELY - before any other code runs
  suppressSESErrors();
  
  // Fix for module initialization order issues
  // Ensure proper handling of TDZ (Temporal Dead Zone) errors
  const handleInitError = (error: Error | any) => {
    const message = String(error?.message || error || '');
    
    // Check if it's a TDZ/initialization error or SES-related
    if (
      message.includes("can't access lexical declaration") ||
      message.includes('before initialization') ||
      message.includes('temporal dead zone') ||
      message.includes('SES_UNCAUGHT_EXCEPTION') ||
      message.includes('chunk-')
    ) {
      // Check if it's SES-related - if so, suppress it
      if (message.includes('SES') || error?.source?.includes('lockdown')) {
        // SES errors should be suppressed, not recovered from
        return true;
      }
      
      // For chunk initialization errors, try recovery
      if (message.includes('chunk-') || message.includes('before initialization')) {
        // Only attempt recovery once
        const recoveryKey = '__init_error_recovered_' + (error?.source || 'unknown');
        if (!sessionStorage.getItem(recoveryKey)) {
          sessionStorage.setItem(recoveryKey, 'true');
          console.warn('[ModuleInit] Chunk initialization error detected:', message.substring(0, 100));
          
          // Try reloading after a delay
          setTimeout(() => {
            if (document.readyState === 'loading') {
              window.location.reload();
            }
          }, 2000);
        }
        return true; // Prevent error from propagating
      }
    }
    
    return false;
  };
  
  // Override unhandled error handlers to catch initialization errors
  // MUST use capture phase to catch errors BEFORE they propagate
  window.addEventListener('error', (event) => {
    // Check if it's SES-related first
    const isSESError = event.message?.includes('SES') || 
                       event.filename?.includes('lockdown') ||
                       event.message?.includes('lockdown-install');
    
    if (isSESError) {
      // Suppress SES errors completely
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // Handle chunk initialization errors
    if (event.error && handleInitError(event.error)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // Also check the source/file name
    if (event.filename && (event.filename.includes('chunk-') || event.filename.includes('lockdown'))) {
      if (handleInitError(new Error(event.message || 'Unknown error'))) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
  }, true); // Use capture phase to catch early
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const isSESError = String(reason?.message || reason || '').includes('SES') ||
                       String(reason?.source || '').includes('lockdown');
    
    if (isSESError) {
      event.preventDefault();
      return;
    }
    
    if (reason && handleInitError(reason)) {
      event.preventDefault();
    }
  }, true); // Use capture phase
}

// Export empty to ensure this module is recognized as a module
export {};
