/**
 * Centralized error tracking utility
 * Tracks SES errors, lexical declaration errors, and runtime errors
 * Sends error reports to backend API endpoint with full context
 */

export type ErrorType = 'network' | 'ses' | 'lexical' | 'runtime' | 'unknown';

export interface ErrorReport {
  type: ErrorType;
  message: string;
  stack?: string;
  requestId?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  userId?: number;
  errorName?: string;
  source?: string;
  line?: number;
  column?: number;
}

interface ErrorTrackerConfig {
  enabled: boolean;
  endpoint: string;
  rateLimitMs: number;
  maxReportsPerMinute: number;
}

class ErrorTracker {
  private config: ErrorTrackerConfig;
  private reportQueue: ErrorReport[] = [];
  private reportTimestamps: number[] = [];
  private isReporting = false;

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      endpoint: '/api/errors/report',
      rateLimitMs: 60000, // 1 minute
      maxReportsPerMinute: 10,
    };
  }

  /**
   * Check if we should report this error (rate limiting)
   */
  private shouldReport(): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const now = Date.now();
    // Remove timestamps older than rate limit window
    this.reportTimestamps = this.reportTimestamps.filter(
      (timestamp) => now - timestamp < this.config.rateLimitMs
    );

    // Check if we've exceeded the rate limit
    if (this.reportTimestamps.length >= this.config.maxReportsPerMinute) {
      console.warn('[ErrorTracker] Rate limit exceeded, skipping error report');
      return false;
    }

    return true;
  }

  /**
   * Get user ID from localStorage if available
   */
  private getUserId(): number | undefined {
    try {
      const user = localStorage.getItem('edulearn_user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.id;
      }
    } catch (e) {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Detect error type from error message and source
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

    // Runtime errors (catch-all for other JavaScript errors)
    return 'runtime';
  }

  /**
   * Create error report from error information
   */
  private createErrorReport(
    error: Error | string,
    type?: ErrorType,
    requestId?: string,
    source?: string,
    line?: number,
    column?: number
  ): ErrorReport {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;
    const errorName = typeof error === 'string' ? undefined : error.name;

    const detectedType = type || this.detectErrorType(message, source);

    return {
      type: detectedType,
      message,
      stack,
      requestId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      userId: this.getUserId(),
      errorName,
      source,
      line,
      column,
    };
  }

  /**
   * Send error report to backend
   */
  private async sendReport(report: ErrorReport): Promise<void> {
    if (!this.shouldReport()) {
      return;
    }

    this.reportTimestamps.push(Date.now());

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('[ErrorTracker] Failed to send error report:', response.status);
      }
    } catch (error) {
      // Silently fail - don't create error loops
      console.warn('[ErrorTracker] Error sending report:', error);
    }
  }

  /**
   * Track an error
   */
  public track(
    error: Error | string,
    type?: ErrorType,
    requestId?: string,
    source?: string,
    line?: number,
    column?: number
  ): void {
    const report = this.createErrorReport(error, type, requestId, source, line, column);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorTracker]', report);
    }

    // Queue for reporting
    this.reportQueue.push(report);

    // Process queue if not already processing
    if (!this.isReporting) {
      this.processQueue();
    }
  }

  /**
   * Process the error report queue
   */
  private async processQueue(): Promise<void> {
    if (this.isReporting || this.reportQueue.length === 0) {
      return;
    }

    this.isReporting = true;

    while (this.reportQueue.length > 0) {
      const report = this.reportQueue.shift();
      if (report) {
        await this.sendReport(report);
        // Small delay between reports to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    this.isReporting = false;
  }

  /**
   * Enable or disable error tracking
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Get current error tracker instance
   */
  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private static instance: ErrorTracker;
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();

