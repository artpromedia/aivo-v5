import { EventEmitter } from 'events';
import Bull, { type Queue, type Job } from 'bull';
import Redis, { type RedisOptions } from 'ioredis';
import { BaseAgent, type AgentResponse } from './AgentFramework';

export interface OrchestrationPlan {
  id: string;
  steps: OrchestrationStep[];
  parallel: boolean;
  timeout?: number;
  fallbackPlan?: OrchestrationPlan;
}

export interface OrchestrationStep {
  id: string;
  agentId: string;
  action: string;
  input: unknown;
  dependencies?: string[];
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface OrchestrationResult {
  planId: string;
  success: boolean;
  results: Map<string, AgentResponse>;
  errors?: Map<string, Error>;
  duration: number;
}

interface RetryContext {
  step: OrchestrationStep;
  results: Map<string, AgentResponse>;
  errors: Map<string, Error>;
  deadline?: number;
}

export class AgentOrchestrator extends EventEmitter {
  private readonly agents = new Map<string, BaseAgent>();
  private readonly redis: Redis;
  private readonly jobQueue: Queue<ExecuteStepJobData>;
  private readonly activeOrchestrations = new Map<string, OrchestrationPlan>();

  constructor(options?: RedisOptions) {
    super();

    const redisOptions: RedisOptions =
      options ?? {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD,
      };

    this.redis = new Redis(redisOptions);
  this.jobQueue = new Bull<ExecuteStepJobData>('agent-orchestration', {
      redis: {
        port: redisOptions.port ?? 6379,
        host: redisOptions.host ?? 'localhost',
        password: redisOptions.password,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });

    this.setupJobProcessing();
  }

  async registerAgent(agent: BaseAgent): Promise<void> {
    const agentId = agent.getAgentId();
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} is already registered`);
    }

    await agent.initialize();
    this.agents.set(agentId, agent);

    agent.on('insight', (insight) => this.handleAgentInsight(agentId, insight));
    agent.on('error', (error: unknown) =>
      this.handleAgentError(agentId, error instanceof Error ? error : new Error(String(error))),
    );

    this.emit('agent:registered', { agentId });
  }

  async orchestrate(plan: OrchestrationPlan): Promise<OrchestrationResult> {
    this.activeOrchestrations.set(plan.id, plan);
    const startTime = Date.now();
    const deadline = plan.timeout ? startTime + plan.timeout : undefined;
    const results = new Map<string, AgentResponse>();
    const errors = new Map<string, Error>();

    try {
      const execution = plan.parallel
        ? this.executeParallel(plan, results, errors, deadline)
        : this.executeSequential(plan, results, errors, deadline);

      await this.withDeadline(execution, deadline, plan.id);

      const duration = Date.now() - startTime;
      return {
        planId: plan.id,
        success: errors.size === 0,
        results,
        errors: errors.size > 0 ? errors : undefined,
        duration,
      };
    } catch (error) {
      if (plan.fallbackPlan) {
        this.emit('plan:fallback', { planId: plan.id, fallbackPlanId: plan.fallbackPlan.id });
        return this.orchestrate(plan.fallbackPlan);
      }

      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      this.activeOrchestrations.delete(plan.id);
    }
  }

  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  async shutdown(): Promise<void> {
    const shutdowns = Array.from(this.agents.values()).map((agent) => agent.shutdown());
    await Promise.allSettled(shutdowns);
    await Promise.all([this.jobQueue.close(), this.redis.quit()]);
    this.activeOrchestrations.clear();
    this.removeAllListeners();
  }

  private async executeParallel(
    plan: OrchestrationPlan,
    results: Map<string, AgentResponse>,
    errors: Map<string, Error>,
    deadline?: number,
  ): Promise<void> {
    const tasks = plan.steps.map(async (step) => {
      try {
        await this.waitForDependencies(step.dependencies, results, deadline);
        const response = await this.executeStep(step);
        results.set(step.id, response);
      } catch (error) {
        errors.set(step.id, error instanceof Error ? error : new Error(String(error)));
        if (step.retryPolicy) {
          await this.retryStep({ step, results, errors, deadline });
        }
      }
    });

    await Promise.allSettled(tasks);
  }

  private async executeSequential(
    plan: OrchestrationPlan,
    results: Map<string, AgentResponse>,
    errors: Map<string, Error>,
    deadline?: number,
  ): Promise<void> {
    for (const step of plan.steps) {
      try {
        await this.waitForDependencies(step.dependencies, results, deadline);
        const response = await this.executeStep(step);
        results.set(step.id, response);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.set(step.id, err);

        if (step.retryPolicy) {
          const succeeded = await this.retryStep({ step, results, errors, deadline });
          if (succeeded) {
            continue;
          }
        }

        throw err;
      }
    }
  }

  private async executeStep(step: OrchestrationStep): Promise<AgentResponse> {
    const agent = this.agents.get(step.agentId);
    if (!agent) {
      throw new Error(`Agent ${step.agentId} not registered`);
    }

    const job = await this.jobQueue.add('execute-step', {
      stepId: step.id,
      agentId: step.agentId,
      action: step.action,
      input: step.input,
    });

    this.emit('step:started', { stepId: step.id, agentId: step.agentId, jobId: job.id });

    const response = await agent.processInput({ action: step.action, data: step.input });

    this.emit('step:completed', { stepId: step.id, agentId: step.agentId, jobId: job.id, response });
    return response;
  }

  private async waitForDependencies(
    dependencies: string[] | undefined,
    results: Map<string, AgentResponse>,
    deadline?: number,
  ): Promise<void> {
    if (!dependencies?.length) return;

    const pollInterval = 100;
    const timeoutAt = deadline ?? Date.now() + 30_000;

    while (Date.now() <= timeoutAt) {
      const allResolved = dependencies.every((dep) => results.has(dep));
      if (allResolved) return;
      await this.delay(pollInterval);
    }

    throw new Error(`Dependency wait timed out for: ${dependencies.join(', ')}`);
  }

  private async retryStep(context: RetryContext): Promise<boolean> {
    const { step, results, errors, deadline } = context;
    const { maxRetries, backoffMs } = step.retryPolicy!;

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      if (backoffMs > 0) {
        await this.delay(backoffMs * attempt);
      }

      try {
        await this.waitForDependencies(step.dependencies, results, deadline);
        const response = await this.executeStep(step);
        results.set(step.id, response);
        errors.delete(step.id);
        return true;
      } catch (error) {
        errors.set(step.id, error instanceof Error ? error : new Error(String(error)));
        if (attempt === maxRetries) {
          return false;
        }
      }
    }

    return false;
  }

  private async withDeadline<T>(promise: Promise<T>, deadline?: number, planId?: string): Promise<T> {
    if (!deadline) {
      return promise;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new Error(`Orchestration plan ${planId ?? ''} timed out`);
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Orchestration plan ${planId ?? ''} timed out`)), remaining);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private setupJobProcessing(): void {
    this.jobQueue.process('execute-step', async (job: Job<ExecuteStepJobData>) => {
      await this.redis.lpush(
        this.orchestratorKey(`execution:${job.data.stepId}`),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 'processing',
          payload: job.data,
        }),
      );

      return { stepId: job.data.stepId, status: 'queued' };
    });

    this.jobQueue.on('completed', (job: Job<ExecuteStepJobData>, result: unknown) => {
      this.emit('queue:completed', { jobId: job.id, result });
    });

    this.jobQueue.on('failed', (job: Job<ExecuteStepJobData> | null, error: Error) => {
      this.emit('queue:failed', { jobId: job?.id, error });
    });
  }

  private handleAgentInsight(agentId: string, insight: unknown): void {
    this.emit('agent:insight', { agentId, insight });
    void this.redis.lpush(
      this.orchestratorKey(`insights:${agentId}`),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        insight,
      }),
    );
  }

  private handleAgentError(agentId: string, error: Error): void {
    this.emit('agent:error', { agentId, error });
    void this.redis.lpush(
      this.orchestratorKey(`errors:${agentId}`),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
      }),
    );
  }

  private orchestratorKey(suffix: string): string {
    return `orchestrator:${suffix}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  emit(eventName: string | symbol, ...args: unknown[]): boolean {
    return super.emit(eventName, ...args);
  }

  on(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.on(eventName, listener);
  }

  once(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.once(eventName, listener);
  }

  off(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.off(eventName, listener);
  }

  removeAllListeners(event?: string | symbol): this {
    super.removeAllListeners(event);
    return this;
  }
}

interface ExecuteStepJobData {
  stepId: string;
  agentId: string;
  action: string;
  input: unknown;
}
