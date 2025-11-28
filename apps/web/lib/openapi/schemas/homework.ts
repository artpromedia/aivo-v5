import { registry, z } from '../config';

// =============================================================================
// Homework Session Schemas
// =============================================================================

export const HomeworkSessionSchema = registry.register(
  'HomeworkSession',
  z.object({
    id: z.string().cuid().openapi({ description: 'Session ID', example: 'clx123abc...' }),
    learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    title: z.string().openapi({ description: 'Session title', example: 'Math Homework Chapter 5' }),
    subject: z.enum(['MATH', 'READING', 'WRITING', 'SCIENCE', 'SOCIAL_STUDIES']).nullable().openapi({
      description: 'Subject area',
      example: 'MATH',
    }),
    gradeLevel: z.number().int().min(1).max(12).nullable().openapi({ description: 'Grade level', example: 5 }),
    currentStep: z.enum(['UNDERSTAND', 'PLAN', 'SOLVE', 'CHECK']).openapi({
      description: 'Current problem-solving step',
      example: 'UNDERSTAND',
    }),
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']).openapi({
      description: 'Session status',
      example: 'IN_PROGRESS',
    }),
    hintsUsed: z.number().int().openapi({ description: 'Number of hints used', example: 2 }),
    difficultyMode: z.enum(['SCAFFOLDED', 'STANDARD', 'CHALLENGE']).openapi({
      description: 'Difficulty scaffolding mode',
      example: 'SCAFFOLDED',
    }),
    parentAssistMode: z.boolean().openapi({ description: 'Parent assistance mode enabled', example: false }),
    createdAt: z.string().datetime().openapi({ description: 'Creation timestamp' }),
    updatedAt: z.string().datetime().openapi({ description: 'Last update timestamp' }),
    completedAt: z.string().datetime().nullable().openapi({ description: 'Completion timestamp' }),
  })
);

export const HomeworkMessageSchema = registry.register(
  'HomeworkMessage',
  z.object({
    id: z.string().cuid().openapi({ description: 'Message ID' }),
    sessionId: z.string().cuid().openapi({ description: 'Session ID' }),
    role: z.enum(['user', 'assistant', 'system']).openapi({ description: 'Message sender role' }),
    content: z.string().openapi({ description: 'Message content' }),
    messageType: z.enum(['QUESTION', 'HINT', 'EXPLANATION', 'ENCOURAGEMENT', 'STEP_GUIDANCE']).nullable().openapi({
      description: 'Type of assistant message',
    }),
    createdAt: z.string().datetime().openapi({ description: 'Message timestamp' }),
  })
);

// =============================================================================
// Request Schemas
// =============================================================================

export const CreateHomeworkSessionSchema = registry.register(
  'CreateHomeworkSession',
  z.object({
    learnerId: z.string().cuid().openapi({ description: 'The learner ID', example: 'clx123abc...' }),
    title: z.string().min(1).max(200).openapi({ description: 'Session title', example: 'Math Homework Chapter 5' }),
    subject: z.enum(['MATH', 'READING', 'WRITING', 'SCIENCE', 'SOCIAL_STUDIES']).optional().openapi({
      description: 'Subject area',
    }),
    gradeLevel: z.number().int().min(1).max(12).optional().openapi({ description: 'Grade level', example: 5 }),
    difficultyMode: z.enum(['SCAFFOLDED', 'STANDARD', 'CHALLENGE']).default('SCAFFOLDED').openapi({
      description: 'Difficulty scaffolding mode',
    }),
    parentAssistMode: z.boolean().default(false).openapi({ description: 'Enable parent assistance mode' }),
    initialQuestion: z.string().optional().openapi({
      description: 'Initial homework question to start with',
      example: 'How do I solve 3x + 5 = 14?',
    }),
  })
);

export const SendHomeworkMessageSchema = registry.register(
  'SendHomeworkMessage',
  z.object({
    content: z.string().min(1).max(4000).openapi({
      description: 'Message content',
      example: 'I don\'t understand how to start this problem',
    }),
    requestHint: z.boolean().default(false).openapi({
      description: 'Explicitly request a hint',
    }),
    uploadedImageUrl: z.string().url().optional().openapi({
      description: 'URL of uploaded homework image',
    }),
  })
);

export const UpdateHomeworkSessionSchema = registry.register(
  'UpdateHomeworkSession',
  z.object({
    title: z.string().min(1).max(200).optional().openapi({ description: 'Updated session title' }),
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']).optional().openapi({ description: 'Updated status' }),
    currentStep: z.enum(['UNDERSTAND', 'PLAN', 'SOLVE', 'CHECK']).optional().openapi({
      description: 'Current problem-solving step',
    }),
  })
);

// =============================================================================
// Register Endpoints
// =============================================================================

// POST /api/homework/sessions
registry.registerPath({
  method: 'post',
  path: '/api/homework/sessions',
  tags: ['Homework'],
  summary: 'Create a new homework session',
  description: 'Creates a new AI-assisted homework help session for a learner',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateHomeworkSessionSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Session created successfully',
      content: {
        'application/json': {
          schema: z.object({
            session: HomeworkSessionSchema,
          }),
        },
      },
    },
    400: {
      description: 'Validation error',
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Not authorized to create session for this learner',
    },
  },
});

// GET /api/homework/sessions
registry.registerPath({
  method: 'get',
  path: '/api/homework/sessions',
  tags: ['Homework'],
  summary: 'List homework sessions',
  description: 'Get paginated list of homework sessions for a learner',
  request: {
    query: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Filter by learner ID' }),
      status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']).optional().openapi({
        description: 'Filter by status',
      }),
      subject: z.enum(['MATH', 'READING', 'WRITING', 'SCIENCE', 'SOCIAL_STUDIES']).optional().openapi({
        description: 'Filter by subject',
      }),
      limit: z.coerce.number().min(1).max(100).default(20).openapi({ description: 'Items per page' }),
      offset: z.coerce.number().min(0).default(0).openapi({ description: 'Items to skip' }),
    }),
  },
  responses: {
    200: {
      description: 'Sessions retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            sessions: z.array(HomeworkSessionSchema),
            total: z.number(),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// GET /api/homework/sessions/{sessionId}
registry.registerPath({
  method: 'get',
  path: '/api/homework/sessions/{sessionId}',
  tags: ['Homework'],
  summary: 'Get homework session details',
  description: 'Get detailed information about a specific homework session',
  request: {
    params: z.object({
      sessionId: z.string().cuid().openapi({ description: 'Session ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Session details',
      content: {
        'application/json': {
          schema: z.object({
            session: HomeworkSessionSchema,
            messages: z.array(HomeworkMessageSchema),
          }),
        },
      },
    },
    404: {
      description: 'Session not found',
    },
  },
});

// PATCH /api/homework/sessions/{sessionId}
registry.registerPath({
  method: 'patch',
  path: '/api/homework/sessions/{sessionId}',
  tags: ['Homework'],
  summary: 'Update homework session',
  description: 'Update a homework session (title, status, or current step)',
  request: {
    params: z.object({
      sessionId: z.string().cuid().openapi({ description: 'Session ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateHomeworkSessionSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Session updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            session: HomeworkSessionSchema,
          }),
        },
      },
    },
    404: {
      description: 'Session not found',
    },
  },
});

// POST /api/homework/sessions/{sessionId}/messages
registry.registerPath({
  method: 'post',
  path: '/api/homework/sessions/{sessionId}/messages',
  tags: ['Homework'],
  summary: 'Send message in homework session',
  description: 'Send a message to the AI homework helper and receive a response',
  request: {
    params: z.object({
      sessionId: z.string().cuid().openapi({ description: 'Session ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: SendHomeworkMessageSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Message sent and response received',
      content: {
        'application/json': {
          schema: z.object({
            userMessage: HomeworkMessageSchema,
            assistantMessage: HomeworkMessageSchema,
            session: HomeworkSessionSchema,
          }),
        },
      },
    },
    404: {
      description: 'Session not found',
    },
    429: {
      description: 'Rate limit exceeded',
    },
  },
});

// POST /api/homework/sessions/{sessionId}/hint
registry.registerPath({
  method: 'post',
  path: '/api/homework/sessions/{sessionId}/hint',
  tags: ['Homework'],
  summary: 'Request a hint',
  description: 'Request a scaffolded hint for the current problem',
  request: {
    params: z.object({
      sessionId: z.string().cuid().openapi({ description: 'Session ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            hintLevel: z.enum(['SUBTLE', 'MODERATE', 'DIRECT']).default('SUBTLE').openapi({
              description: 'Level of hint detail',
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Hint provided',
      content: {
        'application/json': {
          schema: z.object({
            hint: HomeworkMessageSchema,
            hintsRemaining: z.number().openapi({ description: 'Hints remaining for this session' }),
          }),
        },
      },
    },
    404: {
      description: 'Session not found',
    },
    429: {
      description: 'No hints remaining',
    },
  },
});
