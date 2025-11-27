import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AgentManager } from '@aivo/brain-model'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
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
    const agentManager = AgentManager.getInstance()

    // Process the interaction
    const result = await agentManager.processLearningInteraction(
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
    const session = await getServerSession(authOptions)
    
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

    const agentManager = AgentManager.getInstance()
    const metrics = await agentManager.getAgentMetrics(learnerId)

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
