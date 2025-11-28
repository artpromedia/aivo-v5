/**
 * CSRF Token API Route
 * 
 * GET - Generate and return a new CSRF token
 * 
 * This endpoint:
 * - Generates a new CSRF token
 * - Sets it in a cookie (readable by JavaScript for double-submit)
 * - Returns the token in the response body (for SPA usage)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_TOKEN_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

/**
 * Generate a CSRF token using HMAC-SHA256
 */
function generateCSRFToken(): string {
  const secret = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'csrf-secret-key';
  const timestamp = Date.now();
  const payload = `${timestamp}:${Math.random().toString(36).substring(2)}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}:${signature}`;
}

export async function GET() {
  const token = generateCSRFToken();

  // Create response with token
  const response = NextResponse.json({
    token,
    expiresIn: CSRF_TOKEN_MAX_AGE,
  });

  // Set cookie (httpOnly: false so JavaScript can read it for double-submit)
  const isProduction = process.env.NODE_ENV === 'production';
  
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_TOKEN_MAX_AGE,
  });

  return response;
}

/**
 * HEAD request to check if CSRF token exists
 */
export async function HEAD(request: NextRequest) {
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  
  if (existingToken) {
    return new NextResponse(null, { status: 200 });
  }
  
  return new NextResponse(null, { status: 404 });
}
