import { NextResponse } from 'next/server';
import { generateOpenApiSpec } from '@/lib/openapi/generate';

/**
 * GET /api/openapi.json
 * Returns the complete OpenAPI specification
 */
export async function GET() {
  try {
    const spec = generateOpenApiSpec();
    
    return NextResponse.json(spec, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to generate OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to generate OpenAPI specification' },
      { status: 500 }
    );
  }
}
