/**
 * Curriculum Search Service
 *
 * High-level service for semantic search of curriculum content.
 * Combines embedding generation and vector operations.
 */
import { EmbeddingService, getEmbeddingService } from './embedding-service';
import {
  VectorClient,
  getVectorClient,
  VectorQueryOptions,
  generateTopicVectorId,
  generateContentItemVectorId,
} from './vector-client';
import { CurriculumContent, prepareCurriculumForIndexing, ChunkOptions } from './chunking';

export interface SearchResult {
  /** ID of the matching content */
  id: string;
  /** Type of content */
  type: 'topic' | 'content_item';
  /** Topic ID (for content items) */
  topicId?: string;
  /** Content item ID (if applicable) */
  contentItemId?: string;
  /** Subject */
  subject: string;
  /** Grade level */
  grade: number;
  /** Title of the content */
  title: string;
  /** Preview of the body text */
  bodyPreview?: string;
  /** Content type (for items) */
  contentType?: string;
  /** Standard code */
  standardCode?: string;
  /** Similarity score (0-1) */
  score: number;
  /** Chunk index if multiple chunks */
  chunkIndex?: number;
}

export interface SearchOptions {
  /** Number of results to return (default: 10) */
  limit?: number;
  /** Minimum similarity score (0-1, default: 0.7) */
  minScore?: number;
  /** Filter by tenant */
  tenantId?: string;
  /** Filter by subject */
  subject?: string;
  /** Filter by grade */
  grade?: number;
  /** Filter by content type */
  contentType?: 'topic' | 'content_item';
}

export interface IndexingResult {
  /** Content ID that was indexed */
  id: string;
  /** Number of chunks indexed */
  chunksIndexed: number;
  /** Total tokens used for embedding */
  tokensUsed: number;
  /** Whether indexing was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * High-level service for curriculum semantic search.
 */
export class CurriculumSearchService {
  private embeddingService: EmbeddingService;
  private vectorClient: VectorClient;
  private chunkOptions: ChunkOptions;

  constructor(
    embeddingService?: EmbeddingService,
    vectorClient?: VectorClient,
    chunkOptions: ChunkOptions = {},
  ) {
    this.embeddingService = embeddingService || getEmbeddingService();
    this.vectorClient = vectorClient || getVectorClient();
    this.chunkOptions = {
      maxChunkSize: 1000,
      overlapSize: 100,
      preserveParagraphs: true,
      preserveSentences: true,
      ...chunkOptions,
    };
  }

  /**
   * Index a curriculum topic for semantic search.
   */
  async indexTopic(topic: {
    id: string;
    tenantId: string;
    subject: string;
    grade: number;
    title: string;
    description?: string;
    standardCode?: string;
  }): Promise<IndexingResult> {
    try {
      const content: CurriculumContent = {
        id: topic.id,
        type: 'topic',
        title: topic.title,
        body: topic.description || '',
        subject: topic.subject,
        grade: topic.grade,
        tenantId: topic.tenantId,
        standardCode: topic.standardCode,
      };

      const chunks = prepareCurriculumForIndexing(content, this.chunkOptions);

      if (chunks.length === 0) {
        return {
          id: topic.id,
          chunksIndexed: 0,
          tokensUsed: 0,
          success: true,
        };
      }

      // Generate embeddings for all chunks
      const embedResult = await this.embeddingService.embedBatch(chunks.map((c) => c.text));

      // Prepare vector documents
      const docs = chunks.map((chunk, i) => ({
        id: generateTopicVectorId(topic.id, chunk.chunkIndex),
        vector: embedResult.embeddings[i]!.embedding,
        metadata: {
          type: 'topic' as const,
          topicId: topic.id,
          tenantId: topic.tenantId,
          subject: topic.subject,
          grade: topic.grade,
          title: topic.title,
          bodyPreview: (topic.description || '').slice(0, 500),
          standardCode: topic.standardCode,
          indexedAt: new Date().toISOString(),
        },
      }));

      // Upsert to vector database
      await this.vectorClient.upsertBatch(docs);

      return {
        id: topic.id,
        chunksIndexed: chunks.length,
        tokensUsed: embedResult.totalTokensUsed,
        success: true,
      };
    } catch (error) {
      return {
        id: topic.id,
        chunksIndexed: 0,
        tokensUsed: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Index a content item for semantic search.
   */
  async indexContentItem(item: {
    id: string;
    topicId: string;
    tenantId: string;
    subject: string;
    grade: number;
    title: string;
    body?: string;
    contentType?: string;
    standardCode?: string;
  }): Promise<IndexingResult> {
    try {
      const content: CurriculumContent = {
        id: item.id,
        type: 'content_item',
        title: item.title,
        body: item.body || '',
        subject: item.subject,
        grade: item.grade,
        tenantId: item.tenantId,
        topicId: item.topicId,
        contentType: item.contentType,
        standardCode: item.standardCode,
      };

      const chunks = prepareCurriculumForIndexing(content, this.chunkOptions);

      if (chunks.length === 0) {
        return {
          id: item.id,
          chunksIndexed: 0,
          tokensUsed: 0,
          success: true,
        };
      }

      // Generate embeddings for all chunks
      const embedResult = await this.embeddingService.embedBatch(chunks.map((c) => c.text));

      // Prepare vector documents
      const docs = chunks.map((chunk, i) => ({
        id: generateContentItemVectorId(item.id, chunk.chunkIndex),
        vector: embedResult.embeddings[i]!.embedding,
        metadata: {
          type: 'content_item' as const,
          topicId: item.topicId,
          contentItemId: item.id,
          tenantId: item.tenantId,
          subject: item.subject,
          grade: item.grade,
          title: item.title,
          bodyPreview: (item.body || '').slice(0, 500),
          contentType: item.contentType,
          standardCode: item.standardCode,
          indexedAt: new Date().toISOString(),
        },
      }));

      // Upsert to vector database
      await this.vectorClient.upsertBatch(docs);

      return {
        id: item.id,
        chunksIndexed: chunks.length,
        tokensUsed: embedResult.totalTokensUsed,
        success: true,
      };
    } catch (error) {
      return {
        id: item.id,
        chunksIndexed: 0,
        tokensUsed: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Search for curriculum content semantically.
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 10, minScore = 0.7 } = options;

    // Generate embedding for the query
    const queryEmbedding = await this.embeddingService.embed(query);

    // Query vector database
    const vectorOptions: VectorQueryOptions = {
      topK: limit * 2, // Get more to dedupe chunks
      scoreThreshold: minScore,
      tenantId: options.tenantId,
      subject: options.subject,
      grade: options.grade,
      type: options.contentType,
      includeMetadata: true,
    };

    const results = await this.vectorClient.query(queryEmbedding.embedding, vectorOptions);

    // Deduplicate results from multiple chunks of same content
    const seenIds = new Set<string>();
    const dedupedResults: SearchResult[] = [];

    for (const result of results) {
      const contentId =
        result.metadata.type === 'topic'
          ? result.metadata.topicId!
          : result.metadata.contentItemId!;

      if (seenIds.has(contentId)) {
        continue;
      }
      seenIds.add(contentId);

      // Extract chunk index from vector ID
      const idParts = result.id.split(':');
      const chunkIndex = parseInt(idParts[2] || '0', 10);

      dedupedResults.push({
        id: contentId,
        type: result.metadata.type,
        topicId: result.metadata.topicId,
        contentItemId: result.metadata.contentItemId,
        subject: result.metadata.subject,
        grade: result.metadata.grade,
        title: result.metadata.title,
        bodyPreview: result.metadata.bodyPreview,
        contentType: result.metadata.contentType,
        standardCode: result.metadata.standardCode,
        score: result.score,
        chunkIndex,
      });

      if (dedupedResults.length >= limit) {
        break;
      }
    }

    return dedupedResults;
  }

  /**
   * Delete indexed content.
   */
  async deleteIndex(id: string, type: 'topic' | 'content_item'): Promise<void> {
    await this.vectorClient.deleteByContentId(id, type);
  }

  /**
   * Get statistics about the vector index.
   */
  async getStats(): Promise<{ vectorCount: number; dimension: number }> {
    return this.vectorClient.getStats();
  }
}

/**
 * Singleton instance.
 */
let searchServiceInstance: CurriculumSearchService | null = null;

export function getCurriculumSearchService(): CurriculumSearchService {
  if (!searchServiceInstance) {
    searchServiceInstance = new CurriculumSearchService();
  }
  return searchServiceInstance;
}

export function resetCurriculumSearchService(): void {
  searchServiceInstance = null;
}
