/**
 * Production log transports for AIVO v5
 * 
 * Configure log destinations for production environments:
 * - Console output with pino-pretty
 * - Datadog integration
 * - Custom HTTP transport
 */

import pino from 'pino';

export interface TransportConfig {
  datadog?: {
    apiKey: string;
    service?: string;
    source?: string;
    hostname?: string;
  };
  http?: {
    url: string;
    headers?: Record<string, string>;
  };
}

/**
 * Create production transport configuration
 */
export function createProductionTransport(config?: TransportConfig) {
  const targets: pino.TransportTargetOptions[] = [
    // Always output to console in structured JSON
    {
      target: 'pino/file',
      options: { destination: 1 }, // stdout
      level: 'info',
    },
  ];

  // Add Datadog transport if configured
  if (config?.datadog?.apiKey) {
    targets.push({
      target: 'pino-datadog-transport',
      options: {
        apiKey: config.datadog.apiKey,
        service: config.datadog.service || 'aivo',
        source: config.datadog.source || 'nodejs',
        hostname: config.datadog.hostname,
      },
      level: 'info',
    });
  }

  // Add custom HTTP transport if configured
  if (config?.http?.url) {
    targets.push({
      target: 'pino-http-send',
      options: {
        url: config.http.url,
        headers: config.http.headers || {},
      },
      level: 'info',
    });
  }

  return pino.transport({ targets });
}

/**
 * Create development transport with pretty printing
 */
export function createDevelopmentTransport() {
  return pino.transport({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  });
}

/**
 * Get transport based on environment
 */
export function getTransport(config?: TransportConfig) {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    return createDevelopmentTransport();
  }
  
  return createProductionTransport(config);
}
