# @aivo/validation

Request validation package for AIVO v5 educational platform.

## Features

- **Zod-based validation**: Type-safe schema validation
- **Next.js middleware**: Request body and query validation
- **Domain schemas**: Pre-built schemas for all AIVO entities
- **Sanitization**: XSS prevention and input sanitization
- **Type inference**: Auto-generated TypeScript types

## Installation

```bash
pnpm add @aivo/validation
```

## Usage

### Basic Validation

```typescript
import { createValidator } from '@aivo/validation';
import { createHomeworkSessionSchema } from '@aivo/validation/schemas/homework';

const validator = createValidator(createHomeworkSessionSchema);

const result = validator.validate(requestBody);
if (!result.success) {
  console.error(result.errors);
}
```

### API Route Middleware

```typescript
import { NextResponse } from 'next/server';
import { withValidation } from '@aivo/validation';
import { createHomeworkSessionSchema } from '@aivo/validation/schemas/homework';

export const POST = withValidation(
  createHomeworkSessionSchema,
  async (request, validatedBody) => {
    // validatedBody is fully typed!
    const session = await createSession(validatedBody);
    return NextResponse.json(session);
  },
  NextResponse
);
```

### Query Parameter Validation

```typescript
import { withQueryValidation } from '@aivo/validation';
import { listHomeworkSessionsSchema } from '@aivo/validation/schemas/homework';

export const GET = withQueryValidation(
  listHomeworkSessionsSchema,
  async (request, validatedQuery) => {
    const { learnerId, limit, offset } = validatedQuery;
    // ...
  },
  NextResponse
);
```

### Input Sanitization

```typescript
import { sanitizeHtml, sanitizeString, sanitizedString } from '@aivo/validation';
import { z } from 'zod';

// Direct sanitization
const clean = sanitizeHtml(userInput);

// In Zod schema
const schema = z.object({
  title: sanitizedString,
  content: z.string().transform(sanitizeHtml),
});
```

## Available Schemas

### Common
- `paginationSchema` - Limit/offset pagination
- `dateRangeSchema` - Start/end date validation
- `sortSchema` - Sort parameters
- `emailSchema`, `passwordSchema`, `usernameSchema`

### Authentication (`@aivo/validation/schemas/auth`)
- `loginSchema`
- `registerSchema`
- `forgotPasswordSchema`
- `resetPasswordSchema`
- `changePasswordSchema`

### Homework (`@aivo/validation/schemas/homework`)
- `createHomeworkSessionSchema`
- `updateHomeworkStepSchema`
- `homeworkHintRequestSchema`
- `listHomeworkSessionsSchema`

### Assessment (`@aivo/validation/schemas/assessment`)
- `startAssessmentSchema`
- `submitAssessmentAnswerSchema`
- `completeAssessmentSchema`
- `createAssessmentSchema`

### Regulation (`@aivo/validation/schemas/regulation`)
- `submitMoodCheckinSchema`
- `startActivitySchema`
- `startFocusSessionSchema`
- `createJournalEntrySchema`

### Learner (`@aivo/validation/schemas/learner`)
- `createLearnerSchema`
- `updateLearnerSchema`
- `updateLearnerPreferencesSchema`
- `linkLearnerSchema`

### Upload (`@aivo/validation/schemas/upload`)
- `imageUploadSchema`
- `audioUploadSchema`
- `documentUploadSchema`
- `presignedUrlRequestSchema`

## Error Response Format

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address",
      "code": "invalid_string"
    }
  ],
  "requestId": "req-123"
}
```
