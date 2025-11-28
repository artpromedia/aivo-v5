/**
 * Input Sanitization Utilities for AIVO v5
 * 
 * Provides string sanitization to prevent XSS and injection attacks
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

/**
 * Sanitize HTML content, allowing only safe tags
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize rich text content (for learner responses, etc.)
 */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'b', 'i', 'u', 's',
      'blockquote', 'pre', 'code',
      'a', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text string (remove potential HTML/scripts)
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize for safe display (escape HTML entities)
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Remove all HTML tags from string
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .slice(0, 255); // Limit length
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    // If URL parsing fails, check if it's a relative URL
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    return null;
  }
}

// ============================================
// Zod Transformers for Schema Validation
// ============================================

/**
 * Zod transformer for sanitized plain text strings
 */
export const sanitizedString = z.string().transform(sanitizeString);

/**
 * Zod transformer for sanitized HTML content
 */
export const sanitizedHtml = z.string().transform(sanitizeHtml);

/**
 * Zod transformer for sanitized rich text
 */
export const sanitizedRichText = z.string().transform(sanitizeRichText);

/**
 * Zod transformer for sanitized filenames
 */
export const sanitizedFilename = z.string().transform(sanitizeFilename);

/**
 * Zod transformer for sanitized URLs
 */
export const sanitizedUrl = z.string().transform((val) => {
  const sanitized = sanitizeUrl(val);
  if (sanitized === null) {
    throw new Error('Invalid URL');
  }
  return sanitized;
});

/**
 * Zod schema for trimmed, non-empty strings
 */
export const nonEmptyString = z.string().trim().min(1);

/**
 * Zod schema for email with lowercase transformation
 */
export const emailSchema = z.string().email().toLowerCase().trim();

/**
 * Zod schema for optional string that transforms empty to undefined
 */
export const optionalString = z
  .string()
  .optional()
  .transform((val) => (val === '' ? undefined : val));
