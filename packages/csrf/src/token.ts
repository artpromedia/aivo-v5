/**
 * CSRF Token Generation and Validation
 * 
 * Uses HMAC-SHA256 for secure token generation and validation.
 */

import { createHmac, randomBytes } from 'crypto';
import type { CSRFTokenPayload, CSRFValidationResult } from './types';
import { CSRF_DEFAULTS, TOKEN_EXPIRATION_MS, CSRF_ERRORS } from './constants';

/**
 * Generate a random nonce
 */
function generateNonce(length: number = CSRF_DEFAULTS.tokenLength): string {
  return randomBytes(length).toString('hex');
}

/**
 * Create HMAC signature for token payload
 */
function createSignature(payload: CSRFTokenPayload, secret: string): string {
  const data = `${payload.sessionId}:${payload.timestamp}:${payload.nonce}`;
  return createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Generate a CSRF token
 * 
 * Token format: base64(JSON({ sessionId, timestamp, nonce, signature }))
 * 
 * @param sessionId - The session identifier (user ID or session ID)
 * @param secret - The secret key for signing
 * @param tokenLength - Length of the random nonce (default: 32)
 * @returns The generated CSRF token
 */
export function generateCSRFToken(
  sessionId: string,
  secret: string,
  tokenLength: number = CSRF_DEFAULTS.tokenLength
): string {
  if (!secret) {
    throw new Error(CSRF_ERRORS.MISSING_SECRET);
  }

  const payload: CSRFTokenPayload = {
    sessionId,
    timestamp: Date.now(),
    nonce: generateNonce(tokenLength),
  };

  const signature = createSignature(payload, secret);

  const tokenData = {
    ...payload,
    signature,
  };

  // Encode as base64 for safe transport
  return Buffer.from(JSON.stringify(tokenData)).toString('base64url');
}

/**
 * Parse a CSRF token
 * 
 * @param token - The CSRF token to parse
 * @returns The parsed token payload and signature, or null if invalid
 */
export function parseCSRFToken(
  token: string
): (CSRFTokenPayload & { signature: string }) | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded);

    // Validate structure
    if (
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.timestamp !== 'number' ||
      typeof parsed.nonce !== 'string' ||
      typeof parsed.signature !== 'string'
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Validate a CSRF token
 * 
 * @param token - The CSRF token to validate
 * @param sessionId - The expected session identifier
 * @param secret - The secret key for verification
 * @param maxAge - Maximum token age in milliseconds (default: 24 hours)
 * @returns Validation result
 */
export function validateCSRFToken(
  token: string | null | undefined,
  sessionId: string,
  secret: string,
  maxAge: number = TOKEN_EXPIRATION_MS
): CSRFValidationResult {
  // Check if token exists
  if (!token) {
    return {
      valid: false,
      error: CSRF_ERRORS.MISSING_TOKEN,
      code: 'MISSING_TOKEN',
    };
  }

  // Parse token
  const parsed = parseCSRFToken(token);
  if (!parsed) {
    return {
      valid: false,
      error: CSRF_ERRORS.INVALID_TOKEN,
      code: 'INVALID_TOKEN',
    };
  }

  // Verify session ID matches
  if (parsed.sessionId !== sessionId) {
    return {
      valid: false,
      error: CSRF_ERRORS.INVALID_SESSION,
      code: 'INVALID_SESSION',
    };
  }

  // Check expiration
  const age = Date.now() - parsed.timestamp;
  if (age > maxAge) {
    return {
      valid: false,
      error: CSRF_ERRORS.EXPIRED_TOKEN,
      code: 'EXPIRED_TOKEN',
    };
  }

  // Verify signature
  const expectedSignature = createSignature(
    {
      sessionId: parsed.sessionId,
      timestamp: parsed.timestamp,
      nonce: parsed.nonce,
    },
    secret
  );

  // Use timing-safe comparison
  if (!timingSafeEqual(parsed.signature, expectedSignature)) {
    return {
      valid: false,
      error: CSRF_ERRORS.INVALID_TOKEN,
      code: 'INVALID_TOKEN',
    };
  }

  return { valid: true };
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Create a double-submit cookie token
 * 
 * This is a simpler approach where the same token is stored
 * in both a cookie and sent in the request header.
 * 
 * @param secret - The secret key
 * @returns A random token
 */
export function generateDoubleSubmitToken(secret: string): string {
  const nonce = generateNonce();
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', secret)
    .update(`${nonce}:${timestamp}`)
    .digest('hex');
  
  return `${nonce}.${timestamp}.${signature}`;
}

/**
 * Validate a double-submit token
 * 
 * @param cookieToken - Token from cookie
 * @param headerToken - Token from header
 * @param secret - The secret key
 * @returns Whether the tokens match and are valid
 */
export function validateDoubleSubmitToken(
  cookieToken: string | null | undefined,
  headerToken: string | null | undefined,
  secret: string
): CSRFValidationResult {
  if (!cookieToken || !headerToken) {
    return {
      valid: false,
      error: CSRF_ERRORS.MISSING_TOKEN,
      code: 'MISSING_TOKEN',
    };
  }

  // Tokens must match
  if (cookieToken !== headerToken) {
    return {
      valid: false,
      error: CSRF_ERRORS.INVALID_TOKEN,
      code: 'INVALID_TOKEN',
    };
  }

  // Parse and validate token
  const parts = cookieToken.split('.');
  if (parts.length !== 3) {
    return {
      valid: false,
      error: CSRF_ERRORS.INVALID_TOKEN,
      code: 'INVALID_TOKEN',
    };
  }

  const [nonce, timestamp, signature] = parts;

  // Verify signature
  const expectedSignature = createHmac('sha256', secret)
    .update(`${nonce}:${timestamp}`)
    .digest('hex');

  if (!timingSafeEqual(signature, expectedSignature)) {
    return {
      valid: false,
      error: CSRF_ERRORS.INVALID_TOKEN,
      code: 'INVALID_TOKEN',
    };
  }

  // Check expiration
  const age = Date.now() - parseInt(timestamp, 10);
  if (age > TOKEN_EXPIRATION_MS) {
    return {
      valid: false,
      error: CSRF_ERRORS.EXPIRED_TOKEN,
      code: 'EXPIRED_TOKEN',
    };
  }

  return { valid: true };
}
