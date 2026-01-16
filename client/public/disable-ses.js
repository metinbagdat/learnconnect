/**
 * Disable SES (Secure ECMAScript) completely
 * This script runs BEFORE any other scripts to prevent SES from interfering
 */
(function() {
  'use strict';
  
  // Try to disable SES if it exists
  if (typeof window !== 'undefined') {
    // Override any SES-related globals
    if (typeof lockdown !== 'undefined') {
      // Replace lockdown with a no-op
      window.lockdown = function() {
        console.warn('[disable-ses] SES lockdown attempted but disabled');
      };
    }
    
    if (typeof harden !== 'undefined') {
      // Replace harden with identity function
      window.harden = function(obj) {
        return obj;
      };
    }
    
    // Suppress all SES-related console messages
    var originalError = console.error;
    var originalWarn = console.warn;
    
    console.error = function() {
      var message = Array.prototype.join.call(arguments, ' ');
      if (
        message.indexOf('SES') !== -1 ||
        message.indexOf('lockdown') !== -1 ||
        message.indexOf('Removing unpermitted intrinsics') !== -1 ||
        message.indexOf('Removing intrinsics') !== -1 ||
        message.indexOf('getOrInsert') !== -1 ||
        message.indexOf('toTemporalInstant') !== -1 ||
        message.indexOf('lockdown-install.js') !== -1
      ) {
        return; // Suppress SES errors
      }
      originalError.apply(console, arguments);
    };
    
    console.warn = function() {
      var message = Array.prototype.join.call(arguments, ' ');
      if (
        message.indexOf('SES') !== -1 ||
        message.indexOf('lockdown') !== -1 ||
        message.indexOf('Removing unpermitted intrinsics') !== -1 ||
        message.indexOf('Removing intrinsics') !== -1 ||
        message.indexOf('getOrInsert') !== -1 ||
        message.indexOf('toTemporalInstant') !== -1 ||
        message.indexOf('lockdown-install.js') !== -1
      ) {
        return; // Suppress SES warnings
      }
      originalWarn.apply(console, arguments);
    };
    
    // Catch SES errors globally
    window.addEventListener('error', function(event) {
      var message = event.message || '';
      var source = event.filename || '';
      
      if (
        message.indexOf('SES') !== -1 ||
        source.indexOf('lockdown') !== -1 ||
        message.indexOf('SES_UNCAUGHT_EXCEPTION') !== -1
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }, true);
    
    window.addEventListener('unhandledrejection', function(event) {
      var reason = event.reason;
      var message = (reason && reason.message) || String(reason || '');
      
      if (
        message.indexOf('SES') !== -1 ||
        message.indexOf('lockdown') !== -1 ||
        message.indexOf('SES_UNCAUGHT_EXCEPTION') !== -1
      ) {
        event.preventDefault();
        return;
      }
    }, true);
  }
})();
