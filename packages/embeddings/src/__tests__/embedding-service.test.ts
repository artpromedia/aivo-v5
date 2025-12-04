/**
 * Tests for embedding service
 *
 * Note: These tests mock OpenAI API calls.
 * For integration tests with real API, set OPENAI_API_KEY.
 */
import { EmbeddingService, ADA_002_DIMENSIONS } from '../embedding-service';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockImplementation(async (params: { input: string | string[] }) => {
          const inputs = Array.isArray(params.input) ? params.input : [params.input];
          return {
            data: inputs.map((_: string, index: number) => ({
              embedding: new Array(1536).fill(0).map(() => Math.random()),
              index,
            })),
            usage: {
              total_tokens: inputs.length * 10,
            },
          };
        }),
      },
    })),
  };
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    service = new EmbeddingService({ apiKey: 'test-key' });
  });

  describe('constructor', () => {
    it('throws if no API key is provided', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => new EmbeddingService()).toThrow('OpenAI API key is required');

      process.env.OPENAI_API_KEY = originalEnv;
    });

    it('accepts API key from config', () => {
      expect(() => new EmbeddingService({ apiKey: 'test-key' })).not.toThrow();
    });
  });

  describe('embed', () => {
    it('returns embedding result for single text', async () => {
      const result = await service.embed('Test text for embedding');

      expect(result).toHaveProperty('embedding');
      expect(result).toHaveProperty('tokensUsed');
      expect(result).toHaveProperty('text');
      expect(result.embedding).toHaveLength(1536);
      expect(result.text).toBe('Test text for embedding');
    });

    it('preprocesses text before embedding', async () => {
      const result = await service.embed('  Multiple   spaces  \r\n  and newlines  ');

      expect(result.text).toBe('Multiple spaces and newlines');
    });
  });

  describe('embedBatch', () => {
    it('returns embeddings for multiple texts', async () => {
      const texts = ['First text', 'Second text', 'Third text'];
      const result = await service.embedBatch(texts);

      expect(result.embeddings).toHaveLength(3);
      expect(result.totalTokensUsed).toBeGreaterThan(0);

      result.embeddings.forEach((item, i) => {
        expect(item.embedding).toHaveLength(1536);
        expect(item.text).toBe(texts[i]);
      });
    });

    it('handles empty array', async () => {
      const result = await service.embedBatch([]);

      expect(result.embeddings).toHaveLength(0);
      expect(result.totalTokensUsed).toBe(0);
    });
  });

  describe('getDimensions', () => {
    it('returns 1536 for ada-002 model', () => {
      expect(service.getDimensions()).toBe(ADA_002_DIMENSIONS);
      expect(service.getDimensions()).toBe(1536);
    });
  });
});

describe('ADA_002_DIMENSIONS', () => {
  it('is 1536', () => {
    expect(ADA_002_DIMENSIONS).toBe(1536);
  });
});
