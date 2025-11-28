import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI capabilities
extendZodWithOpenApi(z);

// Create the registry for all API endpoints
export const registry = new OpenAPIRegistry();

// OpenAPI document configuration
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'AIVO Platform API',
    version: '1.0.0',
    description: `
# AIVO Educational Platform API

The AIVO API provides access to the educational platform's features including:

- **Homework Helper**: AI-assisted homework support with scaffolded hints
- **Assessments**: Baseline and adaptive learning assessments
- **Self-Regulation**: Emotion tracking and regulation strategies
- **Sensory Profiles**: Personalized sensory accommodations
- **Learning Analytics**: Progress tracking and insights

## Authentication

All API endpoints require authentication using either:
- **Bearer Token**: JWT token in the Authorization header
- **Session Cookie**: NextAuth session cookie

## Rate Limiting

API requests are rate-limited to protect service availability:
- Standard endpoints: 100 requests per minute
- AI endpoints: 20 requests per minute

## Pagination

List endpoints support pagination using \`limit\` and \`offset\` query parameters.
    `,
    contact: {
      name: 'AIVO Support',
      email: 'support@aivo.education',
      url: 'https://aivo.education/support',
    },
    license: {
      name: 'Proprietary',
      url: 'https://aivo.education/terms',
    },
  },
  externalDocs: {
    description: 'AIVO Developer Documentation',
    url: 'https://docs.aivo.education',
  },
  servers: [
    {
      url: 'https://api.aivo.education',
      description: 'Production',
    },
    {
      url: 'https://staging-api.aivo.education',
      description: 'Staging',
    },
    {
      url: 'http://localhost:3000',
      description: 'Development',
    },
  ],
  tags: [
    { 
      name: 'Authentication', 
      description: 'User authentication and session management',
    },
    { 
      name: 'Learners', 
      description: 'Learner profile and progress management',
    },
    { 
      name: 'Homework', 
      description: 'AI-assisted homework help sessions',
    },
    { 
      name: 'Assessment', 
      description: 'Baseline and adaptive learning assessments',
    },
    { 
      name: 'Regulation', 
      description: 'Self-regulation and emotion tracking',
    },
    { 
      name: 'Sensory', 
      description: 'Sensory profile and accommodation management',
    },
    { 
      name: 'AI', 
      description: 'AI agent interactions and responses',
    },
    { 
      name: 'Analytics', 
      description: 'Learning analytics, reports, and insights',
    },
    {
      name: 'Health',
      description: 'Service health and readiness endpoints',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from authentication',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'NextAuth session cookie',
      },
    },
  },
  security: [
    { bearerAuth: [] },
    { cookieAuth: [] },
  ],
};

// Common response schemas
export const ErrorResponseSchema = z.object({
  error: z.string().openapi({ description: 'Error message', example: 'Validation failed' }),
  code: z.string().openapi({ description: 'Error code', example: 'VALIDATION_ERROR' }),
  details: z.array(z.object({
    field: z.string().openapi({ description: 'Field name', example: 'email' }),
    message: z.string().openapi({ description: 'Error detail', example: 'Invalid email format' }),
  })).optional().openapi({ description: 'Detailed validation errors' }),
});

export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20).openapi({ 
    description: 'Number of items per page', 
    example: 20 
  }),
  offset: z.coerce.number().min(0).default(0).openapi({ 
    description: 'Number of items to skip', 
    example: 0 
  }),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().openapi({ description: 'Total number of items', example: 100 }),
    limit: z.number().openapi({ description: 'Items per page', example: 20 }),
    offset: z.number().openapi({ description: 'Current offset', example: 0 }),
    hasMore: z.boolean().openapi({ description: 'Whether more items exist', example: true }),
  });

// Register common schemas
registry.register('ErrorResponse', ErrorResponseSchema);
registry.register('Pagination', PaginationSchema);

// Re-export z with OpenAPI extensions
export { z };
