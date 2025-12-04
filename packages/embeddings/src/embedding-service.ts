/**
 * OpenAI Embedding Service
 *
 * Generates embeddings using OpenAI's text-embedding-ada-002 model
 * for semantic search of curriculum content.
 */
import OpenAI from 'openai';

export interface EmbeddingConfig {
  /** OpenAI API key (defaults to OPENAI_API_KEY env var) */
  apiKey?: string;
  /** Model to use for embeddings (defaults to text-embedding-ada-002) */
  model?: string;
  /** Maximum tokens per request (for batching) */
  maxTokensPerRequest?: number;
}

export interface EmbeddingResult {
  /** The generated embedding vector */
  embedding: number[];
  /** Number of tokens used */
  tokensUsed: number;
  /** The original text that was embedded */
  text: string;
}

export interface BatchEmbeddingResult {
  /** Array of embeddings in the same order as input texts */
  embeddings: EmbeddingResult[];
  /** Total tokens used across all embeddings */
  totalTokensUsed: number;
}

const DEFAULT_MODEL = 'text-embedding-ada-002';
const ADA_002_DIMENSIONS = 1536;

/**
 * Service for generating OpenAI embeddings.
 * Uses text-embedding-ada-002 which produces 1536-dimensional vectors.
 */
export class EmbeddingService {
  private client: OpenAI;
  private model: string;
  private maxTokensPerRequest: number;

  constructor(config: EmbeddingConfig = {}) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config.',
      );
    }

    this.client = new OpenAI({ apiKey });
    this.model = config.model || DEFAULT_MODEL;
    this.maxTokensPerRequest = config.maxTokensPerRequest || 8000;
  }

  /**
   * Generate an embedding for a single text.
   */
  async embed(text: string): Promise<EmbeddingResult> {
    const cleanedText = this.preprocessText(text);

    const response = await this.client.embeddings.create({
      model: this.model,
      input: cleanedText,
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('No embedding returned from OpenAI');
    }

    return {
      embedding,
      tokensUsed: response.usage?.total_tokens || 0,
      text: cleanedText,
    };
  }

  /**
   * Generate embeddings for multiple texts in a batch.
   * More efficient than calling embed() multiple times.
   */
  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    if (texts.length === 0) {
      return { embeddings: [], totalTokensUsed: 0 };
    }

    const cleanedTexts = texts.map((t) => this.preprocessText(t));

    const response = await this.client.embeddings.create({
      model: this.model,
      input: cleanedTexts,
    });

    const embeddings: EmbeddingResult[] = response.data.map((item, index) => ({
      embedding: item.embedding,
      tokensUsed: 0, // Individual token counts not available in batch
      text: cleanedTexts[index] || '',
    }));

    return {
      embeddings,
      totalTokensUsed: response.usage?.total_tokens || 0,
    };
  }

  /**
   * Get the dimensionality of embeddings produced by the current model.
   */
  getDimensions(): number {
    // Ada-002 produces 1536-dimensional vectors
    if (this.model === DEFAULT_MODEL || this.model.includes('ada-002')) {
      return ADA_002_DIMENSIONS;
    }
    // Default for newer models may differ
    return ADA_002_DIMENSIONS;
  }

  /**
   * Preprocess text before embedding:
   * - Trim whitespace
   * - Normalize newlines
   * - Remove excessive whitespace
   */
  private preprocessText(text: string): string {
    return text.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ').slice(0, 8000); // Approximate token limit safety
  }
}

/**
 * Create a singleton embedding service instance.
 */
let embeddingServiceInstance: EmbeddingService | null = null;

export function getEmbeddingService(config?: EmbeddingConfig): EmbeddingService {
  if (!embeddingServiceInstance) {
    embeddingServiceInstance = new EmbeddingService(config);
  }
  return embeddingServiceInstance;
}

/**
 * Reset the singleton instance (useful for testing).
 */
export function resetEmbeddingService(): void {
  embeddingServiceInstance = null;
}

export { ADA_002_DIMENSIONS, DEFAULT_MODEL };
