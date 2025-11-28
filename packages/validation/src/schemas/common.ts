/**
 * Common Validation Schemas for AIVO v5
 * 
 * Reusable schemas for common field types
 */

import { z } from 'zod';

// ============================================
// ID Schemas
// ============================================

/** CUID identifier */
export const idSchema = z.string().cuid();

/** UUID identifier */
export const uuidSchema = z.string().uuid();

/** Generic string ID (for external IDs) */
export const stringIdSchema = z.string().min(1).max(255);

// ============================================
// User Field Schemas
// ============================================

/** Email address */
export const emailSchema = z.string().email().toLowerCase().trim();

/** Password with security requirements */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/** Username */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    'Username can only contain letters, numbers, dots, underscores, and hyphens'
  );

/** Display name */
export const displayNameSchema = z.string().min(1).max(100).trim();

/** Phone number (basic validation) */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

// ============================================
// Pagination Schemas
// ============================================

/** Pagination parameters */
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/** Cursor-based pagination */
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;

// ============================================
// Date Schemas
// ============================================

/** Date string (ISO 8601) */
export const dateStringSchema = z.string().datetime();

/** Coercible date (string or Date object) */
export const coerceDateSchema = z.coerce.date();

/** Date range with validation */
export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
    { message: 'startDate must be before or equal to endDate' }
  );

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

// ============================================
// Sort Schemas
// ============================================

/** Sort direction */
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

/** Generic sort parameters */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: sortOrderSchema,
});

export type SortInput = z.infer<typeof sortSchema>;

// ============================================
// Search Schemas
// ============================================

/** Search query */
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(500).optional(),
  ...paginationSchema.shape,
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

// ============================================
// Educational Domain Schemas
// ============================================

/** Grade level (K-12, with K=0) */
export const gradeLevelSchema = z.coerce.number().int().min(0).max(12);

/** Subject area */
export const subjectSchema = z.enum([
  'MATH',
  'READING',
  'WRITING',
  'SCIENCE',
  'SOCIAL_STUDIES',
  'ART',
  'MUSIC',
  'PHYSICAL_EDUCATION',
  'FOREIGN_LANGUAGE',
  'OTHER',
]);

/** Difficulty level */
export const difficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD', 'ADAPTIVE']);

/** Learning style */
export const learningStyleSchema = z.enum([
  'VISUAL',
  'AUDITORY',
  'KINESTHETIC',
  'READING_WRITING',
]);

export type Subject = z.infer<typeof subjectSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type LearningStyle = z.infer<typeof learningStyleSchema>;

// ============================================
// Utility Schemas
// ============================================

/** Boolean from string (for query params) */
export const booleanStringSchema = z
  .enum(['true', 'false', '1', '0'])
  .transform((val) => val === 'true' || val === '1');

/** Positive integer */
export const positiveIntSchema = z.coerce.number().int().positive();

/** Non-negative integer */
export const nonNegativeIntSchema = z.coerce.number().int().nonnegative();

/** Percentage (0-100) */
export const percentageSchema = z.coerce.number().min(0).max(100);

/** JSON string that parses to object */
export const jsonStringSchema = z.string().transform((val, ctx) => {
  try {
    return JSON.parse(val);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid JSON string',
    });
    return z.NEVER;
  }
});
