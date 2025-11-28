// Force dynamic to avoid static analysis of tfjs imports
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { applyRateLimit, addRateLimitHeaders } from '@/lib/middleware/rate-limit'

// Dynamic import to avoid bundling tfjs-node at build time  
let agentManager: any = null;
async function getAgentManager() {
  if (!agentManager) {
    const { AgentManager } = await import('@aivo/brain-model');
    agentManager = AgentManager.getInstance();
  }
  return agentManager;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Apply rate limiting (AI tier: 20 requests per minute per user)
    const { response: rateLimitResponse, result: rateLimitResult } = await applyRateLimit(
      req,
      { tier: 'ai', userId: session.user.id }
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse request body
    const body = await req.json()
    const { learnerId, interaction } = body

    if (!learnerId || !interaction) {
      return NextResponse.json(
        { error: 'Missing required fields: learnerId, interaction' },
        { status: 400 }
      )
    }

    // Get agent manager instance
    const manager = await getAgentManager()

    // Process the interaction
    const result = await manager.processLearningInteraction(
      learnerId,
      interaction
    )

    const response = NextResponse.json({
      success: true,
      result,
    })
    
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Agent interaction error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Get agent metrics for a learner
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Apply rate limiting (general tier for GET requests)
    const { response: rateLimitResponse, result: rateLimitResult } = await applyRateLimit(
      req,
      { tier: 'general', userId: session.user.id }
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(req.url)
    const learnerId = searchParams.get('learnerId')

    if (!learnerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: learnerId' },
        { status: 400 }
      )
    }

    const manager = await getAgentManager()
    const metrics = await manager.getAgentMetrics(learnerId)

    const response = NextResponse.json({
      success: true,
      metrics,
    })
    
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Get metrics error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
