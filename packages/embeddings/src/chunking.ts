/**
 * Chunking Utilities
 *
 * Utilities for splitting curriculum content into chunks suitable
 * for embedding and semantic search.
 */

export interface ChunkOptions {
  /** Maximum characters per chunk (default: 1000) */
  maxChunkSize?: number;
  /** Number of characters to overlap between chunks (default: 100) */
  overlapSize?: number;
  /** Preserve paragraph boundaries when possible */
  preserveParagraphs?: boolean;
  /** Preserve sentence boundaries when possible */
  preserveSentences?: boolean;
}

export interface ContentChunk {
  /** The chunk text */
  text: string;
  /** Index of this chunk (0-based) */
  index: number;
  /** Starting character position in original text */
  startPos: number;
  /** Ending character position in original text */
  endPos: number;
  /** Total number of chunks from the source */
  totalChunks: number;
}

export interface CurriculumContent {
  /** Content ID (topic or item ID) */
  id: string;
  /** Type of content */
  type: 'topic' | 'content_item';
  /** Title */
  title: string;
  /** Description or body text */
  body: string;
  /** Subject */
  subject: string;
  /** Grade level */
  grade: number;
  /** Tenant ID */
  tenantId: string;
  /** Topic ID (for content items) */
  topicId?: string;
  /** Content type (for content items) */
  contentType?: string;
  /** Standard code */
  standardCode?: string;
}

const DEFAULT_MAX_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP_SIZE = 100;

/**
 * Split text into chunks with configurable size and overlap.
 */
export function chunkText(text: string, options: ChunkOptions = {}): ContentChunk[] {
  const {
    maxChunkSize = DEFAULT_MAX_CHUNK_SIZE,
    overlapSize = DEFAULT_OVERLAP_SIZE,
    preserveParagraphs = true,
    preserveSentences = true,
  } = options;

  // Normalize whitespace
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (!normalizedText) {
    return [];
  }

  // If text fits in one chunk, return it as-is
  if (normalizedText.length <= maxChunkSize) {
    return [
      {
        text: normalizedText,
        index: 0,
        startPos: 0,
        endPos: normalizedText.length,
        totalChunks: 1,
      },
    ];
  }

  const chunks: ContentChunk[] = [];
  let currentPos = 0;

  while (currentPos < normalizedText.length) {
    let endPos = Math.min(currentPos + maxChunkSize, normalizedText.length);

    // If we're not at the end, try to find a good break point
    if (endPos < normalizedText.length) {
      const searchStart = Math.max(currentPos, endPos - 200);
      const searchText = normalizedText.slice(searchStart, endPos);

      // Try to break at paragraph boundary first
      if (preserveParagraphs) {
        const paragraphBreak = findLastOccurrence(searchText, '\n\n');
        if (paragraphBreak !== -1 && paragraphBreak > 50) {
          endPos = searchStart + paragraphBreak + 2; // Include the newlines
        }
      }

      // If no paragraph break, try sentence boundary
      if (preserveSentences && endPos === currentPos + maxChunkSize) {
        const sentenceBreak = findLastSentenceEnd(searchText);
        if (sentenceBreak !== -1 && sentenceBreak > 50) {
          endPos = searchStart + sentenceBreak + 1;
        }
      }
    }

    const chunkText = normalizedText.slice(currentPos, endPos).trim();

    if (chunkText) {
      chunks.push({
        text: chunkText,
        index: chunks.length,
        startPos: currentPos,
        endPos,
        totalChunks: 0, // Will be updated after all chunks are created
      });
    }

    // Move position forward, accounting for overlap
    currentPos = endPos - overlapSize;
    if (currentPos <= chunks[chunks.length - 1]?.startPos) {
      // Prevent infinite loop
      currentPos = endPos;
    }
  }

  // Update totalChunks in all chunks
  const totalChunks = chunks.length;
  return chunks.map((chunk) => ({ ...chunk, totalChunks }));
}

/**
 * Find the last occurrence of a substring.
 */
function findLastOccurrence(text: string, search: string): number {
  return text.lastIndexOf(search);
}

/**
 * Find the last sentence-ending punctuation followed by space or end.
 */
function findLastSentenceEnd(text: string): number {
  const sentenceEnders = /[.!?](?:\s|$)/g;
  let lastMatch = -1;
  let match: RegExpExecArray | null;

  while ((match = sentenceEnders.exec(text)) !== null) {
    lastMatch = match.index;
  }

  return lastMatch;
}

/**
 * Create text representation of curriculum content for embedding.
 * Combines title, subject, grade context, and body.
 */
export function createEmbeddingText(content: CurriculumContent): string {
  const parts: string[] = [];

  // Add contextual prefix
  parts.push(`${content.subject.toUpperCase()} Grade ${content.grade}`);

  if (content.standardCode) {
    parts.push(`Standard: ${content.standardCode}`);
  }

  // Add title
  parts.push(`Title: ${content.title}`);

  // Add content type if available
  if (content.contentType) {
    parts.push(`Type: ${content.contentType}`);
  }

  // Add body
  if (content.body) {
    parts.push('');
    parts.push(content.body);
  }

  return parts.join('\n');
}

/**
 * Prepare curriculum content for vector indexing.
 * Returns array of texts ready for embedding.
 */
export function prepareCurriculumForIndexing(
  content: CurriculumContent,
  options: ChunkOptions = {},
): Array<{ text: string; chunkIndex: number; totalChunks: number }> {
  const fullText = createEmbeddingText(content);
  const chunks = chunkText(fullText, options);

  return chunks.map((chunk) => ({
    text: chunk.text,
    chunkIndex: chunk.index,
    totalChunks: chunk.totalChunks,
  }));
}

/**
 * Estimate token count for a text (rough approximation).
 * OpenAI generally uses ~4 characters per token for English text.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if text is within token limits for embedding.
 */
export function isWithinTokenLimit(text: string, limit = 8191): boolean {
  return estimateTokenCount(text) <= limit;
}
