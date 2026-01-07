/**
 * Global error handler for catching SES, lexical, and runtime errors
 * Routes critical errors to connection error dialog
 * Logs all errors to error tracker
 */

import { errorTracker, ErrorType } from './error-tracker';

export interface GlobalErrorHandlerConfig {
  showDialogForTypes?: ErrorType[];
  onError?: (error: Error, type: ErrorType, requestId?: string) => void;
}

class GlobalErrorHandler {
  private config: GlobalErrorHandlerConfig;
  private originalOnError: typeof window.onerror | null = null;
  private unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;
  private isInitialized = false;

  constructor(config: GlobalErrorHandlerConfig = {}) {
    this.config = {
      showDialogForTypes: ['network', 'ses', 'lexical'],
      ...config,
    };
  }

  /**
   * Initialize global error handlers
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Store original handler
    this.originalOnError = window.onerror;

    // Set up window.onerror handler
    window.onerror = (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): boolean => {
      return this.handleError(message, source, lineno, colno, error);
    };

    // Set up unhandled promise rejection handler
    const self = this;
    this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      self.handleUnhandledRejection(event);
    };
    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);

    this.isInitialized = true;
  }

  /**
   * Cleanup error handlers
   */
  public cleanup(): void {
    if (!this.isInitialized) {
      return;
    }

    if (this.originalOnError) {
      window.onerror = this.originalOnError;
    } else {
      window.onerror = null;
    }

    // Remove event listener for unhandled rejections
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
      this.unhandledRejectionHandler = null;
    }

    this.isInitialized = false;
  }

  /**
   * Handle window.onerror events
   */
  private handleError(
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ): boolean {
    const errorMessage = typeof message === 'string' ? message : message.type;
    const errorObj = error || new Error(errorMessage);

    // Detect error type
    const type = this.detectErrorType(errorMessage, source);

    // Track the error
    errorTracker.track(errorObj, type, undefined, source, lineno, colno);

    // Check if we should show dialog
    if (this.config.showDialogForTypes?.includes(type)) {
      // Generate request ID for this error
      const requestId = this.generateRequestId();
      
      // Call custom error handler if provided
      if (this.config.onError) {
        this.config.onError(errorObj, type, requestId);
      }
    }

    // Call original handler if it exists
    if (this.originalOnError) {
      return this.originalOnError(message, source, lineno, colno, error);
    }

    // Return false to allow default error handling
    return false;
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason;
    const error = reason instanceof Error ? reason : new Error(String(reason));

    // Detect error type
    const type = this.detectErrorType(error.message);

    // Track the error
    errorTracker.track(error, type);

    // Check if we should show dialog
    if (this.config.showDialogForTypes?.includes(type)) {
      const requestId = this.generateRequestId();
      
      if (this.config.onError) {
        this.config.onError(error, type, requestId);
      }
    }

    // Note: We don't call original handler for unhandled rejections
    // as we're using addEventListener which doesn't have an "original" to restore
  }

  /**
   * Detect error type from message and source
   */
  private detectErrorType(message: string, source?: string): ErrorType {
    const lowerMessage = message.toLowerCase();
    const lowerSource = source?.toLowerCase() || '';

    // SES errors
    if (
      lowerMessage.includes('ses') ||
      lowerMessage.includes('lockdown') ||
      lowerSource.includes('lockdown-install.js') ||
      lowerMessage.includes('ses_uncaught_exception')
    ) {
      return 'ses';
    }

    // Lexical declaration errors
    if (
      lowerMessage.includes("can't access lexical declaration") ||
      lowerMessage.includes('before initialization') ||
      lowerMessage.includes('temporal dead zone')
    ) {
      return 'lexical';
    }

    // Network errors
    if (
      lowerMessage.includes('failed to fetch') ||
      lowerMessage.includes('network') ||
      lowerMessage.includes('connection')
    ) {
      return 'network';
    }

    return 'runtime';
  }

  /**
   * Generate a request ID for error tracking
   */
  private generateRequestId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<GlobalErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
let globalErrorHandlerInstance: GlobalErrorHandler | null = null;

export function initializeGlobalErrorHandler(
  config?: GlobalErrorHandlerConfig
): GlobalErrorHandler {
  if (!globalErrorHandlerInstance) {
    globalErrorHandlerInstance = new GlobalErrorHandler(config);
    globalErrorHandlerInstance.initialize();
  }
  return globalErrorHandlerInstance;
}

export function getGlobalErrorHandler(): GlobalErrorHandler | null {
  return globalErrorHandlerInstance;
}

