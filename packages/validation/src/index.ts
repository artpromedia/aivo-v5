/**
 * Request Validation Package for AIVO v5
 * 
 * Provides consistent API validation using Zod schemas with:
 * - Request body validation
 * - Query parameter validation
 * - Type-safe error responses
 * - Input sanitization
 */

import { z, ZodSchema, ZodError, ZodIssue } from 'zod';

// Re-export zod for convenience
export { z, ZodSchema, ZodError };

/**
 * Structured validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation result with success/failure states
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Format Zod errors into structured validation errors
 */
export function formatZodError(error: ZodError): ValidationError[] {
  return error.errors.map((err: ZodIssue) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Create a validator from a Zod schema
 * 
 * @example
 * ```typescript
 * const validator = createValidator(userSchema);
 * const result = validator.validate(data);
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export function createValidator<T>(schema: ZodSchema<T>) {
  return {
    /**
     * Validate data and return result object
     */
    validate: (data: unknown): ValidationResult<T> => {
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, errors: formatZodError(result.error) };
    },

    /**
     * Validate data and throw on failure
     */
    validateOrThrow: (data: unknown): T => {
      return schema.parse(data);
    },

    /**
     * Check if data is valid without returning data
     */
    isValid: (data: unknown): boolean => {
      return schema.safeParse(data).success;
    },
  };
}

/**
 * Standardized API error response format
 */
export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: ValidationError[];
  requestId?: string;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  code: string,
  details?: ValidationError[],
  requestId?: string
): ApiErrorResponse {
  return {
    error,
    code,
    ...(details && { details }),
    ...(requestId && { requestId }),
  };
}

// Export middleware (Next.js specific)
export * from './middleware';

// Export sanitization utilities
export * from './sanitize';
