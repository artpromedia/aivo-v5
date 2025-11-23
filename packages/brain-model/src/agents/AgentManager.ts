import { prisma } from '@aivo/persistence'
import { PersonalizedLearningAgent } from './implementations/PersonalizedLearningAgent'
import { AITutorAgent } from './implementations/AITutorAgent'
import { ContentAdaptationAgent } from './implementations/ContentAdaptationAgent'
import { AgentOrchestrator } from './base/AgentOrchestrator'

export interface AgentConfig {
  learnerId: string
  modelConfig: {
    provider: string
    modelName: string
    temperature?: number
    maxTokens?: number
  }
  memoryConfig: {
    maxShortTermItems: number
    maxLongTermItems: number
    consolidationThreshold: number
  }
  coordinationConfig: {
    allowInterAgentComm: boolean
    broadcastEvents: boolean
    coordinationStrategy: string
  }
}

export class AgentManager {
  private static instance: AgentManager
  private orchestrator: AgentOrchestrator
  private agents: Map<string, any>
  private learnerAgents: Map<string, {
    learningAgent: PersonalizedLearningAgent
    tutorAgent: AITutorAgent
    contentAgent: ContentAdaptationAgent
  }>

  private constructor() {
    this.orchestrator = new AgentOrchestrator()
    this.agents = new Map()
    this.learnerAgents = new Map()
  }

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager()
    }
    return AgentManager.instance
  }

  async initializeAgentsForLearner(learnerId: string) {
    // Check if agents already exist
    if (this.learnerAgents.has(learnerId)) {
      return this.learnerAgents.get(learnerId)!
    }

    // Fetch learner data
    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      include: {
        diagnoses: true,
        accommodationPlan: true,
        learningModel: true,
      },
    })

    if (!learner) {
      throw new Error(`Learner not found: ${learnerId}`)
    }

    // Create personalized learning agent
    const learningAgent = new PersonalizedLearningAgent({
      learnerId,
      modelConfig: {
        provider: 'openai',
        modelName: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 2000,
      },
      memoryConfig: {
        maxShortTermItems: 50,
        maxLongTermItems: 1000,
        consolidationThreshold: 0.7,
      },
      coordinationConfig: {
        allowInterAgentComm: true,
        broadcastEvents: true,
        coordinationStrategy: 'centralized',
      },
    })

    // Create AI tutor agent
    const tutorAgent = new AITutorAgent({
      learnerId,
      modelConfig: {
        provider: 'openai',
        modelName: 'gpt-4-turbo-preview',
        temperature: 0.8,
        maxTokens: 1000,
      },
      memoryConfig: {
        maxShortTermItems: 30,
        maxLongTermItems: 500,
        consolidationThreshold: 0.6,
      },
      coordinationConfig: {
        allowInterAgentComm: true,
        broadcastEvents: false,
        coordinationStrategy: 'centralized',
      },
    })

    // Create content adaptation agent
    const contentAgent = new ContentAdaptationAgent({
      learnerId,
      modelConfig: {
        provider: 'openai',
        modelName: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 1500,
      },
      memoryConfig: {
        maxShortTermItems: 20,
        maxLongTermItems: 200,
        consolidationThreshold: 0.5,
      },
      coordinationConfig: {
        allowInterAgentComm: true,
        broadcastEvents: false,
        coordinationStrategy: 'centralized',
      },
    })

    // Register with orchestrator
    await this.orchestrator.registerAgent(learningAgent)
    await this.orchestrator.registerAgent(tutorAgent)
    await this.orchestrator.registerAgent(contentAgent)

    // Store references
    const agentSet = {
      learningAgent,
      tutorAgent,
      contentAgent,
    }

    this.learnerAgents.set(learnerId, agentSet)
    this.agents.set(`learning_${learnerId}`, learningAgent)
    this.agents.set(`tutor_${learnerId}`, tutorAgent)
    this.agents.set(`content_${learnerId}`, contentAgent)

    // Save agent state to database
    await this.saveAgentState(learnerId, learningAgent.getAgentId(), 'PERSONALIZED_LEARNING')
    await this.saveAgentState(learnerId, tutorAgent.getAgentId(), 'AI_TUTOR')
    await this.saveAgentState(learnerId, contentAgent.getAgentId(), 'CONTENT_ADAPTATION')

    return agentSet
  }

  private async saveAgentState(learnerId: string, agentId: string, agentType: string) {
    await prisma.agentState.upsert({
      where: { agentId },
      create: {
        agentId,
        learnerId,
        agentType: agentType as any,
        state: {},
        memory: {},
        lastActivity: new Date(),
      },
      update: {
        lastActivity: new Date(),
      },
    })
  }

  getAgentsForLearner(learnerId: string) {
    return this.learnerAgents.get(learnerId)
  }

  async processLearningInteraction(learnerId: string, interaction: any) {
    let agents = this.getAgentsForLearner(learnerId)
    
    if (!agents) {
      agents = await this.initializeAgentsForLearner(learnerId)
    }

    const { learningAgent, tutorAgent, contentAgent } = agents

    // Create orchestration plan
    const plan = {
      id: `interaction_${Date.now()}`,
      steps: [
        {
          id: 'analyze',
          agentId: learningAgent.getAgentId(),
          action: 'analyze_interaction',
          input: interaction,
        },
        {
          id: 'adapt',
          agentId: contentAgent.getAgentId(),
          action: 'adapt_content',
          input: interaction,
          dependencies: ['analyze'],
        },
        {
          id: 'respond',
          agentId: tutorAgent.getAgentId(),
          action: 'generate_response',
          input: interaction,
          dependencies: ['analyze'],
        },
      ],
      parallel: false,
      timeout: 10000,
    }

    const startTime = Date.now()
    let result
    let success = true
    let errorMessage: string | undefined

    try {
      result = await this.orchestrator.orchestrate(plan)
    } catch (error) {
      success = false
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result = { error: errorMessage }
    }

    const durationMs = Date.now() - startTime

    // Save interaction to database
    await this.saveInteraction(
      learnerId,
      learningAgent.getAgentId(),
      interaction,
      result,
      durationMs,
      success,
      errorMessage
    )

    // Update agent states
    await this.updateAgentStates(learnerId)

    return result
  }

  private async saveInteraction(
    learnerId: string,
    agentId: string,
    interaction: any,
    result: any,
    durationMs: number,
    success: boolean,
    errorMessage?: string
  ) {
    await prisma.agentInteraction.create({
      data: {
        learnerId,
        agentId,
        interactionType: interaction.type || 'general',
        input: interaction,
        output: result,
        durationMs,
        success,
        errorMessage,
      },
    })
  }

  private async updateAgentStates(learnerId: string) {
    const agents = this.getAgentsForLearner(learnerId)
    if (!agents) return

    const { learningAgent, tutorAgent, contentAgent } = agents

    await Promise.all([
      prisma.agentState.update({
        where: { agentId: learningAgent.getAgentId() },
        data: {
          lastActivity: new Date(),
          state: {}, // Would include actual agent state
          memory: {}, // Would include actual agent memory
        },
      }),
      prisma.agentState.update({
        where: { agentId: tutorAgent.getAgentId() },
        data: {
          lastActivity: new Date(),
          state: {},
          memory: {},
        },
      }),
      prisma.agentState.update({
        where: { agentId: contentAgent.getAgentId() },
        data: {
          lastActivity: new Date(),
          state: {},
          memory: {},
        },
      }),
    ])
  }

  async shutdownAgentsForLearner(learnerId: string) {
    const agents = this.getAgentsForLearner(learnerId)
    
    if (agents) {
      const { learningAgent, tutorAgent, contentAgent } = agents

      await Promise.all([
        learningAgent.shutdown(),
        tutorAgent.shutdown(),
        contentAgent.shutdown(),
      ])

      this.learnerAgents.delete(learnerId)
      this.agents.delete(`learning_${learnerId}`)
      this.agents.delete(`tutor_${learnerId}`)
      this.agents.delete(`content_${learnerId}`)
    }
  }

  async getAgentMetrics(learnerId: string) {
    const interactions = await prisma.agentInteraction.findMany({
      where: { learnerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const successRate = interactions.length > 0
      ? interactions.filter((i: any) => i.success).length / interactions.length
      : 0

    const avgDuration = interactions.length > 0
      ? interactions.reduce((sum: number, i: any) => sum + (i.durationMs || 0), 0) / interactions.length
      : 0

    return {
      totalInteractions: interactions.length,
      successRate,
      avgDuration,
      recentInteractions: interactions.slice(0, 10),
    }
  }
}
