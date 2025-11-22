import { AgentOrchestrator, OrchestrationPlan } from '../lib/agents/base/AgentOrchestrator';
import { AgentConfig } from '../lib/agents/base/AgentFramework';
import { TestAgentHarness } from '../testing/TestAgentHarness';

const buildConfig = (overrides?: Partial<AgentConfig>): AgentConfig => ({
  agentId: overrides?.agentId,
  learnerId: overrides?.learnerId ?? 'learner-retry',
  modelConfig: {
    provider: overrides?.modelConfig?.provider ?? 'local',
    modelName: overrides?.modelConfig?.modelName ?? 'stub-model',
    temperature: overrides?.modelConfig?.temperature,
    maxTokens: overrides?.modelConfig?.maxTokens,
  },
  memoryConfig: {
    maxShortTermItems: overrides?.memoryConfig?.maxShortTermItems ?? 5,
    maxLongTermItems: overrides?.memoryConfig?.maxLongTermItems ?? 5,
    consolidationThreshold: overrides?.memoryConfig?.consolidationThreshold ?? 0.5,
  },
  coordinationConfig: {
    allowInterAgentComm: overrides?.coordinationConfig?.allowInterAgentComm ?? false,
    broadcastEvents: overrides?.coordinationConfig?.broadcastEvents ?? false,
    coordinationStrategy: overrides?.coordinationConfig?.coordinationStrategy ?? 'centralized',
  },
});

describe('AgentOrchestrator retries', () => {
  it('retries failed steps according to the policy before succeeding', async () => {
  const orchestrator = new AgentOrchestrator();
  const agent = new TestAgentHarness(buildConfig());

    await orchestrator.registerAgent(agent);

    const plan: OrchestrationPlan = {
      id: 'plan-retry',
      parallel: false,
      steps: [
        {
          id: 'step-1',
          agentId: agent.getAgentId(),
          action: 'retry-action',
          input: { failTimes: 1 },
          retryPolicy: {
            maxRetries: 2,
            backoffMs: 0,
          },
        },
      ],
    };

    try {
      const result = await orchestrator.orchestrate(plan);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.results.get('step-1')?.action).toBe('retry-action');
      expect(agent.actionAttempts.get('retry-action')).toBe(2);
    } finally {
      await orchestrator.shutdown();
    }
  });
});
