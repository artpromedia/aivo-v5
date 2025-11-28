import { registry, z } from '../config';

// =============================================================================
// Assessment Schemas
// =============================================================================

export const AssessmentSchema = registry.register(
  'Assessment',
  z.object({
    id: z.string().cuid().openapi({ description: 'Assessment ID' }),
    learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    type: z.enum(['BASELINE', 'ADAPTIVE', 'PROGRESS', 'DIAGNOSTIC']).openapi({
      description: 'Assessment type',
      example: 'BASELINE',
    }),
    domain: z.enum(['READING', 'MATH', 'WRITING', 'COMPREHENSION', 'PHONICS']).openapi({
      description: 'Assessment domain',
      example: 'READING',
    }),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED']).openapi({
      description: 'Assessment status',
    }),
    totalQuestions: z.number().int().openapi({ description: 'Total questions in assessment' }),
    answeredQuestions: z.number().int().openapi({ description: 'Questions answered so far' }),
    correctAnswers: z.number().int().nullable().openapi({ description: 'Correct answers (null if not completed)' }),
    score: z.number().min(0).max(100).nullable().openapi({ description: 'Score percentage (null if not completed)' }),
    gradeEquivalent: z.string().nullable().openapi({ description: 'Grade equivalent score', example: '4.5' }),
    startedAt: z.string().datetime().nullable().openapi({ description: 'Start timestamp' }),
    completedAt: z.string().datetime().nullable().openapi({ description: 'Completion timestamp' }),
    createdAt: z.string().datetime().openapi({ description: 'Creation timestamp' }),
  })
);

export const AssessmentQuestionSchema = registry.register(
  'AssessmentQuestion',
  z.object({
    id: z.string().cuid().openapi({ description: 'Question ID' }),
    questionNumber: z.number().int().openapi({ description: 'Question number in sequence' }),
    questionType: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'MATCHING']).openapi({
      description: 'Question type',
    }),
    content: z.string().openapi({ description: 'Question content/prompt' }),
    options: z.array(z.object({
      id: z.string(),
      text: z.string(),
    })).nullable().openapi({ description: 'Answer options for multiple choice' }),
    imageUrl: z.string().url().nullable().openapi({ description: 'Optional image for the question' }),
    audioUrl: z.string().url().nullable().openapi({ description: 'Optional audio for the question' }),
    difficulty: z.number().min(1).max(10).openapi({ description: 'Question difficulty level' }),
  })
);

export const AssessmentResultSchema = registry.register(
  'AssessmentResult',
  z.object({
    assessment: AssessmentSchema,
    breakdown: z.array(z.object({
      skill: z.string().openapi({ description: 'Skill area', example: 'Phonemic Awareness' }),
      score: z.number().min(0).max(100).openapi({ description: 'Score for this skill' }),
      level: z.enum(['BELOW_GRADE', 'AT_GRADE', 'ABOVE_GRADE']).openapi({ description: 'Performance level' }),
      recommendations: z.array(z.string()).openapi({ description: 'Improvement recommendations' }),
    })).openapi({ description: 'Skill breakdown' }),
    overallLevel: z.enum(['BELOW_GRADE', 'AT_GRADE', 'ABOVE_GRADE']).openapi({
      description: 'Overall performance level',
    }),
    nextSteps: z.array(z.string()).openapi({ description: 'Recommended next steps' }),
  })
);

// =============================================================================
// Request Schemas
// =============================================================================

export const StartAssessmentSchema = registry.register(
  'StartAssessment',
  z.object({
    learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    type: z.enum(['BASELINE', 'ADAPTIVE', 'PROGRESS', 'DIAGNOSTIC']).openapi({
      description: 'Assessment type to start',
    }),
    domain: z.enum(['READING', 'MATH', 'WRITING', 'COMPREHENSION', 'PHONICS']).openapi({
      description: 'Assessment domain',
    }),
  })
);

export const SubmitAnswerSchema = registry.register(
  'SubmitAnswer',
  z.object({
    questionId: z.string().cuid().openapi({ description: 'Question ID' }),
    answer: z.union([
      z.string().openapi({ description: 'Text answer for short answer questions' }),
      z.array(z.string()).openapi({ description: 'Selected option IDs for multiple choice' }),
    ]).openapi({ description: 'The answer to submit' }),
    timeSpentSeconds: z.number().int().optional().openapi({ description: 'Time spent on this question' }),
  })
);

// =============================================================================
// Register Endpoints
// =============================================================================

// GET /api/assessment
registry.registerPath({
  method: 'get',
  path: '/api/assessment',
  tags: ['Assessment'],
  summary: 'List assessments',
  description: 'Get list of assessments for a learner',
  request: {
    query: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
      type: z.enum(['BASELINE', 'ADAPTIVE', 'PROGRESS', 'DIAGNOSTIC']).optional().openapi({
        description: 'Filter by type',
      }),
      domain: z.enum(['READING', 'MATH', 'WRITING', 'COMPREHENSION', 'PHONICS']).optional().openapi({
        description: 'Filter by domain',
      }),
      status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED']).optional().openapi({
        description: 'Filter by status',
      }),
      limit: z.coerce.number().min(1).max(100).default(20),
      offset: z.coerce.number().min(0).default(0),
    }),
  },
  responses: {
    200: {
      description: 'Assessments retrieved',
      content: {
        'application/json': {
          schema: z.object({
            assessments: z.array(AssessmentSchema),
            total: z.number(),
          }),
        },
      },
    },
  },
});

// POST /api/assessment/start
registry.registerPath({
  method: 'post',
  path: '/api/assessment/start',
  tags: ['Assessment'],
  summary: 'Start an assessment',
  description: 'Start a new assessment session for a learner',
  request: {
    body: {
      content: {
        'application/json': {
          schema: StartAssessmentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Assessment started',
      content: {
        'application/json': {
          schema: z.object({
            assessment: AssessmentSchema,
            firstQuestion: AssessmentQuestionSchema,
          }),
        },
      },
    },
    400: {
      description: 'Validation error or assessment already in progress',
    },
  },
});

// GET /api/assessment/{assessmentId}
registry.registerPath({
  method: 'get',
  path: '/api/assessment/{assessmentId}',
  tags: ['Assessment'],
  summary: 'Get assessment details',
  description: 'Get details of a specific assessment',
  request: {
    params: z.object({
      assessmentId: z.string().cuid().openapi({ description: 'Assessment ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Assessment details',
      content: {
        'application/json': {
          schema: z.object({
            assessment: AssessmentSchema,
          }),
        },
      },
    },
    404: {
      description: 'Assessment not found',
    },
  },
});

// GET /api/assessment/{assessmentId}/question
registry.registerPath({
  method: 'get',
  path: '/api/assessment/{assessmentId}/question',
  tags: ['Assessment'],
  summary: 'Get current question',
  description: 'Get the current question for an in-progress assessment',
  request: {
    params: z.object({
      assessmentId: z.string().cuid().openapi({ description: 'Assessment ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Current question',
      content: {
        'application/json': {
          schema: z.object({
            question: AssessmentQuestionSchema,
            progress: z.object({
              current: z.number(),
              total: z.number(),
              percentComplete: z.number(),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Assessment not in progress',
    },
    404: {
      description: 'Assessment not found',
    },
  },
});

// POST /api/assessment/{assessmentId}/answer
registry.registerPath({
  method: 'post',
  path: '/api/assessment/{assessmentId}/answer',
  tags: ['Assessment'],
  summary: 'Submit answer',
  description: 'Submit an answer to the current question and get the next question',
  request: {
    params: z.object({
      assessmentId: z.string().cuid().openapi({ description: 'Assessment ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: SubmitAnswerSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Answer submitted',
      content: {
        'application/json': {
          schema: z.object({
            assessment: AssessmentSchema,
            nextQuestion: AssessmentQuestionSchema.nullable().openapi({
              description: 'Next question (null if assessment complete)',
            }),
            isComplete: z.boolean().openapi({ description: 'Whether assessment is now complete' }),
          }),
        },
      },
    },
    400: {
      description: 'Invalid answer or assessment not in progress',
    },
  },
});

// GET /api/assessment/{assessmentId}/results
registry.registerPath({
  method: 'get',
  path: '/api/assessment/{assessmentId}/results',
  tags: ['Assessment'],
  summary: 'Get assessment results',
  description: 'Get detailed results for a completed assessment',
  request: {
    params: z.object({
      assessmentId: z.string().cuid().openapi({ description: 'Assessment ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Assessment results',
      content: {
        'application/json': {
          schema: AssessmentResultSchema,
        },
      },
    },
    400: {
      description: 'Assessment not yet completed',
    },
    404: {
      description: 'Assessment not found',
    },
  },
});

// POST /api/assessment/{assessmentId}/abandon
registry.registerPath({
  method: 'post',
  path: '/api/assessment/{assessmentId}/abandon',
  tags: ['Assessment'],
  summary: 'Abandon assessment',
  description: 'Mark an in-progress assessment as abandoned',
  request: {
    params: z.object({
      assessmentId: z.string().cuid().openapi({ description: 'Assessment ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            reason: z.string().optional().openapi({ description: 'Reason for abandoning' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Assessment abandoned',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    400: {
      description: 'Assessment already completed or abandoned',
    },
  },
});
