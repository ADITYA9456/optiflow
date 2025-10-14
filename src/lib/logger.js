// Structured logging utility with request IDs and levels
import { randomUUID } from 'crypto';

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  generateRequestId() {
    return randomUUID();
  }

  formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    // Redact sensitive fields
    if (logEntry.password) logEntry.password = '[REDACTED]';
    if (logEntry.adminSecret) logEntry.adminSecret = `***${logEntry.adminSecret?.slice(-4) || ''}`;
    if (logEntry.token) logEntry.token = `***${logEntry.token?.slice(-8) || ''}`;
    if (logEntry.apiKey) logEntry.apiKey = `***${logEntry.apiKey?.slice(-8) || ''}`;

    return logEntry;
  }

  error(message, meta = {}) {
    const logEntry = this.formatLog(LOG_LEVELS.ERROR, message, meta);
    console.error(JSON.stringify(logEntry));
    return logEntry;
  }

  warn(message, meta = {}) {
    const logEntry = this.formatLog(LOG_LEVELS.WARN, message, meta);
    console.warn(JSON.stringify(logEntry));
    return logEntry;
  }

  info(message, meta = {}) {
    const logEntry = this.formatLog(LOG_LEVELS.INFO, message, meta);
    console.info(JSON.stringify(logEntry));
    return logEntry;
  }

  debug(message, meta = {}) {
    if (!this.isProduction) {
      const logEntry = this.formatLog(LOG_LEVELS.DEBUG, message, meta);
      console.debug(JSON.stringify(logEntry));
      return logEntry;
    }
  }

  // API handler wrapper with duration tracking
  async wrapHandler(handlerName, handler, request, ...args) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.info(`${handlerName} - Request started`, { requestId });

    try {
      const response = await handler(request, ...args);
      const duration = Date.now() - startTime;
      
      this.info(`${handlerName} - Request completed`, {
        requestId,
        duration: `${duration}ms`,
        status: response.status
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`${handlerName} - Request failed`, {
        requestId,
        duration: `${duration}ms`,
        error: error.message,
        stack: this.isProduction ? undefined : error.stack
      });

      throw error;
    }
  }
}

// Singleton instance
const logger = new Logger();
export default logger;
