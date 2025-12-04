/**
 * Tests for vector client
 *
 * Note: These tests mock Upstash Vector API calls.
 * For integration tests, set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN.
 */
import {
  VectorClient,
  generateTopicVectorId,
  generateContentItemVectorId,
  VectorMetadata,
} from '../vector-client';

interface MockVectorItem {
  id: string;
  vector: number[];
  metadata: VectorMetadata;
}

// Mock Upstash Vector
jest.mock('@upstash/vector', () => {
  const mockVectors = new Map<string, MockVectorItem>();

  return {
    Index: jest.fn().mockImplementation(() => ({
      upsert: jest.fn().mockImplementation(async (data: MockVectorItem | MockVectorItem[]) => {
        const items = Array.isArray(data) ? data : [data];
        items.forEach((item: MockVectorItem) => {
          mockVectors.set(item.id, item);
        });
        return { count: items.length };
      }),
      query: jest
        .fn()
        .mockImplementation(
          async (params: {
            topK?: number;
            includeMetadata?: boolean;
            includeVectors?: boolean;
          }) => {
            // Return mock results based on topK
            const results = [];
            let count = 0;
            for (const [id, item] of mockVectors) {
              if (count >= (params.topK || 10)) break;
              results.push({
                id,
                score: 0.9 - count * 0.1,
                metadata: params.includeMetadata ? item.metadata : undefined,
                vector: params.includeVectors ? item.vector : undefined,
              });
              count++;
            }
            return results;
          },
        ),
      delete: jest.fn().mockImplementation(async (ids: string | string[]) => {
        const idArray = Array.isArray(ids) ? ids : [ids];
        idArray.forEach((id) => mockVectors.delete(id));
        return { count: idArray.length };
      }),
      fetch: jest.fn().mockImplementation(async (ids: string[]) => {
        return ids.map((id) => mockVectors.get(id) || null);
      }),
      info: jest.fn().mockResolvedValue({
        vectorCount: 100,
        dimension: 1536,
      }),
    })),
  };
});

describe('VectorClient', () => {
  let client: VectorClient;

  beforeEach(() => {
    client = new VectorClient({
      url: 'https://test.upstash.io',
      token: 'test-token',
    });
  });

  describe('constructor', () => {
    it('throws if no credentials are provided', () => {
      const originalUrl = process.env.UPSTASH_VECTOR_REST_URL;
      const originalToken = process.env.UPSTASH_VECTOR_REST_TOKEN;

      delete process.env.UPSTASH_VECTOR_REST_URL;
      delete process.env.UPSTASH_VECTOR_REST_TOKEN;

      expect(() => new VectorClient()).toThrow('Upstash Vector credentials required');

      process.env.UPSTASH_VECTOR_REST_URL = originalUrl;
      process.env.UPSTASH_VECTOR_REST_TOKEN = originalToken;
    });

    it('accepts credentials from config', () => {
      expect(
        () =>
          new VectorClient({
            url: 'https://test.upstash.io',
            token: 'test-token',
          }),
      ).not.toThrow();
    });
  });

  describe('upsert', () => {
    it('upserts a single vector document', async () => {
      const doc = {
        id: 'test-1',
        vector: new Array(1536).fill(0.5),
        metadata: {
          type: 'topic' as const,
          tenantId: 'tenant-1',
          subject: 'math',
          grade: 5,
          title: 'Test Topic',
          indexedAt: new Date().toISOString(),
        },
      };

      await expect(client.upsert(doc)).resolves.not.toThrow();
    });
  });

  describe('upsertBatch', () => {
    it('upserts multiple vector documents', async () => {
      const docs = [
        {
          id: 'batch-1',
          vector: new Array(1536).fill(0.1),
          metadata: {
            type: 'topic' as const,
            tenantId: 'tenant-1',
            subject: 'math',
            grade: 5,
            title: 'Topic 1',
            indexedAt: new Date().toISOString(),
          },
        },
        {
          id: 'batch-2',
          vector: new Array(1536).fill(0.2),
          metadata: {
            type: 'content_item' as const,
            topicId: 'batch-1',
            contentItemId: 'item-1',
            tenantId: 'tenant-1',
            subject: 'math',
            grade: 5,
            title: 'Content 1',
            indexedAt: new Date().toISOString(),
          },
        },
      ];

      await expect(client.upsertBatch(docs)).resolves.not.toThrow();
    });

    it('handles empty array', async () => {
      await expect(client.upsertBatch([])).resolves.not.toThrow();
    });
  });

  describe('query', () => {
    it('returns query results with metadata', async () => {
      const queryVector = new Array(1536).fill(0.5);
      const results = await client.query(queryVector, {
        topK: 5,
        includeMetadata: true,
      });

      expect(Array.isArray(results)).toBe(true);
      results.forEach((result) => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('metadata');
      });
    });

    it('filters by score threshold', async () => {
      const queryVector = new Array(1536).fill(0.5);
      const results = await client.query(queryVector, {
        topK: 10,
        scoreThreshold: 0.85,
      });

      results.forEach((result) => {
        expect(result.score).toBeGreaterThanOrEqual(0.85);
      });
    });
  });

  describe('delete', () => {
    it('deletes a vector by ID', async () => {
      await expect(client.delete('test-id')).resolves.not.toThrow();
    });
  });

  describe('deleteBatch', () => {
    it('deletes multiple vectors by ID', async () => {
      await expect(client.deleteBatch(['id-1', 'id-2'])).resolves.not.toThrow();
    });

    it('handles empty array', async () => {
      await expect(client.deleteBatch([])).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('returns vector index statistics', async () => {
      const stats = await client.getStats();

      expect(stats).toHaveProperty('vectorCount');
      expect(stats).toHaveProperty('dimension');
      expect(typeof stats.vectorCount).toBe('number');
      expect(typeof stats.dimension).toBe('number');
    });
  });
});

describe('ID generation helpers', () => {
  describe('generateTopicVectorId', () => {
    it('generates correct format', () => {
      expect(generateTopicVectorId('topic-123')).toBe('topic:topic-123:0');
      expect(generateTopicVectorId('topic-123', 2)).toBe('topic:topic-123:2');
    });
  });

  describe('generateContentItemVectorId', () => {
    it('generates correct format', () => {
      expect(generateContentItemVectorId('item-456')).toBe('item:item-456:0');
      expect(generateContentItemVectorId('item-456', 3)).toBe('item:item-456:3');
    });
  });
});
