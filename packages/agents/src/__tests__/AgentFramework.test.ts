import { AgentConfig, MemoryItem } from '../lib/agents/base/AgentFramework';
import { TestAgentHarness } from '../testing/TestAgentHarness';

const buildConfig = (overrides?: Partial<AgentConfig>): AgentConfig => ({
  agentId: overrides?.agentId,
  learnerId: overrides?.learnerId ?? 'learner-test',
  modelConfig: {
    provider: overrides?.modelConfig?.provider ?? 'local',
    modelName: overrides?.modelConfig?.modelName ?? 'stub-model',
    temperature: overrides?.modelConfig?.temperature,
    maxTokens: overrides?.modelConfig?.maxTokens,
  },
  memoryConfig: {
    maxShortTermItems: overrides?.memoryConfig?.maxShortTermItems ?? 3,
    maxLongTermItems: overrides?.memoryConfig?.maxLongTermItems ?? 2,
    consolidationThreshold: overrides?.memoryConfig?.consolidationThreshold ?? 0.7,
  },
  coordinationConfig: {
    allowInterAgentComm: overrides?.coordinationConfig?.allowInterAgentComm ?? false,
    broadcastEvents: overrides?.coordinationConfig?.broadcastEvents ?? false,
    coordinationStrategy: overrides?.coordinationConfig?.coordinationStrategy ?? 'centralized',
  },
});

const buildMemoryPayload = (importance: number): Omit<MemoryItem, 'id' | 'timestamp'> => ({
  type: 'observation',
  content: { importance },
  importance,
  associations: [],
});

describe('BaseAgent memory management', () => {
  it('caps short-term memory and consolidates qualifying overflow into long-term storage', async () => {
  const agent = new TestAgentHarness(
      buildConfig({
        memoryConfig: {
          maxShortTermItems: 3,
          maxLongTermItems: 2,
          consolidationThreshold: 0.7,
        },
      }),
    );

    try {
      const importances = [0.9, 0.85, 0.2, 0.1, 0.05];
      importances.forEach((score) => agent.addMemoryItem(buildMemoryPayload(score)));

      const snapshot = agent.snapshot;
      expect(snapshot.memory.shortTerm).toHaveLength(3);
      expect(snapshot.memory.shortTerm.map((item) => item.importance)).toEqual([0.05, 0.1, 0.2]);

      expect(snapshot.memory.longTerm).toHaveLength(2);
      const longTermScores = snapshot.memory.longTerm.map((item) => item.importance).sort((a, b) => b - a);
      expect(longTermScores).toEqual([0.9, 0.85]);
    } finally {
      await agent.shutdown();
    }
  });
});
