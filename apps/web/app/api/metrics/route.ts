import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Metrics endpoint for Prometheus scraping
 * 
 * Protected by bearer token to prevent public access
 * 
 * Usage:
 *   curl -H "Authorization: Bearer $METRICS_TOKEN" https://aivo.education/api/metrics
 */
export async function GET(request: NextRequest) {
  // Validate metrics token
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.METRICS_TOKEN;

  // In development, allow access without token
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment && expectedToken) {
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    // Dynamically import to avoid issues in edge runtime
    const { getMetrics, getMetricsContentType } = await import('@aivo/metrics');

    const metrics = await getMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': getMetricsContentType(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to collect metrics:', error);

    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}
