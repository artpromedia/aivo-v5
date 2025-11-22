import {
  AgentConfig,
  AgentResponse,
  AgentState,
  BaseAgent,
  MemoryItem,
} from '../lib/agents/base/AgentFramework';

export class TestAgentHarness extends BaseAgent {
  readonly actionAttempts = new Map<string, number>();

  constructor(config: AgentConfig) {
    super(config);
  }

  get snapshot(): AgentState {
    return this.state;
  }

  addMemoryItem(item: Omit<MemoryItem, 'id' | 'timestamp'>): void {
    this.addToShortTermMemory(item);
  }

  protected override async initializeSpecificComponents(): Promise<void> {
    // no-op for tests
  }

  async processInput(input: any): Promise<AgentResponse> {
    const action = input?.action ?? 'unknown-action';
    const attempts = (this.actionAttempts.get(action) ?? 0) + 1;
    this.actionAttempts.set(action, attempts);

    const failTimes = input?.data?.failTimes ?? 0;
    if (attempts <= failTimes) {
      throw new Error(`Planned failure for ${action}`);
    }

    return {
      action,
      confidence: 0.9,
      reasoning: `attempt ${attempts}`,
      data: input?.data,
    };
  }

  async generateInsight(): Promise<unknown> {
    return { attempts: Object.fromEntries(this.actionAttempts) };
  }

  protected override async fetchLearnerFromDB(): Promise<unknown> {
    return { id: this.learnerId };
  }

  protected override async handleAgentMessage(): Promise<unknown> {
    return { acknowledged: true };
  }

  protected override async handleBroadcastEvent(): Promise<void> {
    // no-op
  }

  protected override setupEventListeners(): void {
    // skip Redis pub/sub wiring in tests
  }

  protected override startHeartbeat(): void {
    // disable heartbeat interval timers in tests
  }

  protected override async saveState(): Promise<void> {
    // prevent Redis writes during tests
  }

  protected override async loadState(): Promise<void> {
    // bypass persisted state reads
  }

  protected override async loadLearnerContext(): Promise<void> {
    this.state.context.learner = { id: this.learnerId };
  }

  protected override async saveMemory(): Promise<void> {
    // skip persistence for deterministic assertions
  }
}
