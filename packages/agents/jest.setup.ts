import { EventEmitter } from 'events';

// Set required environment variables for tests
process.env.OPENAI_API_KEY = 'test-openai-api-key';

// Create a smart mock that returns context-appropriate responses
const createSmartMockOpenAI = () => {
  const mockCreate = jest.fn().mockImplementation(async (options: any) => {
    const messages = options.messages || [];
    const lastMessage = messages[messages.length - 1]?.content || '';
    const systemMessage = messages[0]?.content || '';
    
    // Detect what type of response is needed based on context
    let response: any = {
      action: "continue",
      reason: "Mocked AI decision",
      confidence: 0.8,
      details: {},
      adaptations: []
    };

    // AITutorAgent classification patterns
    if (lastMessage.includes('Classify this student message')) {
      // Extract the student message from the prompt
      const messageMatch = lastMessage.match(/Student message: "([^"]+)"/);
      const studentMessage = messageMatch ? messageMatch[1].toLowerCase() : '';
      
      if (studentMessage.includes('help') || studentMessage.includes('can you')) {
        response = { type: "help_request", confidence: 0.9, indicators: ["help word detected"] };
      } else if (
        studentMessage.includes('answer is') || 
        studentMessage.match(/^[0-9]+$/) ||  // Just a number
        studentMessage.match(/^[a-z]+$/) ||   // Just a word (likely an answer)
        studentMessage === 'cat' ||
        studentMessage === 'dog' ||
        studentMessage === '42' ||
        studentMessage === '5' ||
        studentMessage === '7'
      ) {
        response = { type: "answer_attempt", confidence: 0.9, indicators: ["answer pattern"] };
      } else if (studentMessage.includes('hard') || studentMessage.includes('give up') || studentMessage.includes('frustrated') || studentMessage.includes("can't do") || studentMessage.includes('stupid') || studentMessage.includes("i can't")) {
        response = { type: "frustration", confidence: 0.9, indicators: ["frustration detected"] };
      } else if (studentMessage.includes("don't understand") || studentMessage.includes('confused') || studentMessage.includes("doesn't make sense") || studentMessage.includes('what does this mean')) {
        response = { type: "confusion", confidence: 0.9, indicators: ["confusion detected"] };
      } else if (studentMessage.includes('address') || studentMessage.includes('phone') || studentMessage.includes('where do you live') || studentMessage.includes('movie') || studentMessage.includes('superhero') || studentMessage.includes('game')) {
        response = { type: "off_topic", confidence: 0.9, indicators: ["off-topic detected"] };
      } else {
        response = { type: "general", confidence: 0.7, indicators: [] };
      }
    }
    // Answer celebration/correction responses (after evaluateAnswer calls OpenAI for message content)
    else if (lastMessage.includes('got the answer correct') || lastMessage.includes('Celebrate their success')) {
      return {
        choices: [{ message: { content: "🎉 Amazing job! You got it right! You're doing fantastic!" } }]
      };
    }
    else if (lastMessage.includes('not quite right') || lastMessage.includes('Guide them toward')) {
      return {
        choices: [{ message: { content: "That's a great try! Let's think about this together. Would you like a hint?" } }]
      };
    }
    // Frustration/emotional support responses  
    else if (lastMessage.includes('showing frustration') || lastMessage.includes('validate their feelings')) {
      return {
        choices: [{ message: { content: "I understand how you feel. Learning new things can be hard sometimes, and that's okay! Let's take a moment." } }]
      };
    }
    // Confusion clarification
    else if (lastMessage.includes("doesn't make sense") || lastMessage.includes('clarify')) {
      return {
        choices: [{ message: { content: "I can see this is tricky. Let me explain it in a different way. Does that make more sense now?" } }]
      };
    }
    // Safety filter - personal information
    else if (lastMessage.includes('personal information') || lastMessage.includes('address') || lastMessage.includes('phone number')) {
      response = {
        type: "redirect",
        emotion: "friendly",
        message: "I can't help with personal information. Let's focus on learning!",
        shouldSpeak: true
      };
    }
    // Hint responses
    else if (lastMessage.includes('gentle hint') || lastMessage.includes('Guide their thinking')) {
      return {
        choices: [{ message: { content: "Hmm, think about what we learned earlier. What happens when you add those numbers?" } }]
      };
    }
    // PersonalizedLearningAgent responses
    else if (lastMessage.includes('learning decision') || lastMessage.includes('difficulty')) {
      response = {
        action: "adjust_difficulty",
        reason: "Performance-based adjustment",
        confidence: 0.85,
        details: { suggestedLevel: 4, reason: "optimal challenge" },
        adaptations: []
      };
    }
    // Default - return as message content for non-JSON responses
    else {
      return {
        choices: [{ message: { content: "I'm here to help! Let's work on this together." } }]
      };
    }

    return {
      choices: [
        {
          message: {
            content: JSON.stringify(response)
          }
        }
      ]
    };
  });

  return {
    chat: {
      completions: {
        create: mockCreate
      }
    }
  };
};

// Mock OpenAI - needs to be a proper ES module default export
const MockOpenAI = jest.fn().mockImplementation(() => createSmartMockOpenAI());

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: MockOpenAI,
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
      // Check if this is a coordination message that needs auto-response
      if (channel.includes(':messages')) {
        try {
          const envelope = JSON.parse(message);
          if (envelope.correlationId && envelope.fromAgent) {
            // Auto-respond to coordination requests
            const responseChannel = `agent:${envelope.fromAgent}:responses`;
            const response = {
              correlationId: envelope.correlationId,
              fromAgent: envelope.toAgent,
              toAgent: envelope.fromAgent,
              timestamp: new Date().toISOString(),
              message: { success: true, acknowledged: true }
            };
            // Schedule response for next tick so the agent has time to subscribe
            setImmediate(() => {
              for (const instance of MockRedis.instances) {
                if (instance.subscribedChannels.has(responseChannel)) {
                  instance.emit('message', responseChannel, JSON.stringify(response));
                }
              }
            });
          }
        } catch (e) {
          // Not a JSON message, ignore
        }
      }
      
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

    static cleanupAll() {
      for (const instance of MockRedis.instances) {
        instance.removeAllListeners();
      }
      MockRedis.instances.clear();
      MockRedis.store.clear();
    }
  }

  // Expose cleanup function globally
  (global as any).__mockRedisCleanup = () => MockRedis.cleanupAll();

  return MockRedis;
});

jest.mock('bull', () => {
  let jobCounter = 0;
  const instances = new Set<any>();

  class MockQueue extends EventEmitter {
    private handlers = new Map<string, (job: { id: string; data: any }) => unknown>();

    constructor() {
      super();
      instances.add(this);
    }

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
      instances.delete(this);
      this.removeAllListeners();
    }

    static cleanupAll() {
      for (const instance of instances) {
        instance.removeAllListeners();
      }
      instances.clear();
      jobCounter = 0;
    }
  }

  // Expose cleanup function globally
  (global as any).__mockBullCleanup = () => MockQueue.cleanupAll();

  return MockQueue;
});

// Mock TensorFlow.js Node - native bindings not available in CI/Windows
jest.mock('@tensorflow/tfjs-node', () => {
  const mockTensor = {
    shape: [1, 10],
    dtype: 'float32',
    dataSync: () => new Float32Array(10).fill(0),
    arraySync: () => [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    array: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]]),
    dispose: jest.fn(),
    reshape: jest.fn().mockReturnThis(),
    expandDims: jest.fn().mockReturnThis(),
    squeeze: jest.fn().mockReturnThis(),
  };

  const mockModel = {
    predict: jest.fn(() => mockTensor),
    dispose: jest.fn(),
  };

  return {
    tensor: jest.fn(() => mockTensor),
    tensor1d: jest.fn(() => mockTensor),
    tensor2d: jest.fn(() => mockTensor),
    tensor3d: jest.fn(() => mockTensor),
    tensor4d: jest.fn(() => mockTensor),
    zeros: jest.fn(() => mockTensor),
    ones: jest.fn(() => mockTensor),
    fill: jest.fn(() => mockTensor),
    linspace: jest.fn(() => mockTensor),
    range: jest.fn(() => mockTensor),
    scalar: jest.fn(() => mockTensor),
    randomNormal: jest.fn(() => mockTensor),
    randomUniform: jest.fn(() => mockTensor),
    concat: jest.fn(() => mockTensor),
    stack: jest.fn(() => mockTensor),
    split: jest.fn(() => [mockTensor]),
    reshape: jest.fn(() => mockTensor),
    expandDims: jest.fn(() => mockTensor),
    squeeze: jest.fn(() => mockTensor),
    abs: jest.fn(() => mockTensor),
    add: jest.fn(() => mockTensor),
    sub: jest.fn(() => mockTensor),
    mul: jest.fn(() => mockTensor),
    div: jest.fn(() => mockTensor),
    mean: jest.fn(() => mockTensor),
    sum: jest.fn(() => mockTensor),
    max: jest.fn(() => mockTensor),
    min: jest.fn(() => mockTensor),
    argMax: jest.fn(() => mockTensor),
    argMin: jest.fn(() => mockTensor),
    softmax: jest.fn(() => mockTensor),
    sigmoid: jest.fn(() => mockTensor),
    relu: jest.fn(() => mockTensor),
    tanh: jest.fn(() => mockTensor),
    dispose: jest.fn(),
    disposeVariables: jest.fn(),
    memory: jest.fn(() => ({ numTensors: 0, numDataBuffers: 0, numBytes: 0 })),
    tidy: jest.fn((fn: () => unknown) => fn()),
    ready: jest.fn().mockResolvedValue(undefined),
    setBackend: jest.fn().mockResolvedValue(true),
    getBackend: jest.fn(() => 'cpu'),
    ENV: { set: jest.fn(), get: jest.fn() },
    loadLayersModel: jest.fn().mockResolvedValue(mockModel),
    loadGraphModel: jest.fn().mockResolvedValue(mockModel),
    sequential: jest.fn(() => ({
      add: jest.fn(),
      compile: jest.fn(),
      fit: jest.fn().mockResolvedValue({ history: { loss: [0.1] } }),
      predict: jest.fn(() => mockTensor),
      save: jest.fn().mockResolvedValue(undefined),
      dispose: jest.fn(),
    })),
    model: jest.fn(() => ({
      compile: jest.fn(),
      fit: jest.fn().mockResolvedValue({ history: { loss: [0.1] } }),
      predict: jest.fn(() => mockTensor),
      save: jest.fn().mockResolvedValue(undefined),
      dispose: jest.fn(),
    })),
    layers: {
      dense: jest.fn(() => ({})),
      dropout: jest.fn(() => ({})),
      lstm: jest.fn(() => ({})),
      gru: jest.fn(() => ({})),
      conv1d: jest.fn(() => ({})),
      conv2d: jest.fn(() => ({})),
      maxPooling1d: jest.fn(() => ({})),
      maxPooling2d: jest.fn(() => ({})),
      flatten: jest.fn(() => ({})),
      batchNormalization: jest.fn(() => ({})),
      embedding: jest.fn(() => ({})),
      inputLayer: jest.fn(() => ({})),
    },
    train: {
      adam: jest.fn(() => ({})),
      sgd: jest.fn(() => ({})),
      rmsprop: jest.fn(() => ({})),
    },
    io: {
      fileSystem: jest.fn(() => ({})),
    },
    node: {
      decodeWav: jest.fn(() => ({ sampleRate: 16000, audioContents: mockTensor })),
      encodeWav: jest.fn(() => Buffer.from([])),
    },
  };
});

// Global cleanup to prevent worker process exit warning
afterAll(async () => {
  // Clean up Redis mock instances
  if ((global as any).__mockRedisCleanup) {
    (global as any).__mockRedisCleanup();
  }
  
  // Clean up Bull queue mock instances
  if ((global as any).__mockBullCleanup) {
    (global as any).__mockBullCleanup();
  }
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear any pending timers
  jest.clearAllTimers();
  
  // Use fake timers cleanup if enabled
  jest.useRealTimers();
  
  // Allow any pending promises to resolve
  await new Promise(resolve => setImmediate(resolve));
});
