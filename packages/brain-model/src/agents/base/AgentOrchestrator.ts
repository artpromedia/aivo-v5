export interface OrchestrationStep {
  id: string
  agentId: string
  action: string
  input: any
  dependencies?: string[]
}

export interface OrchestrationPlan {
  id: string
  steps: OrchestrationStep[]
  parallel?: boolean
  timeout?: number
}

export interface AgentInterface {
  getAgentId(): string
  execute(action: string, input: any): Promise<any>
  shutdown(): Promise<void>
}

export class AgentOrchestrator {
  private agents: Map<string, AgentInterface>

  constructor() {
    this.agents = new Map()
  }

  async registerAgent(agent: AgentInterface): Promise<void> {
    this.agents.set(agent.getAgentId(), agent)
  }

  async orchestrate(plan: OrchestrationPlan): Promise<Map<string, any>> {
    const results = new Map<string, any>()
    const timeout = plan.timeout || 30000

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Orchestration timeout')), timeout)
    )

    try {
      const orchestrationPromise = this.executeSteps(plan.steps, results)
      await Promise.race([orchestrationPromise, timeoutPromise])
    } catch (error) {
      throw new Error(`Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return results
  }

  private async executeSteps(steps: OrchestrationStep[], results: Map<string, any>): Promise<void> {
    const completed = new Set<string>()
    const pending = [...steps]

    while (pending.length > 0) {
      // Find steps with all dependencies met
      const ready = pending.filter(step => {
        if (!step.dependencies || step.dependencies.length === 0) return true
        return step.dependencies.every(dep => completed.has(dep))
      })

      if (ready.length === 0) {
        throw new Error('Circular dependency or unsatisfied dependencies detected')
      }

      // Execute ready steps
      await Promise.all(
        ready.map(async step => {
          const agent = this.agents.get(step.agentId)
          if (!agent) {
            throw new Error(`Agent not found: ${step.agentId}`)
          }

          try {
            // Enrich input with results from dependencies
            const enrichedInput = this.enrichInput(step, results)
            const result = await agent.execute(step.action, enrichedInput)
            results.set(step.id, result)
            completed.add(step.id)
          } catch (error) {
            throw new Error(`Step ${step.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        })
      )

      // Remove completed steps from pending
      ready.forEach(step => {
        const index = pending.indexOf(step)
        if (index > -1) pending.splice(index, 1)
      })
    }
  }

  private enrichInput(step: OrchestrationStep, results: Map<string, any>): any {
    if (!step.dependencies || step.dependencies.length === 0) {
      return step.input
    }

    const enriched = { ...step.input }
    enriched.dependencies = {}

    step.dependencies.forEach(depId => {
      enriched.dependencies[depId] = results.get(depId)
    })

    return enriched
  }

  async unregisterAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId)
  }
}
