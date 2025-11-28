import pino, { Logger as PinoLogger } from 'pino';

/**
 * Structured Logging Package for AIVO v5
 * 
 * Provides consistent logging across all services with:
 * - Log levels (debug, info, warn, error)
 * - Request context (requestId, userId, etc.)
 * - Sensitive data redaction
 * - Log aggregation support
 */

export interface LogContext {
  requestId?: string;
  userId?: string;
  learnerId?: string;
  sessionId?: string;
  tenantId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error | null, context?: LogContext): void;
  child(context: LogContext): Logger;
}

// Determine log level from environment
const getLogLevel = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
  }
  return 'info';
};

// Create base pino logger for server-side
const createPinoLogger = (): PinoLogger => {
  const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
  
  return pino({
    level: getLogLevel(),
    formatters: {
      level: (label) => ({ level: label }),
      bindings: (bindings) => ({
        pid: bindings.pid,
        host: bindings.hostname,
        service: process.env?.SERVICE_NAME || 'aivo',
        environment: process.env?.NODE_ENV || 'development',
      }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'password',
        'token',
        'apiKey',
        'secret',
        'authorization',
        'cookie',
        '*.password',
        '*.token',
        '*.apiKey',
        '*.secret',
        'headers.authorization',
        'headers.cookie',
      ],
      censor: '[REDACTED]',
    },
    // Use pino-pretty in development
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  });
};

let baseLogger: PinoLogger | null = null;

const getBaseLogger = (): PinoLogger => {
  if (!baseLogger) {
    baseLogger = createPinoLogger();
  }
  return baseLogger;
};

/**
 * Create a server-side logger with pino
 */
export function createLogger(name: string): Logger {
  const pinoLogger = getBaseLogger().child({ module: name });

  const wrapLogger = (logger: PinoLogger): Logger => ({
    debug: (message: string, context?: LogContext) => {
      logger.debug(context || {}, message);
    },
    info: (message: string, context?: LogContext) => {
      logger.info(context || {}, message);
    },
    warn: (message: string, context?: LogContext) => {
      logger.warn(context || {}, message);
    },
    error: (message: string, error?: Error | null, context?: LogContext) => {
      logger.error(
        {
          ...context,
          error: error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : undefined,
        },
        message
      );
    },
    child: (ctx: LogContext): Logger => {
      return wrapLogger(logger.child(ctx));
    },
  });

  return wrapLogger(pinoLogger);
}

/**
 * Browser-safe logger for client-side code
 * Falls back to console methods with structured output
 */
export function createClientLogger(name: string): Logger {
  const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  const prefix = `[${name}]`;

  const formatMessage = (message: string, context?: LogContext): string => {
    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(context)}`;
    }
    return `${prefix} ${message}`;
  };

  const logger: Logger = {
    debug: (message: string, context?: LogContext) => {
      if (isDev) {
        console.debug(formatMessage(message, context));
      }
    },
    info: (message: string, context?: LogContext) => {
      console.info(formatMessage(message, context));
    },
    warn: (message: string, context?: LogContext) => {
      console.warn(formatMessage(message, context));
    },
    error: (message: string, error?: Error | null, context?: LogContext) => {
      console.error(formatMessage(message, context), error);

      // Send to Sentry if available
      if (typeof window !== 'undefined') {
        const Sentry = (window as any).Sentry;
        if (Sentry && error) {
          Sentry.captureException(error, {
            extra: { ...context, message },
          });
        }
      }
    },
    child: (ctx: LogContext): Logger => {
      // Client logger child just adds context to prefix
      return createClientLogger(`${name}:${ctx.module || 'child'}`);
    },
  };

  return logger;
}

/**
 * Auto-detect environment and create appropriate logger
 */
export function createAutoLogger(name: string): Logger {
  const isServer = typeof window === 'undefined';
  return isServer ? createLogger(name) : createClientLogger(name);
}

// Default logger instance
export const logger = createAutoLogger('aivo');

// Export log levels for configuration
export const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

// Re-export pino for advanced usage
export { pino };
