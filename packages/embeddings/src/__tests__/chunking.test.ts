/**
 * Tests for chunking utilities
 */
import {
  chunkText,
  createEmbeddingText,
  prepareCurriculumForIndexing,
  estimateTokenCount,
  isWithinTokenLimit,
  CurriculumContent,
} from '../chunking';

describe('chunkText', () => {
  it('returns empty array for empty text', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   ')).toEqual([]);
  });

  it('returns single chunk for short text', () => {
    const text = 'This is a short text.';
    const chunks = chunkText(text);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      text: 'This is a short text.',
      index: 0,
      startPos: 0,
      endPos: 21,
      totalChunks: 1,
    });
  });

  it('splits long text into multiple chunks', () => {
    // Create text longer than default maxChunkSize (1000)
    const longText = 'A'.repeat(500) + '. ' + 'B'.repeat(500) + '. ' + 'C'.repeat(500);
    const chunks = chunkText(longText);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk, i) => {
      expect(chunk.index).toBe(i);
      expect(chunk.totalChunks).toBe(chunks.length);
    });
  });

  it('respects maxChunkSize option', () => {
    const text = 'Word '.repeat(100);
    const chunks = chunkText(text, { maxChunkSize: 100 });

    chunks.forEach((chunk) => {
      expect(chunk.text.length).toBeLessThanOrEqual(100);
    });
  });

  it('preserves paragraph boundaries when possible', () => {
    const text = 'First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here.';
    const chunks = chunkText(text, {
      maxChunkSize: 50,
      preserveParagraphs: true,
      overlapSize: 0,
    });

    // Each chunk should ideally end at paragraph boundary
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('normalizes whitespace', () => {
    const text = 'Multiple   spaces\r\nand\nline breaks';
    const chunks = chunkText(text);

    expect(chunks[0]?.text).not.toContain('\r\n');
    expect(chunks[0]?.text).not.toContain('  ');
  });
});

describe('createEmbeddingText', () => {
  it('creates formatted text with context', () => {
    const content: CurriculumContent = {
      id: 'test-1',
      type: 'topic',
      title: 'Understanding Fractions',
      body: 'Fractions represent parts of a whole.',
      subject: 'math',
      grade: 5,
      tenantId: 'tenant-1',
    };

    const text = createEmbeddingText(content);

    expect(text).toContain('MATH Grade 5');
    expect(text).toContain('Title: Understanding Fractions');
    expect(text).toContain('Fractions represent parts of a whole.');
  });

  it('includes standard code when available', () => {
    const content: CurriculumContent = {
      id: 'test-2',
      type: 'content_item',
      title: 'Adding Fractions',
      body: 'To add fractions...',
      subject: 'math',
      grade: 5,
      tenantId: 'tenant-1',
      standardCode: '5.NF.A.1',
    };

    const text = createEmbeddingText(content);

    expect(text).toContain('Standard: 5.NF.A.1');
  });

  it('includes content type for items', () => {
    const content: CurriculumContent = {
      id: 'test-3',
      type: 'content_item',
      title: 'Practice Problems',
      body: '',
      subject: 'math',
      grade: 5,
      tenantId: 'tenant-1',
      contentType: 'practice',
    };

    const text = createEmbeddingText(content);

    expect(text).toContain('Type: practice');
  });
});

describe('prepareCurriculumForIndexing', () => {
  it('returns chunks ready for embedding', () => {
    const content: CurriculumContent = {
      id: 'test-1',
      type: 'topic',
      title: 'Test Topic',
      body: 'Short body',
      subject: 'ela',
      grade: 3,
      tenantId: 'tenant-1',
    };

    const prepared = prepareCurriculumForIndexing(content);

    expect(prepared.length).toBeGreaterThan(0);
    prepared.forEach((item) => {
      expect(item).toHaveProperty('text');
      expect(item).toHaveProperty('chunkIndex');
      expect(item).toHaveProperty('totalChunks');
      expect(typeof item.text).toBe('string');
      expect(typeof item.chunkIndex).toBe('number');
      expect(typeof item.totalChunks).toBe('number');
    });
  });
});

describe('estimateTokenCount', () => {
  it('estimates tokens for English text', () => {
    // Roughly 4 characters per token for English
    const text = 'This is a test sentence for estimating tokens.';
    const estimate = estimateTokenCount(text);

    // Should be approximately text.length / 4
    expect(estimate).toBeGreaterThan(0);
    expect(estimate).toBeLessThan(text.length);
  });

  it('returns 0 for empty string', () => {
    expect(estimateTokenCount('')).toBe(0);
  });
});

describe('isWithinTokenLimit', () => {
  it('returns true for text within limit', () => {
    const shortText = 'Hello world';
    expect(isWithinTokenLimit(shortText, 8191)).toBe(true);
  });

  it('returns false for text exceeding limit', () => {
    // Create text that would exceed token limit
    const longText = 'A'.repeat(40000); // ~10k tokens
    expect(isWithinTokenLimit(longText, 8191)).toBe(false);
  });

  it('uses default limit of 8191', () => {
    const shortText = 'Short text';
    expect(isWithinTokenLimit(shortText)).toBe(true);
  });
});
