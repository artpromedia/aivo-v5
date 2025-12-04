/**
 * Tests for curriculum search service
 */
import { CurriculumSearchService } from '../search-service';
import { EmbeddingService } from '../embedding-service';
import { VectorClient } from '../vector-client';

// Mock dependencies
const mockEmbeddingService = {
  embed: jest.fn().mockResolvedValue({
    embedding: new Array(1536).fill(0.5),
    tokensUsed: 10,
    text: 'test query',
  }),
  embedBatch: jest.fn().mockImplementation(async (texts: string[]) => ({
    embeddings: texts.map((text) => ({
      embedding: new Array(1536).fill(0.5),
      tokensUsed: 10,
      text,
    })),
    totalTokensUsed: texts.length * 10,
  })),
  getDimensions: jest.fn().mockReturnValue(1536),
} as unknown as EmbeddingService;

const mockVectorClient = {
  upsert: jest.fn().mockResolvedValue(undefined),
  upsertBatch: jest.fn().mockResolvedValue(undefined),
  query: jest.fn().mockResolvedValue([
    {
      id: 'topic:topic-1:0',
      score: 0.92,
      metadata: {
        type: 'topic',
        topicId: 'topic-1',
        tenantId: 'tenant-1',
        subject: 'math',
        grade: 5,
        title: 'Understanding Fractions',
        bodyPreview: 'Fractions represent parts of a whole...',
        indexedAt: new Date().toISOString(),
      },
    },
    {
      id: 'item:item-1:0',
      score: 0.85,
      metadata: {
        type: 'content_item',
        topicId: 'topic-1',
        contentItemId: 'item-1',
        tenantId: 'tenant-1',
        subject: 'math',
        grade: 5,
        title: 'Adding Fractions',
        bodyPreview: 'To add fractions with like denominators...',
        contentType: 'explanation',
        indexedAt: new Date().toISOString(),
      },
    },
  ]),
  delete: jest.fn().mockResolvedValue(undefined),
  deleteBatch: jest.fn().mockResolvedValue(undefined),
  deleteByContentId: jest.fn().mockResolvedValue(undefined),
  getStats: jest.fn().mockResolvedValue({ vectorCount: 100, dimension: 1536 }),
  fetch: jest.fn().mockResolvedValue(null),
} as unknown as VectorClient;

describe('CurriculumSearchService', () => {
  let service: CurriculumSearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CurriculumSearchService(mockEmbeddingService, mockVectorClient);
  });

  describe('indexTopic', () => {
    it('indexes a curriculum topic successfully', async () => {
      const result = await service.indexTopic({
        id: 'topic-1',
        tenantId: 'tenant-1',
        subject: 'math',
        grade: 5,
        title: 'Understanding Fractions',
        description: 'Fractions represent parts of a whole.',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('topic-1');
      expect(result.chunksIndexed).toBeGreaterThan(0);
      expect(mockEmbeddingService.embedBatch).toHaveBeenCalled();
      expect(mockVectorClient.upsertBatch).toHaveBeenCalled();
    });

    it('handles indexing errors gracefully', async () => {
      mockEmbeddingService.embedBatch = jest.fn().mockRejectedValue(new Error('API Error'));

      const result = await service.indexTopic({
        id: 'topic-2',
        tenantId: 'tenant-1',
        subject: 'math',
        grade: 5,
        title: 'Test Topic',
        description: 'Test description',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('indexContentItem', () => {
    beforeEach(() => {
      // Reset mock
      mockEmbeddingService.embedBatch = jest.fn().mockImplementation(async (texts: string[]) => ({
        embeddings: texts.map((text) => ({
          embedding: new Array(1536).fill(0.5),
          tokensUsed: 10,
          text,
        })),
        totalTokensUsed: texts.length * 10,
      }));
    });

    it('indexes a content item successfully', async () => {
      const result = await service.indexContentItem({
        id: 'item-1',
        topicId: 'topic-1',
        tenantId: 'tenant-1',
        subject: 'math',
        grade: 5,
        title: 'Adding Fractions',
        body: 'To add fractions with like denominators, add the numerators.',
        contentType: 'explanation',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('item-1');
      expect(result.chunksIndexed).toBeGreaterThan(0);
    });

    it('includes content type in metadata', async () => {
      await service.indexContentItem({
        id: 'item-2',
        topicId: 'topic-1',
        tenantId: 'tenant-1',
        subject: 'math',
        grade: 5,
        title: 'Practice Problems',
        body: 'Solve these fraction problems.',
        contentType: 'practice',
      });

      const upsertCall = (mockVectorClient.upsertBatch as jest.Mock).mock.calls[0][0];
      expect(upsertCall[0].metadata.contentType).toBe('practice');
    });
  });

  describe('search', () => {
    it('returns search results for a query', async () => {
      const results = await service.search('fractions', {
        tenantId: 'tenant-1',
        limit: 10,
        minScore: 0.7,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(mockEmbeddingService.embed).toHaveBeenCalledWith('fractions');
      expect(mockVectorClient.query).toHaveBeenCalled();
    });

    it('deduplicates results from multiple chunks', async () => {
      // Mock returns two results for same topic (different chunks)
      mockVectorClient.query = jest.fn().mockResolvedValue([
        {
          id: 'topic:topic-1:0',
          score: 0.92,
          metadata: {
            type: 'topic',
            topicId: 'topic-1',
            tenantId: 'tenant-1',
            subject: 'math',
            grade: 5,
            title: 'Topic 1',
            indexedAt: new Date().toISOString(),
          },
        },
        {
          id: 'topic:topic-1:1',
          score: 0.88,
          metadata: {
            type: 'topic',
            topicId: 'topic-1',
            tenantId: 'tenant-1',
            subject: 'math',
            grade: 5,
            title: 'Topic 1',
            indexedAt: new Date().toISOString(),
          },
        },
      ]);

      const results = await service.search('test query');

      // Should only return one result for topic-1
      expect(results.length).toBe(1);
      expect(results[0]?.id).toBe('topic-1');
    });

    it('includes all result metadata', async () => {
      const results = await service.search('fractions');

      const result = results[0];
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('score');
    });
  });

  describe('getStats', () => {
    it('returns vector index statistics', async () => {
      const stats = await service.getStats();

      expect(stats.vectorCount).toBe(100);
      expect(stats.dimension).toBe(1536);
    });
  });
});
