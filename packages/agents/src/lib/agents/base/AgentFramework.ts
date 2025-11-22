import { EventEmitter } from 'events';
import Redis, { type RedisOptions } from 'ioredis';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

export type AgentStatus = 'idle' | 'processing' | 'waiting' | 'error';

export interface AgentState {
  agentId: string;
  learnerId: string;
  sessionId: string;
  status: AgentStatus;
  lastActivity: Date;
  context: Record<string, unknown>;
  memory: AgentMemory;
}

export interface AgentMemory {
  shortTerm: MemoryItem[];
  longTerm: MemoryItem[];
  workingMemory: Record<string, unknown>;
  episodicMemory: EpisodicMemory[];
}

export interface MemoryItem {
  id: string;
  timestamp: Date;
  type: 'observation' | 'decision' | 'action' | 'feedback';
  content: unknown;
  importance: number;
  associations: string[];
}

export interface EpisodicMemory {
  episodeId: string;
  startTime: Date;
  endTime?: Date;
  events: MemoryItem[];
  outcome: 'success' | 'failure' | 'partial' | 'ongoing';
  lessons: string[];
}

export interface AgentResponse {
  action: string;
  confidence: number;
  reasoning: string;
  data: unknown;
  recommendations?: string[];
  nextSteps?: string[];
}

export interface AgentConfig {
  agentId?: string;
  learnerId: string;
  modelConfig: {
    provider: 'openai' | 'anthropic' | 'local';
    modelName: string;
    temperature?: number;
    maxTokens?: number;
  };
  memoryConfig: {
    maxShortTermItems: number;
    maxLongTermItems: number;
    consolidationThreshold: number;
  };
  coordinationConfig: {
    allowInterAgentComm: boolean;
    broadcastEvents: boolean;
    coordinationStrategy: 'centralized' | 'distributed' | 'hybrid';
  };
}

export interface AgentMessageEnvelope {
  correlationId?: string;
  fromAgent: string;
  toAgent: string;
  timestamp: string;
  message: unknown;
}

export interface AgentBroadcastEvent {
  agentId: string;
  event: string;
  data: unknown;
  timestamp: string;
}

interface PendingCoordination {
  targetAgentId: string;
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timeout: NodeJS.Timeout;
}

export abstract class BaseAgent extends EventEmitter {
  protected readonly agentId: string;
  protected readonly learnerId: string;
  protected state: AgentState;
  protected readonly redis: Redis;
  protected readonly redisPub: Redis;
  protected readonly redisSub: Redis;
  protected readonly openai: OpenAI;
  protected readonly config: AgentConfig;
  protected isInitialized = false;

  private readonly responseChannel: string;
  private readonly messageChannel: string;
  private readonly broadcastChannel = 'agent:events';
  private readonly channelSubscriptions = new Set<string>();
  private readonly pendingCoordinations = new Map<string, PendingCoordination>();
  private heartbeatInterval?: NodeJS.Timeout;
  private eventsBound = false;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.agentId = config.agentId ?? uuidv4();
    this.learnerId = config.learnerId;

    const redisOptions: RedisOptions = {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD,
    };

    this.redis = new Redis(redisOptions);
    this.redisPub = this.redis.duplicate();
    this.redisSub = this.redis.duplicate();
    this.redisSub.setMaxListeners(100);

    const apiKey = process.env.OPENAI_API_KEY;
    if (config.modelConfig.provider === 'openai' && !apiKey) {
      throw new Error('OPENAI_API_KEY is required when using the OpenAI provider');
    }

    this.openai = new OpenAI({ apiKey: apiKey ?? '' });

    this.messageChannel = `agent:${this.agentId}:messages`;
    this.responseChannel = `agent:${this.agentId}:responses`;

    this.state = {
      agentId: this.agentId,
      learnerId: this.learnerId,
      sessionId: '',
      status: 'idle',
      lastActivity: new Date(),
      context: {},
      memory: {
        shortTerm: [],
        longTerm: [],
        workingMemory: {},
        episodicMemory: [],
      },
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadState();
      await this.loadLearnerContext();
      await this.initializeSpecificComponents();
      this.setupEventListeners();

      this.isInitialized = true;
      this.state.status = 'idle';

      this.emit('initialized', { agentId: this.agentId });
      this.startHeartbeat();
    } catch (error) {
      this.state.status = 'error';
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      throw new Error(`Failed to initialize agent ${this.agentId}: ${err.message}`);
    }
  }

  protected abstract initializeSpecificComponents(): Promise<void>;
  abstract processInput(input: unknown): Promise<AgentResponse>;
  abstract generateInsight(): Promise<unknown>;
  protected abstract fetchLearnerFromDB(): Promise<unknown>;
  protected abstract handleAgentMessage(message: AgentMessageEnvelope): Promise<unknown>;
  protected abstract handleBroadcastEvent(event: AgentBroadcastEvent): Promise<void>;

  protected async loadState(): Promise<void> {
    const serialized = await this.redis.get(this.redisKey('state'));
    if (!serialized) {
      return;
    }

    try {
      const parsed = JSON.parse(serialized) as Omit<AgentState, 'lastActivity' | 'memory'> & {
        lastActivity: string;
      };

      this.state = {
        ...this.state,
        ...parsed,
        lastActivity: new Date(parsed.lastActivity),
      };

      await this.loadMemory();
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  protected async saveState(): Promise<void> {
    const stateKey = this.redisKey('state');
    const stateToSave = {
      agentId: this.state.agentId,
      learnerId: this.state.learnerId,
      sessionId: this.state.sessionId,
      status: this.state.status,
      lastActivity: this.state.lastActivity.toISOString(),
      context: this.state.context,
    };

    await this.redis.set(stateKey, JSON.stringify(stateToSave));
    await this.redis.expire(stateKey, 86_400);

    await this.saveMemory();
  }

  protected async loadMemory(): Promise<void> {
    const serialized = await this.redis.get(this.redisKey('memory'));
    if (!serialized) {
      return;
    }

    try {
      const parsed = JSON.parse(serialized) as AgentMemory;

      this.state.memory = {
        shortTerm: (parsed.shortTerm ?? []).map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
        longTerm: (parsed.longTerm ?? []).map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
        workingMemory: parsed.workingMemory ?? {},
        episodicMemory: (parsed.episodicMemory ?? []).map((episode) => ({
          ...episode,
          startTime: new Date(episode.startTime),
          endTime: episode.endTime ? new Date(episode.endTime) : undefined,
          events: (episode.events ?? []).map((event) => ({
            ...event,
            timestamp: new Date(event.timestamp),
          })),
        })),
      };
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  protected async saveMemory(): Promise<void> {
    const memoryKey = this.redisKey('memory');
    const serialized = JSON.stringify(this.state.memory, (_key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });

    await this.redis.set(memoryKey, serialized);
    await this.redis.expire(memoryKey, 604_800);
  }

  protected async loadLearnerContext(): Promise<void> {
    const learnerKey = `learner:${this.learnerId}:context`;
    const cachedContext = await this.redis.get(learnerKey);

    if (cachedContext) {
      this.state.context.learner = JSON.parse(cachedContext);
      return;
    }

    const learner = await this.fetchLearnerFromDB();
    this.state.context.learner = learner ?? {};

    await this.redis.set(learnerKey, JSON.stringify(this.state.context.learner));
    await this.redis.expire(learnerKey, 3_600);
  }

  protected addToShortTermMemory(item: Omit<MemoryItem, 'id' | 'timestamp'>): void {
    const memoryItem: MemoryItem = {
      ...item,
      id: uuidv4(),
      timestamp: new Date(),
    };

    this.state.memory.shortTerm.unshift(memoryItem);

    if (this.state.memory.shortTerm.length > this.config.memoryConfig.maxShortTermItems) {
      const overflow = this.state.memory.shortTerm.splice(this.config.memoryConfig.maxShortTermItems);
      this.consolidateMemory(overflow);
    }

    void this.saveMemory();
  }

  protected consolidateMemory(items: MemoryItem[]): void {
    if (!items.length) return;

    const important = items.filter(
      (item) => item.importance >= this.config.memoryConfig.consolidationThreshold,
    );

    if (important.length) {
      this.state.memory.longTerm.push(...important);
      if (this.state.memory.longTerm.length > this.config.memoryConfig.maxLongTermItems) {
        this.state.memory.longTerm.sort((a, b) => b.importance - a.importance);
        this.state.memory.longTerm = this.state.memory.longTerm.slice(
          0,
          this.config.memoryConfig.maxLongTermItems,
        );
      }
    }
  }

  protected startEpisode(): string {
    const episodeId = uuidv4();
    const episode: EpisodicMemory = {
      episodeId,
      startTime: new Date(),
      events: [],
      outcome: 'ongoing',
      lessons: [],
    };

    this.state.memory.episodicMemory.push(episode);
    this.state.context.currentEpisodeId = episodeId;

    void this.saveMemory();
    return episodeId;
  }

  protected endEpisode(outcome: EpisodicMemory['outcome'], lessons: string[] = []): void {
    const currentEpisodeId = this.state.context.currentEpisodeId as string | undefined;
    if (!currentEpisodeId) return;

    const episode = this.state.memory.episodicMemory.find((entry) => entry.episodeId === currentEpisodeId);
    if (episode) {
      episode.endTime = new Date();
      episode.outcome = outcome;
      episode.lessons = lessons;
    }

    delete this.state.context.currentEpisodeId;
    void this.saveMemory();
  }

  protected async coordinateWith(targetAgentId: string, message: unknown): Promise<unknown> {
    if (!this.config.coordinationConfig.allowInterAgentComm) {
      throw new Error('Inter-agent communication is disabled for this agent');
    }

    const correlationId = uuidv4();
    const envelope = {
      correlationId,
      fromAgent: this.agentId,
      toAgent: targetAgentId,
      timestamp: new Date().toISOString(),
      message,
    } satisfies AgentMessageEnvelope;

    await this.subscribeToChannel(this.responseChannel);

    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCoordinations.delete(correlationId);
        reject(new Error('Coordination timeout'));
      }, 5_000);

      this.pendingCoordinations.set(correlationId, {
        targetAgentId,
        resolve,
        reject,
        timeout,
      });

      this.redisPub
        .publish(this.channelNameForAgent(targetAgentId), JSON.stringify(envelope))
        .catch((error: unknown) => {
          clearTimeout(timeout);
          this.pendingCoordinations.delete(correlationId);
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }

  protected async broadcastEvent(event: string, data: unknown): Promise<void> {
    if (!this.config.coordinationConfig.broadcastEvents) return;

    const payload: AgentBroadcastEvent = {
      agentId: this.agentId,
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    await this.redisPub.publish(this.broadcastChannel, JSON.stringify(payload));
  }

  protected setupEventListeners(): void {
    if (this.eventsBound) return;
    this.eventsBound = true;

    this.redisSub.on('message', (channel: string, payload: string) => {
      void this.handleRedisMessage(channel, payload);
    });

    void this.subscribeToChannel(this.messageChannel).catch((error: unknown) =>
      this.emit('error', error instanceof Error ? error : new Error(String(error))),
    );
    void this.subscribeToChannel(this.responseChannel).catch((error: unknown) =>
      this.emit('error', error instanceof Error ? error : new Error(String(error))),
    );

    if (this.config.coordinationConfig.broadcastEvents) {
      void this.subscribeToChannel(this.broadcastChannel).catch((error: unknown) =>
        this.emit('error', error instanceof Error ? error : new Error(String(error))),
      );
    }
  }

  protected startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      this.state.lastActivity = new Date();
      void this.saveState();
      this.emit('heartbeat', { agentId: this.agentId, status: this.state.status });
    }, 30_000);

    this.heartbeatInterval.unref?.();
  }

  async shutdown(): Promise<void> {
    this.state.status = 'idle';
    await this.saveState();

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    for (const channel of this.channelSubscriptions) {
      await this.redisSub.unsubscribe(channel);
    }
    this.channelSubscriptions.clear();

    this.redisSub.removeAllListeners('message');
    this.pendingCoordinations.forEach(({ timeout, reject }) => {
      clearTimeout(timeout);
      reject(new Error('Agent shutting down'));
    });
    this.pendingCoordinations.clear();

    await Promise.all([this.redis.quit(), this.redisPub.quit(), this.redisSub.quit()]);
    this.removeAllListeners();
  }

  getStatus(): AgentStatus {
    return this.state.status;
  }

  getAgentId(): string {
    return this.agentId;
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

  protected redisKey(suffix: string): string {
    return `agent:${this.agentId}:${suffix}`;
  }

  private channelNameForAgent(agentId: string): string {
    return `agent:${agentId}:messages`;
  }

  private async subscribeToChannel(channel: string): Promise<void> {
    if (this.channelSubscriptions.has(channel)) return;

    await this.redisSub.subscribe(channel);
    this.channelSubscriptions.add(channel);
  }

  private async handleRedisMessage(channel: string, payload: string): Promise<void> {
    try {
      if (channel === this.messageChannel) {
        const envelope = JSON.parse(payload) as AgentMessageEnvelope;
        const response = await this.handleAgentMessage(envelope);

        if (envelope.correlationId) {
          const responseChannel = `agent:${envelope.fromAgent}:responses`;
          await this.redisPub.publish(
            responseChannel,
            JSON.stringify({
              fromAgent: this.agentId,
              correlationId: envelope.correlationId,
              message: response,
            }),
          );
        }
        return;
      }

      if (channel === this.broadcastChannel) {
        const event = JSON.parse(payload) as AgentBroadcastEvent;
        await this.handleBroadcastEvent(event);
        return;
      }

      if (channel === this.responseChannel) {
        const response = JSON.parse(payload) as {
          fromAgent: string;
          correlationId?: string;
          message: unknown;
        };

        if (!response.correlationId) return;
        const pending = this.pendingCoordinations.get(response.correlationId);
        if (!pending || pending.targetAgentId !== response.fromAgent) return;

        clearTimeout(pending.timeout);
        pending.resolve(response.message);
        this.pendingCoordinations.delete(response.correlationId);
        return;
      }
    } catch (error) {
      this.emit('error', error as Error);
    }
  }
}
