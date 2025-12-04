/**
 * @aivo/embeddings
 *
 * Vector database integration for semantic curriculum search.
 * Uses OpenAI ada-002 embeddings with Upstash Vector storage.
 */

// Embedding service
export {
  EmbeddingService,
  getEmbeddingService,
  resetEmbeddingService,
  ADA_002_DIMENSIONS,
  DEFAULT_MODEL,
  type EmbeddingConfig,
  type EmbeddingResult,
  type BatchEmbeddingResult,
} from './embedding-service';

// Vector client
export {
  VectorClient,
  getVectorClient,
  resetVectorClient,
  generateTopicVectorId,
  generateContentItemVectorId,
  type VectorConfig,
  type VectorMetadata,
  type VectorDocument,
  type VectorQueryResult,
  type VectorQueryOptions,
} from './vector-client';

// Chunking utilities
export {
  chunkText,
  createEmbeddingText,
  prepareCurriculumForIndexing,
  estimateTokenCount,
  isWithinTokenLimit,
  type ChunkOptions,
  type ContentChunk,
  type CurriculumContent,
} from './chunking';

// High-level search service
export {
  CurriculumSearchService,
  getCurriculumSearchService,
  resetCurriculumSearchService,
  type SearchResult,
  type SearchOptions,
  type IndexingResult,
} from './search-service';
