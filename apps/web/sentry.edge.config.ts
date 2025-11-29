/**
 * Sentry Edge Runtime Configuration
 * 
 * This file configures Sentry for Edge Runtime (middleware, edge API routes).
 * Edge runtime has limited APIs, so configuration is more constrained.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
  
  // Performance Monitoring
  // Lower sample rate for edge to manage costs
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,
  
  // Filter events before sending
  beforeSend(event, hint) {
    // Remove PII from user context
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }
    
    // Scrub sensitive request data
    if (event.request?.cookies) {
      event.request.cookies = { filtered: '[Filtered]' };
    }
    
    // Scrub sensitive headers
    if (event.request?.headers) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-csrf-token'];
      for (const header of sensitiveHeaders) {
        if (event.request.headers[header]) {
          event.request.headers[header] = '[Filtered]';
        }
      }
    }
    
    // Don't send events in development
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }
    
    return event;
  },
});
