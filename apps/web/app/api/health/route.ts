import { NextResponse } from 'next/server';

/**
 * Health check endpoint
 * Used by load balancers and monitoring systems
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  });
}
