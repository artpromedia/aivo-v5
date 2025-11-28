/**
 * Sentry Client-Side Configuration
 * 
 * This file configures Sentry for client-side error tracking in the browser.
 * It includes Replay integration for session recording on errors.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
  
  // Performance Monitoring
  // Reduce sample rate in production to control costs
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay Configuration
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% when errors occur
  
  integrations: [
    Sentry.replayIntegration({
      // Privacy settings for educational platform
      maskAllText: true,
      blockAllMedia: true,
      // Additional privacy for student data
      maskAllInputs: true,
    }),
    Sentry.browserTracingIntegration(),
  ],
  
  // Filter and sanitize events before sending
  beforeSend(event, hint) {
    // Scrub sensitive data from requests
    if (event.request?.cookies) {
      event.request.cookies = '[Filtered]';
    }
    
    // Scrub sensitive headers
    if (event.request?.headers) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-csrf-token', 'x-api-key'];
      for (const header of sensitiveHeaders) {
        if (event.request.headers[header]) {
          event.request.headers[header] = '[Filtered]';
        }
      }
    }
    
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }
    
    return event;
  },
  
  // Filter transactions (performance monitoring)
  beforeSendTransaction(event) {
    // Don't track health check endpoints
    if (event.transaction?.includes('/api/health') || event.transaction?.includes('/api/ready')) {
      return null;
    }
    return event;
  },
  
  // Ignore common non-critical errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.telegramPlata.com/telenotif498',
    
    // Facebook borance
    'fb_xd_fragment',
    
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    
    // Safari extensions
    /safari-extension:/i,
    
    // Network errors
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'NetworkError',
    
    // AbortController
    'AbortError',
    
    // ResizeObserver
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],
  
  // Only capture errors from our domain
  allowUrls: [
    /https?:\/\/(.+\.)?aivo\.(io|app|dev)/,
    /localhost/,
  ],
});
