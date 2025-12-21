export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: number;
  path?: string;
  method?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    const requestId = context?.requestId ? `[${context.requestId}]` : '';
    const userId = context?.userId ? `[user:${context.userId}]` : '';
    const path = context?.path ? `[${context.method || 'GET'} ${context.path}]` : '';
    
    const contextStr = Object.entries(context || {})
      .filter(([key]) => !['requestId', 'userId', 'path', 'method'].includes(key))
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(' ');

    const parts = [
      timestamp,
      levelUpper,
      requestId,
      userId,
      path,
      message,
      contextStr && `| ${contextStr}`
    ].filter(Boolean);

    return parts.join(' ');
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error?.message || String(error),
        stack: error?.stack,
        code: error?.code,
        statusCode: error?.statusCode || error?.status,
      };
      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  request(method: string, path: string, statusCode: number, duration: number, requestId?: string): void {
    this.info(`${method} ${path} ${statusCode}`, {
      requestId,
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
    });
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export const logger = new Logger();

