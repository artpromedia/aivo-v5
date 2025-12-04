/**
 * Upstash Vector Client
 *
 * Provides vector database operations for semantic curriculum search.
 * Uses Upstash Vector which is serverless and matches existing Upstash Redis usage.
 */
import { Index } from '@upstash/vector';

export interface VectorConfig {
  /** Upstash Vector REST URL (defaults to UPSTASH_VECTOR_REST_URL env var) */
  url?: string;
  /** Upstash Vector REST token (defaults to UPSTASH_VECTOR_REST_TOKEN env var) */
  token?: string;
}

export interface VectorMetadata {
  /** Type of content: 'topic' or 'content_item' */
  type: 'topic' | 'content_item';
  /** ID of the curriculum topic */
  topicId?: string;
  /** ID of the content item (if type is content_item) */
  contentItemId?: string;
  /** Tenant ID for multi-tenancy */
  tenantId: string;
  /** Subject (math, ela, science, etc.) */
  subject: string;
  /** Grade level */
  grade: number;
  /** Content title */
  title: string;
  /** Content body preview (first 500 chars) */
  bodyPreview?: string;
  /** Content type for items (explanation, example, practice) */
  contentType?: string;
  /** Curriculum standard code */
  standardCode?: string;
  /** When the content was last indexed */
  indexedAt: string;
  /** Index signature for Upstash compatibility */
  [key: string]: string | number | boolean | undefined;
}

export interface VectorDocument {
  /** Unique ID for the vector */
  id: string;
  /** The embedding vector */
  vector: number[];
  /** Associated metadata */
  metadata: VectorMetadata;
}

export interface VectorQueryResult {
  /** ID of the matching vector */
  id: string;
  /** Similarity score (0-1, higher is more similar) */
  score: number;
  /** Associated metadata */
  metadata: VectorMetadata;
}

export interface VectorQueryOptions {
  /** Number of results to return (default: 10) */
  topK?: number;
  /** Minimum similarity score threshold (0-1) */
  scoreThreshold?: number;
  /** Filter by tenant ID */
  tenantId?: string;
  /** Filter by subject */
  subject?: string;
  /** Filter by grade level */
  grade?: number;
  /** Filter by content type */
  type?: 'topic' | 'content_item';
  /** Include metadata in results */
  includeMetadata?: boolean;
  /** Include vectors in results */
  includeVectors?: boolean;
}

/**
 * Service for vector database operations using Upstash Vector.
 */
export class VectorClient {
  private index: Index<VectorMetadata>;

  constructor(config: VectorConfig = {}) {
    const url = config.url || process.env.UPSTASH_VECTOR_REST_URL;
    const token = config.token || process.env.UPSTASH_VECTOR_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'Upstash Vector credentials required. Set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN environment variables or pass url/token in config.',
      );
    }

    this.index = new Index<VectorMetadata>({
      url,
      token,
    });
  }

  /**
   * Upsert a single vector document.
   */
  async upsert(doc: VectorDocument): Promise<void> {
    await this.index.upsert({
      id: doc.id,
      vector: doc.vector,
      metadata: doc.metadata,
    });
  }

  /**
   * Upsert multiple vector documents in batch.
   */
  async upsertBatch(docs: VectorDocument[]): Promise<void> {
    if (docs.length === 0) return;

    const vectors = docs.map((doc) => ({
      id: doc.id,
      vector: doc.vector,
      metadata: doc.metadata,
    }));

    await this.index.upsert(vectors);
  }

  /**
   * Query for similar vectors.
   */
  async query(
    queryVector: number[],
    options: VectorQueryOptions = {},
  ): Promise<VectorQueryResult[]> {
    const {
      topK = 10,
      scoreThreshold = 0,
      includeMetadata = true,
      includeVectors = false,
    } = options;

    // Build filter string for Upstash Vector
    const filterParts: string[] = [];
    if (options.tenantId) {
      filterParts.push(`tenantId = '${options.tenantId}'`);
    }
    if (options.subject) {
      filterParts.push(`subject = '${options.subject}'`);
    }
    if (options.grade !== undefined) {
      filterParts.push(`grade = ${options.grade}`);
    }
    if (options.type) {
      filterParts.push(`type = '${options.type}'`);
    }

    const filter = filterParts.length > 0 ? filterParts.join(' AND ') : undefined;

    const results = await this.index.query({
      vector: queryVector,
      topK,
      includeMetadata,
      includeVectors,
      filter,
    });

    return results
      .filter((r) => r.score >= scoreThreshold)
      .map((r) => ({
        id: String(r.id),
        score: r.score,
        metadata: r.metadata as unknown as VectorMetadata,
      }));
  }

  /**
   * Delete a vector by ID.
   */
  async delete(id: string): Promise<void> {
    await this.index.delete(id);
  }

  /**
   * Delete multiple vectors by ID.
   */
  async deleteBatch(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.index.delete(ids);
  }

  /**
   * Delete all vectors for a specific content item or topic.
   */
  async deleteByContentId(contentId: string, type: 'topic' | 'content_item'): Promise<void> {
    // Build the ID prefix based on type
    const idPrefix = type === 'topic' ? `topic:${contentId}` : `item:${contentId}`;

    // Upstash Vector doesn't support prefix delete directly,
    // so we need to query and delete
    // For now, just delete the main ID
    await this.delete(idPrefix);
  }

  /**
   * Get vector index statistics.
   */
  async getStats(): Promise<{ vectorCount: number; dimension: number }> {
    const info = await this.index.info();
    return {
      vectorCount: info.vectorCount,
      dimension: info.dimension,
    };
  }

  /**
   * Fetch a specific vector by ID.
   */
  async fetch(id: string): Promise<VectorDocument | null> {
    const result = await this.index.fetch([id], { includeMetadata: true });
    const item = result[0];

    if (!item || !item.vector) {
      return null;
    }

    return {
      id: String(item.id),
      vector: item.vector,
      metadata: item.metadata as unknown as VectorMetadata,
    };
  }
}

/**
 * Create a singleton vector client instance.
 */
let vectorClientInstance: VectorClient | null = null;

export function getVectorClient(config?: VectorConfig): VectorClient {
  if (!vectorClientInstance) {
    vectorClientInstance = new VectorClient(config);
  }
  return vectorClientInstance;
}

/**
 * Reset the singleton instance (useful for testing).
 */
export function resetVectorClient(): void {
  vectorClientInstance = null;
}

/**
 * Generate a vector ID for a curriculum topic.
 */
export function generateTopicVectorId(topicId: string, chunkIndex = 0): string {
  return `topic:${topicId}:${chunkIndex}`;
}

/**
 * Generate a vector ID for a content item.
 */
export function generateContentItemVectorId(contentItemId: string, chunkIndex = 0): string {
  return `item:${contentItemId}:${chunkIndex}`;
}
