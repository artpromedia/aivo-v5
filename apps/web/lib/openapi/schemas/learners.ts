import { registry, z } from '../config';

// =============================================================================
// Learner Schemas
// =============================================================================

export const LearnerSchema = registry.register(
  'Learner',
  z.object({
    id: z.string().cuid().openapi({ description: 'Learner ID', example: 'clx123abc...' }),
    userId: z.string().cuid().openapi({ description: 'Associated user account ID' }),
    firstName: z.string().openapi({ description: 'First name', example: 'Emma' }),
    lastName: z.string().openapi({ description: 'Last name', example: 'Smith' }),
    dateOfBirth: z.string().datetime().nullable().openapi({ description: 'Date of birth' }),
    gradeLevel: z.number().int().min(0).max(12).nullable().openapi({ description: 'Current grade level', example: 5 }),
    avatarUrl: z.string().url().nullable().openapi({ description: 'Avatar image URL' }),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).openapi({ description: 'Learner status' }),
    createdAt: z.string().datetime().openapi({ description: 'Profile creation timestamp' }),
    updatedAt: z.string().datetime().openapi({ description: 'Last update timestamp' }),
  })
);

export const LearnerProfileSchema = registry.register(
  'LearnerProfile',
  z.object({
    learner: LearnerSchema,
    sensoryProfile: z.object({
      id: z.string().cuid(),
      visualSensitivity: z.number().min(0).max(10),
      auditorySensitivity: z.number().min(0).max(10),
      preferDarkMode: z.boolean(),
    }).nullable().openapi({ description: 'Sensory accommodations profile' }),
    learningPreferences: z.object({
      preferredSubjects: z.array(z.string()),
      learningStyle: z.enum(['VISUAL', 'AUDITORY', 'KINESTHETIC', 'READING_WRITING']).nullable(),
      focusDuration: z.number().int().openapi({ description: 'Preferred focus duration in minutes' }),
    }).nullable().openapi({ description: 'Learning preferences' }),
    stats: z.object({
      totalSessions: z.number().int(),
      completedAssessments: z.number().int(),
      averageSessionDuration: z.number().openapi({ description: 'Average session duration in minutes' }),
      lastActiveAt: z.string().datetime().nullable(),
    }).openapi({ description: 'Learning statistics' }),
  })
);

// =============================================================================
// Request Schemas
// =============================================================================

export const CreateLearnerSchema = registry.register(
  'CreateLearner',
  z.object({
    firstName: z.string().min(1).max(100).openapi({ description: 'First name', example: 'Emma' }),
    lastName: z.string().min(1).max(100).openapi({ description: 'Last name', example: 'Smith' }),
    dateOfBirth: z.string().datetime().optional().openapi({ description: 'Date of birth (ISO format)' }),
    gradeLevel: z.number().int().min(0).max(12).optional().openapi({ description: 'Current grade level' }),
    avatarUrl: z.string().url().optional().openapi({ description: 'Avatar image URL' }),
  })
);

export const UpdateLearnerSchema = registry.register(
  'UpdateLearner',
  z.object({
    firstName: z.string().min(1).max(100).optional().openapi({ description: 'First name' }),
    lastName: z.string().min(1).max(100).optional().openapi({ description: 'Last name' }),
    dateOfBirth: z.string().datetime().optional().openapi({ description: 'Date of birth' }),
    gradeLevel: z.number().int().min(0).max(12).optional().openapi({ description: 'Grade level' }),
    avatarUrl: z.string().url().optional().openapi({ description: 'Avatar URL' }),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional().openapi({ description: 'Status' }),
  })
);

// =============================================================================
// Register Endpoints
// =============================================================================

// GET /api/learners
registry.registerPath({
  method: 'get',
  path: '/api/learners',
  tags: ['Learners'],
  summary: 'List learners',
  description: 'Get list of learners associated with the current user (parent/teacher)',
  request: {
    query: z.object({
      status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional().openapi({
        description: 'Filter by status',
      }),
      limit: z.coerce.number().min(1).max(100).default(20).openapi({ description: 'Items per page' }),
      offset: z.coerce.number().min(0).default(0).openapi({ description: 'Items to skip' }),
    }),
  },
  responses: {
    200: {
      description: 'Learners retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            learners: z.array(LearnerSchema),
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

// POST /api/learners
registry.registerPath({
  method: 'post',
  path: '/api/learners',
  tags: ['Learners'],
  summary: 'Create a new learner',
  description: 'Create a new learner profile (for parents/teachers)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateLearnerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Learner created successfully',
      content: {
        'application/json': {
          schema: z.object({
            learner: LearnerSchema,
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
  },
});

// GET /api/learners/{learnerId}
registry.registerPath({
  method: 'get',
  path: '/api/learners/{learnerId}',
  tags: ['Learners'],
  summary: 'Get learner details',
  description: 'Get detailed information about a specific learner including profile and stats',
  request: {
    params: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Learner details',
      content: {
        'application/json': {
          schema: LearnerProfileSchema,
        },
      },
    },
    404: {
      description: 'Learner not found',
    },
  },
});

// PATCH /api/learners/{learnerId}
registry.registerPath({
  method: 'patch',
  path: '/api/learners/{learnerId}',
  tags: ['Learners'],
  summary: 'Update learner',
  description: 'Update a learner profile',
  request: {
    params: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateLearnerSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Learner updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            learner: LearnerSchema,
          }),
        },
      },
    },
    404: {
      description: 'Learner not found',
    },
  },
});

// DELETE /api/learners/{learnerId}
registry.registerPath({
  method: 'delete',
  path: '/api/learners/{learnerId}',
  tags: ['Learners'],
  summary: 'Archive learner',
  description: 'Archive a learner profile (soft delete)',
  request: {
    params: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Learner archived successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    404: {
      description: 'Learner not found',
    },
  },
});

// GET /api/learners/{learnerId}/progress
registry.registerPath({
  method: 'get',
  path: '/api/learners/{learnerId}/progress',
  tags: ['Learners', 'Analytics'],
  summary: 'Get learner progress',
  description: 'Get learning progress and analytics for a learner',
  request: {
    params: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    }),
    query: z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']).default('month').openapi({
        description: 'Time period for analytics',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Progress data',
      content: {
        'application/json': {
          schema: z.object({
            period: z.string(),
            sessionsCompleted: z.number(),
            assessmentsTaken: z.number(),
            averageScore: z.number().nullable(),
            subjectBreakdown: z.array(z.object({
              subject: z.string(),
              sessionsCount: z.number(),
              averageScore: z.number().nullable(),
            })),
            weeklyActivity: z.array(z.object({
              week: z.string(),
              sessionsCount: z.number(),
              totalDurationMinutes: z.number(),
            })),
          }),
        },
      },
    },
    404: {
      description: 'Learner not found',
    },
  },
});
