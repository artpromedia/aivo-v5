import { registry, z } from '../config';

// =============================================================================
// Emotional Regulation Schemas
// =============================================================================

export const EmotionStateSchema = registry.register(
  'EmotionState',
  z.object({
    emotion: z.enum([
      'HAPPY', 'SAD', 'ANGRY', 'ANXIOUS', 'FRUSTRATED',
      'CALM', 'EXCITED', 'TIRED', 'CONFUSED', 'PROUD',
    ]).openapi({ description: 'Current emotional state' }),
    intensity: z.number().min(1).max(10).openapi({
      description: 'Intensity level (1-10)',
      example: 7,
    }),
    timestamp: z.string().datetime().openapi({ description: 'When this emotion was recorded' }),
  })
);

export const RegulationCheckInSchema = registry.register(
  'RegulationCheckIn',
  z.object({
    id: z.string().cuid().openapi({ description: 'Check-in ID' }),
    learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    sessionId: z.string().cuid().nullable().openapi({ description: 'Associated session ID' }),
    emotionBefore: EmotionStateSchema.openapi({ description: 'Emotion before activity/session' }),
    emotionAfter: EmotionStateSchema.nullable().openapi({ description: 'Emotion after activity/session' }),
    trigger: z.string().nullable().openapi({ description: 'What triggered this check-in' }),
    copingStrategy: z.string().nullable().openapi({ description: 'Coping strategy used' }),
    notes: z.string().nullable().openapi({ description: 'Additional notes' }),
    createdAt: z.string().datetime().openapi({ description: 'Check-in timestamp' }),
  })
);

export const RegulationBreakSchema = registry.register(
  'RegulationBreak',
  z.object({
    id: z.string().cuid().openapi({ description: 'Break ID' }),
    learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    sessionId: z.string().cuid().nullable().openapi({ description: 'Session that triggered break' }),
    breakType: z.enum(['MOVEMENT', 'BREATHING', 'SENSORY', 'QUIET', 'SOCIAL']).openapi({
      description: 'Type of regulation break',
    }),
    activity: z.string().openapi({ description: 'Specific break activity', example: 'Deep breathing exercise' }),
    durationSeconds: z.number().int().openapi({ description: 'Break duration in seconds' }),
    triggeredBy: z.enum(['LEARNER', 'SYSTEM', 'CAREGIVER']).openapi({
      description: 'Who initiated the break',
    }),
    completedActivity: z.boolean().openapi({ description: 'Whether break activity was completed' }),
    effectivenessRating: z.number().min(1).max(5).nullable().openapi({
      description: 'Self-rated effectiveness (1-5)',
    }),
    createdAt: z.string().datetime().openapi({ description: 'Break start timestamp' }),
  })
);

export const RegulationToolSchema = registry.register(
  'RegulationTool',
  z.object({
    id: z.string().cuid().openapi({ description: 'Tool ID' }),
    name: z.string().openapi({ description: 'Tool name', example: 'Calm Corner' }),
    description: z.string().openapi({ description: 'Tool description' }),
    category: z.enum(['BREATHING', 'MOVEMENT', 'SENSORY', 'GROUNDING', 'VISUALIZATION']).openapi({
      description: 'Tool category',
    }),
    targetEmotions: z.array(z.string()).openapi({ description: 'Emotions this tool helps with' }),
    instructions: z.array(z.string()).openapi({ description: 'Step-by-step instructions' }),
    mediaUrl: z.string().url().nullable().openapi({ description: 'Video or image for tool' }),
    audioCueUrl: z.string().url().nullable().openapi({ description: 'Audio guidance' }),
    estimatedDurationSeconds: z.number().int().openapi({ description: 'Estimated completion time' }),
    ageRange: z.object({
      min: z.number().int(),
      max: z.number().int(),
    }).openapi({ description: 'Recommended age range' }),
  })
);

// =============================================================================
// Request Schemas
// =============================================================================

export const RecordCheckInSchema = registry.register(
  'RecordCheckIn',
  z.object({
    learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    sessionId: z.string().cuid().optional().openapi({ description: 'Session ID if during session' }),
    emotion: z.enum([
      'HAPPY', 'SAD', 'ANGRY', 'ANXIOUS', 'FRUSTRATED',
      'CALM', 'EXCITED', 'TIRED', 'CONFUSED', 'PROUD',
    ]).openapi({ description: 'Current emotion' }),
    intensity: z.number().min(1).max(10).openapi({ description: 'Intensity (1-10)' }),
    trigger: z.string().optional().openapi({ description: 'What caused this emotion' }),
    isAfterActivity: z.boolean().default(false).openapi({
      description: 'Whether this is an after-activity check-in',
    }),
    checkInId: z.string().cuid().optional().openapi({
      description: 'Previous check-in ID if recording after-activity emotion',
    }),
  })
);

export const StartBreakSchema = registry.register(
  'StartBreak',
  z.object({
    learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    sessionId: z.string().cuid().optional().openapi({ description: 'Session ID' }),
    breakType: z.enum(['MOVEMENT', 'BREATHING', 'SENSORY', 'QUIET', 'SOCIAL']).openapi({
      description: 'Type of break',
    }),
    activity: z.string().optional().openapi({
      description: 'Specific activity (system will suggest if not provided)',
    }),
  })
);

// =============================================================================
// Register Endpoints
// =============================================================================

// GET /api/regulation/check-ins
registry.registerPath({
  method: 'get',
  path: '/api/regulation/check-ins',
  tags: ['Regulation'],
  summary: 'Get emotional check-ins',
  description: 'Get emotional regulation check-ins for a learner',
  request: {
    query: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
      startDate: z.string().datetime().optional().openapi({ description: 'Start date filter' }),
      endDate: z.string().datetime().optional().openapi({ description: 'End date filter' }),
      limit: z.coerce.number().min(1).max(100).default(20),
      offset: z.coerce.number().min(0).default(0),
    }),
  },
  responses: {
    200: {
      description: 'Check-ins retrieved',
      content: {
        'application/json': {
          schema: z.object({
            checkIns: z.array(RegulationCheckInSchema),
            total: z.number(),
          }),
        },
      },
    },
  },
});

// POST /api/regulation/check-in
registry.registerPath({
  method: 'post',
  path: '/api/regulation/check-in',
  tags: ['Regulation'],
  summary: 'Record emotional check-in',
  description: 'Record an emotional check-in for a learner',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RecordCheckInSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Check-in recorded',
      content: {
        'application/json': {
          schema: z.object({
            checkIn: RegulationCheckInSchema,
            suggestedTools: z.array(RegulationToolSchema).openapi({
              description: 'Suggested regulation tools based on emotion',
            }),
          }),
        },
      },
    },
  },
});

// GET /api/regulation/breaks
registry.registerPath({
  method: 'get',
  path: '/api/regulation/breaks',
  tags: ['Regulation'],
  summary: 'Get regulation breaks',
  description: 'Get regulation break history for a learner',
  request: {
    query: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
      startDate: z.string().datetime().optional().openapi({ description: 'Start date filter' }),
      endDate: z.string().datetime().optional().openapi({ description: 'End date filter' }),
      limit: z.coerce.number().min(1).max(100).default(20),
      offset: z.coerce.number().min(0).default(0),
    }),
  },
  responses: {
    200: {
      description: 'Breaks retrieved',
      content: {
        'application/json': {
          schema: z.object({
            breaks: z.array(RegulationBreakSchema),
            total: z.number(),
          }),
        },
      },
    },
  },
});

// POST /api/regulation/break/start
registry.registerPath({
  method: 'post',
  path: '/api/regulation/break/start',
  tags: ['Regulation'],
  summary: 'Start regulation break',
  description: 'Start a regulation break session with guided activity',
  request: {
    body: {
      content: {
        'application/json': {
          schema: StartBreakSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Break started',
      content: {
        'application/json': {
          schema: z.object({
            break: RegulationBreakSchema,
            tool: RegulationToolSchema.openapi({ description: 'Recommended regulation tool' }),
          }),
        },
      },
    },
  },
});

// POST /api/regulation/break/{breakId}/complete
registry.registerPath({
  method: 'post',
  path: '/api/regulation/break/{breakId}/complete',
  tags: ['Regulation'],
  summary: 'Complete regulation break',
  description: 'Mark a regulation break as complete',
  request: {
    params: z.object({
      breakId: z.string().cuid().openapi({ description: 'Break ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            completedActivity: z.boolean().openapi({ description: 'Whether activity was completed' }),
            effectivenessRating: z.number().min(1).max(5).optional().openapi({
              description: 'Self-rated effectiveness',
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Break completed',
      content: {
        'application/json': {
          schema: z.object({
            break: RegulationBreakSchema,
          }),
        },
      },
    },
  },
});

// GET /api/regulation/tools
registry.registerPath({
  method: 'get',
  path: '/api/regulation/tools',
  tags: ['Regulation'],
  summary: 'Get regulation tools',
  description: 'Get available regulation tools, optionally filtered',
  request: {
    query: z.object({
      category: z.enum(['BREATHING', 'MOVEMENT', 'SENSORY', 'GROUNDING', 'VISUALIZATION']).optional().openapi({
        description: 'Filter by category',
      }),
      emotion: z.string().optional().openapi({ description: 'Filter by target emotion' }),
      ageMin: z.coerce.number().int().optional().openapi({ description: 'Minimum age' }),
      ageMax: z.coerce.number().int().optional().openapi({ description: 'Maximum age' }),
    }),
  },
  responses: {
    200: {
      description: 'Tools retrieved',
      content: {
        'application/json': {
          schema: z.object({
            tools: z.array(RegulationToolSchema),
          }),
        },
      },
    },
  },
});

// GET /api/regulation/analytics
registry.registerPath({
  method: 'get',
  path: '/api/regulation/analytics',
  tags: ['Regulation', 'Analytics'],
  summary: 'Get regulation analytics',
  description: 'Get emotional regulation analytics for a learner',
  request: {
    query: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
      period: z.enum(['week', 'month', 'quarter']).default('month').openapi({
        description: 'Analysis period',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Analytics data',
      content: {
        'application/json': {
          schema: z.object({
            period: z.string(),
            emotionFrequency: z.array(z.object({
              emotion: z.string(),
              count: z.number(),
              averageIntensity: z.number(),
            })).openapi({ description: 'Emotion frequency distribution' }),
            breakEffectiveness: z.object({
              totalBreaks: z.number(),
              completedBreaks: z.number(),
              averageRating: z.number().nullable(),
              mostEffectiveType: z.string().nullable(),
            }).openapi({ description: 'Break effectiveness metrics' }),
            emotionTrend: z.array(z.object({
              date: z.string(),
              positiveCount: z.number(),
              negativeCount: z.number(),
            })).openapi({ description: 'Daily emotion trend' }),
            triggers: z.array(z.object({
              trigger: z.string(),
              count: z.number(),
              associatedEmotions: z.array(z.string()),
            })).openapi({ description: 'Common triggers' }),
          }),
        },
      },
    },
  },
});
