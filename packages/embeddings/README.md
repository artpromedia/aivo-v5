# @aivo/embeddings

Vector database integration for semantic curriculum search using OpenAI embeddings and Upstash Vector.

## Features

- **OpenAI Embeddings**: Uses `text-embedding-ada-002` model (1536 dimensions)
- **Upstash Vector**: Serverless vector database that scales automatically
- **Content Chunking**: Smart text splitting for optimal embedding quality
- **Semantic Search**: Natural language queries across curriculum content

## Installation

```bash
pnpm add @aivo/embeddings
```

## Configuration

Set the following environment variables:

```bash
# OpenAI API key for embeddings
OPENAI_API_KEY=sk-...

# Upstash Vector credentials
UPSTASH_VECTOR_REST_URL=https://...upstash.io
UPSTASH_VECTOR_REST_TOKEN=...
```

## Usage

### Basic Search

```typescript
import { getCurriculumSearchService } from '@aivo/embeddings';

const searchService = getCurriculumSearchService();

// Search for content
const results = await searchService.search('fractions and decimals', {
  tenantId: 'tenant-1',
  subject: 'math',
  grade: 5,
  limit: 10,
  minScore: 0.7,
});

console.log(results);
// [
//   {
//     id: "topic-123",
//     type: "topic",
//     title: "Understanding Fractions",
//     subject: "math",
//     grade: 5,
//     score: 0.89,
//     ...
//   }
// ]
```

### Indexing Content

```typescript
// Index a curriculum topic
const result = await searchService.indexTopic({
  id: 'topic-123',
  tenantId: 'tenant-1',
  subject: 'math',
  grade: 5,
  title: 'Understanding Fractions',
  description: 'Learn how fractions represent parts of a whole...',
  standardCode: '5.NF.A.1',
});

// Index a content item
const itemResult = await searchService.indexContentItem({
  id: 'item-456',
  topicId: 'topic-123',
  tenantId: 'tenant-1',
  subject: 'math',
  grade: 5,
  title: 'Adding Fractions with Like Denominators',
  body: 'When adding fractions with the same denominator...',
  contentType: 'explanation',
});
```

### Direct Embedding Access

```typescript
import { getEmbeddingService } from '@aivo/embeddings';

const embeddingService = getEmbeddingService();

// Single embedding
const result = await embeddingService.embed('What are fractions?');
console.log(result.embedding); // [0.123, -0.456, ...]

// Batch embeddings
const batchResult = await embeddingService.embedBatch([
  'What are fractions?',
  'How do you add decimals?',
]);
```

### Text Chunking

```typescript
import { chunkText, prepareCurriculumForIndexing } from '@aivo/embeddings';

// Chunk plain text
const chunks = chunkText(longText, {
  maxChunkSize: 1000,
  overlapSize: 100,
  preserveParagraphs: true,
});

// Prepare curriculum content for indexing
const prepared = prepareCurriculumForIndexing({
  id: 'item-1',
  type: 'content_item',
  title: 'Lesson Title',
  body: 'Lesson content...',
  subject: 'math',
  grade: 5,
  tenantId: 'tenant-1',
});
```

## API Reference

### CurriculumSearchService

Main service for semantic search operations.

- `indexTopic(topic)` - Index a curriculum topic
- `indexContentItem(item)` - Index a content item
- `search(query, options)` - Semantic search
- `deleteIndex(id, type)` - Remove content from index
- `getStats()` - Get index statistics

### EmbeddingService

Low-level embedding generation.

- `embed(text)` - Generate single embedding
- `embedBatch(texts)` - Generate batch embeddings
- `getDimensions()` - Get embedding dimensions (1536 for ada-002)

### VectorClient

Low-level vector database operations.

- `upsert(doc)` - Insert or update single vector
- `upsertBatch(docs)` - Batch upsert
- `query(vector, options)` - Query similar vectors
- `delete(id)` - Delete vector
- `fetch(id)` - Fetch specific vector

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    CurriculumSearchService                   │
│  (High-level API for indexing and search)                    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌─────────────┐   ┌──────────────┐   ┌────────────┐
     │  Chunking   │   │  Embedding   │   │   Vector   │
     │  Utilities  │   │   Service    │   │   Client   │
     └─────────────┘   └──────────────┘   └────────────┘
                              │                   │
                              ▼                   ▼
                       ┌──────────┐        ┌──────────────┐
                       │  OpenAI  │        │    Upstash   │
                       │   API    │        │    Vector    │
                       └──────────┘        └──────────────┘
```

## License

MIT
