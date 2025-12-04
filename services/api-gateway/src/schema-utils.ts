/**
 * Zod to JSON Schema Converter Utilities
 * Converts Zod schemas to JSON Schema for OpenAPI documentation
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodTypeAny } from 'zod';
import type { FastifySchema } from 'fastify';

/**
 * Convert a Zod schema to JSON Schema format compatible with Fastify/OpenAPI
 */
export function zodToFastifySchema(schema: ZodTypeAny): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(schema, {
    $refStrategy: 'none',
    target: 'openApi3',
  });

  // Remove $schema property as it's not needed for OpenAPI
  const { $schema: _schema, ...rest } = jsonSchema as Record<string, unknown>;
  return rest;
}

/**
 * Create a complete Fastify route schema from Zod schemas
 */
export function createRouteSchema(options: {
  description?: string;
  summary?: string;
  tags?: string[];
  security?: Array<Record<string, string[]>>;
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  querystring?: ZodTypeAny;
  headers?: ZodTypeAny;
  response?: {
    [statusCode: number]: ZodTypeAny | { description: string; schema?: ZodTypeAny };
  };
}): FastifySchema {
  const schema: FastifySchema & {
    description?: string;
    summary?: string;
    tags?: string[];
    security?: Array<Record<string, string[]>>;
  } = {};

  if (options.description) schema.description = options.description;
  if (options.summary) schema.summary = options.summary;
  if (options.tags) schema.tags = options.tags;
  if (options.security) schema.security = options.security;

  if (options.body) {
    schema.body = zodToFastifySchema(options.body);
  }

  if (options.params) {
    schema.params = zodToFastifySchema(options.params);
  }

  if (options.querystring) {
    schema.querystring = zodToFastifySchema(options.querystring);
  }

  if (options.headers) {
    schema.headers = zodToFastifySchema(options.headers);
  }

  if (options.response) {
    const responseSchema: Record<number | string, unknown> = {};
    for (const [statusCode, value] of Object.entries(options.response)) {
      if (typeof value === 'object' && value !== null && 'description' in value) {
        const typedValue = value as { description: string; schema?: ZodTypeAny };
        responseSchema[statusCode] = {
          description: typedValue.description,
          ...(typedValue.schema ? zodToFastifySchema(typedValue.schema) : {}),
        };
      } else {
        responseSchema[statusCode] = zodToFastifySchema(value as ZodTypeAny);
      }
    }
    schema.response = responseSchema;
  }

  return schema;
}

/**
 * Schema builder helper for common patterns
 */
export const schemaBuilder = {
  /**
   * Create a paginated response schema
   */
  paginatedResponse<T extends ZodTypeAny>(itemSchema: T, itemName: string) {
    return {
      type: 'object',
      properties: {
        [itemName]: {
          type: 'array',
          items: zodToFastifySchema(itemSchema),
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    };
  },

  /**
   * Create an error response schema
   */
  errorResponse(statusCode: number, description: string) {
    return {
      [statusCode]: {
        description,
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          details: { type: 'object' },
        },
        required: ['error'],
      },
    };
  },

  /**
   * Standard 401 Unauthorized response
   */
  unauthorized() {
    return this.errorResponse(401, 'Unauthorized - Invalid or missing JWT token');
  },

  /**
   * Standard 403 Forbidden response
   */
  forbidden() {
    return this.errorResponse(403, 'Forbidden - Insufficient permissions');
  },

  /**
   * Standard 404 Not Found response
   */
  notFound(resource = 'Resource') {
    return this.errorResponse(404, `${resource} not found`);
  },

  /**
   * Standard 422 Validation Error response
   */
  validationError() {
    return this.errorResponse(422, 'Validation error - Invalid request data');
  },

  /**
   * Standard 500 Internal Server Error response
   */
  internalError() {
    return this.errorResponse(500, 'Internal server error');
  },
};
