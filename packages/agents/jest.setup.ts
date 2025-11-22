import { EventEmitter } from 'events';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    action: "continue",
                    reason: "Mocked AI decision",
                    confidence: 0.8,
                    details: {},
                    adaptations: []
                  })
                }
              }
            ]
          })
        }
      }
    }))
  };
});

jest.mock('ioredis', () => {
  class MockRedis extends EventEmitter {
    private static store = new Map<string, string>();
    private static instances = new Set<MockRedis>();
    private subscribedChannels = new Set<string>();

    constructor() {
      super();
      MockRedis.instances.add(this);
    }

    duplicate(): MockRedis {
      return new MockRedis();
    }

    setMaxListeners(): this {
      return this;
    }

    async get(key: string): Promise<string | null> {
      return MockRedis.store.get(key) ?? null;
    }

    async set(key: string, value: string): Promise<'OK'> {
      MockRedis.store.set(key, value);
      return 'OK';
    }

    async expire(): Promise<number> {
      return 1;
    }

    async publish(channel: string, message: string): Promise<number> {
      for (const instance of MockRedis.instances) {
        if (instance.subscribedChannels.has(channel)) {
          instance.emit('message', channel, message);
        }
      }
      return 1;
    }

    async subscribe(channel: string): Promise<number> {
      this.subscribedChannels.add(channel);
      return this.subscribedChannels.size;
    }

    async unsubscribe(channel?: string): Promise<number> {
      if (channel) {
        this.subscribedChannels.delete(channel);
      } else {
        this.subscribedChannels.clear();
      }
      return 1;
    }

    async lpush(key: string, value: string): Promise<number> {
      const raw = MockRedis.store.get(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      list.unshift(value);
      MockRedis.store.set(key, JSON.stringify(list));
      return list.length;
    }

    async quit(): Promise<'OK'> {
      MockRedis.instances.delete(this);
      this.removeAllListeners();
      return 'OK';
    }
  }

  return MockRedis;
});

jest.mock('bull', () => {
  let jobCounter = 0;

  return class MockQueue extends EventEmitter {
    private handlers = new Map<string, (job: { id: string; data: any }) => unknown>();

    process(name: string, handler: (job: { id: string; data: any }) => unknown) {
      this.handlers.set(name, handler);
    }

    async add(name: string, data: any) {
      const jobId = `${++jobCounter}`;
      const handler = this.handlers.get(name);

      if (handler) {
        await handler({ id: jobId, data });
        this.emit('completed', { id: jobId, data }, { stepId: data.stepId, status: 'queued' });
      }

      return { id: jobId, data };
    }

    async close() {
      /* no-op for tests */
    }
  };
});
