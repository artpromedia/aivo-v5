/**
 * Sentry Server-Side Configuration
 * 
 * This file configures Sentry for server-side error tracking in Node.js.
 * It includes additional integrations for database and HTTP tracking.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
  
  // Performance Monitoring
  // Lower sample rate on server to manage volume
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Integrations
  integrations: [
    // Prisma integration for database query tracking
    Sentry.prismaIntegration(),
  ],
  
  // Filter and sanitize events before sending
  beforeSend(event, hint) {
    // Remove PII from user context
    if (event.user) {
      // Keep only non-PII identifiers
      const sanitizedUser: Sentry.User = {
        id: event.user.id,
      };
      
      // Preserve role and tenant for debugging
      if ((event.user as any).role) {
        (sanitizedUser as any).role = (event.user as any).role;
      }
      if ((event.user as any).tenantId) {
        (sanitizedUser as any).tenantId = (event.user as any).tenantId;
      }
      
      // Remove sensitive fields
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
      
      event.user = sanitizedUser;
    }
    
    // Scrub sensitive request data
    if (event.request) {
      // Remove cookies
      if (event.request.cookies) {
        event.request.cookies = '[Filtered]';
      }
      
      // Scrub authorization headers
      if (event.request.headers) {
        const sensitiveHeaders = [
          'authorization',
          'cookie',
          'x-csrf-token',
          'x-api-key',
          'x-internal-api-key',
        ];
        for (const header of sensitiveHeaders) {
          if (event.request.headers[header]) {
            event.request.headers[header] = '[Filtered]';
          }
        }
      }
      
      // Scrub sensitive query params
      if (event.request.query_string) {
        const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
        for (const param of sensitiveParams) {
          const regex = new RegExp(`(${param}=)[^&]+`, 'gi');
          event.request.query_string = event.request.query_string.replace(regex, `$1[Filtered]`);
        }
      }
    }
    
    // Scrub sensitive data from extras
    if (event.extra) {
      const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'auth'];
      for (const key of Object.keys(event.extra)) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
          event.extra[key] = '[Filtered]';
        }
      }
    }
    
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }
    
    return event;
  },
  
  // Filter transactions
  beforeSendTransaction(event) {
    // Don't track health checks or internal endpoints
    const ignoredTransactions = ['/api/health', '/api/ready', '/api/metrics', '/_next/'];
    
    if (event.transaction && ignoredTransactions.some(t => event.transaction!.includes(t))) {
      return null;
    }
    
    return event;
  },
});
