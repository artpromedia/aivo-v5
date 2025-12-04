/**
 * OpenAPI/Swagger Configuration for AIVO API Gateway
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

// Version is read dynamically but with fallback
const API_VERSION = process.env.npm_package_version || '0.0.1';

export const swaggerOptions = {
  openapi: {
    openapi: '3.0.3',
    info: {
      title: 'AIVO API',
      description: `
AIVO - AI-powered personalized learning platform API.

## Overview
This API provides endpoints for:
- **Authentication** - User login, password reset, JWT management
- **Learners** - Learner profiles, brain profiles, progress tracking
- **Sessions** - Learning session management and activity tracking
- **Content** - Curriculum topics and content items
- **Assessments** - Baseline assessments and difficulty proposals
- **Analytics** - Tenant and learner analytics
- **GDPR** - Data export, deletion, and consent management
- **Subscriptions** - Stripe billing integration

## Authentication
Most endpoints require a Bearer JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

Obtain a token via the \`POST /auth/login\` endpoint.

## Rate Limiting
API requests are rate limited based on subscription tier:
- Free: 100 requests/minute
- Basic: 500 requests/minute
- Pro: 2000 requests/minute
- Enterprise: Custom limits
      `.trim(),
      version: API_VERSION,
      contact: {
        name: 'AIVO Support',
        email: 'support@aivo.app',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://api.aivo.app',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication and authorization' },
      { name: 'Learners', description: 'Learner management and profiles' },
      { name: 'Sessions', description: 'Learning session management' },
      { name: 'Content', description: 'Curriculum and content management' },
      { name: 'Assessments', description: 'Baseline assessments and difficulty proposals' },
      { name: 'Analytics', description: 'Analytics and reporting' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'GDPR', description: 'GDPR compliance - data export, deletion, consent' },
      { name: 'Subscriptions', description: 'Subscription and billing management' },
      { name: 'Admin', description: 'Platform administration' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http' as const,
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login',
        },
      },
    },
    security: [{ bearerAuth: [] as string[] }],
  },
};

export const swaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list' as const,
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai' as const,
    },
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
};

/**
 * Fastify plugin to register Swagger and Swagger UI
 */
export const swaggerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  try {
    // Register OpenAPI spec generator
    await fastify.register(swagger, swaggerOptions);

    // Register Swagger UI
    await fastify.register(swaggerUi, swaggerUiOptions);

    fastify.log.info('Swagger documentation registered at /docs');
  } catch (error) {
    fastify.log.warn('Failed to register Swagger documentation:', error);
  }
};

// Also export as default for simpler import
export default swaggerPlugin;
