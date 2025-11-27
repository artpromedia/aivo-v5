// Force dynamic to avoid static analysis of tfjs imports
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

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

    return NextResponse.json({
      success: true,
      result,
    })
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

    return NextResponse.json({
      success: true,
      metrics,
    })
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
