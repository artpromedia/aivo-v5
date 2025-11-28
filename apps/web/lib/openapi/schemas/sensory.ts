import { registry, z } from '../config';

// =============================================================================
// Sensory Profile Schemas
// =============================================================================

export const SensoryProfileSchema = registry.register(
  'SensoryProfile',
  z.object({
    id: z.string().cuid().openapi({ description: 'Sensory profile ID' }),
    learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    
    // Visual preferences
    visualSensitivity: z.number().min(0).max(10).openapi({
      description: 'Visual sensitivity level (0=low, 10=high)',
      example: 5,
    }),
    preferDarkMode: z.boolean().openapi({ description: 'Prefers dark mode' }),
    preferReducedMotion: z.boolean().openapi({ description: 'Prefers reduced motion/animations' }),
    preferHighContrast: z.boolean().openapi({ description: 'Prefers high contrast colors' }),
    fontSizePreference: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE']).openapi({
      description: 'Preferred font size',
    }),
    
    // Auditory preferences
    auditorySensitivity: z.number().min(0).max(10).openapi({
      description: 'Auditory sensitivity level (0=low, 10=high)',
      example: 7,
    }),
    preferMutedSounds: z.boolean().openapi({ description: 'Prefers muted/softer sounds' }),
    enableSoundEffects: z.boolean().openapi({ description: 'Enable UI sound effects' }),
    enableBackgroundMusic: z.boolean().openapi({ description: 'Enable background music' }),
    preferredVoiceType: z.enum(['NEUTRAL', 'WARM', 'ENERGETIC']).nullable().openapi({
      description: 'Preferred AI voice type',
    }),
    speechRate: z.number().min(0.5).max(2.0).openapi({
      description: 'Preferred speech rate (1.0 = normal)',
      example: 1.0,
    }),
    
    // Tactile/interaction preferences
    hapticFeedbackEnabled: z.boolean().openapi({ description: 'Enable haptic/vibration feedback' }),
    
    // Environment preferences
    preferMinimalInterface: z.boolean().openapi({ description: 'Prefers minimal UI clutter' }),
    showTimers: z.boolean().openapi({ description: 'Show countdown timers' }),
    enableTransitions: z.boolean().openapi({ description: 'Enable page transitions' }),
    
    createdAt: z.string().datetime().openapi({ description: 'Profile creation timestamp' }),
    updatedAt: z.string().datetime().openapi({ description: 'Last update timestamp' }),
  })
);

export const SensoryAccommodationSchema = registry.register(
  'SensoryAccommodation',
  z.object({
    id: z.string().cuid().openapi({ description: 'Accommodation ID' }),
    type: z.enum(['VISUAL', 'AUDITORY', 'TACTILE', 'ENVIRONMENT']).openapi({
      description: 'Accommodation type',
    }),
    name: z.string().openapi({ description: 'Accommodation name' }),
    description: z.string().openapi({ description: 'Accommodation description' }),
    settingKey: z.string().openapi({ description: 'Setting key to modify' }),
    defaultValue: z.string().openapi({ description: 'Default setting value' }),
    recommendedFor: z.array(z.string()).openapi({
      description: 'Conditions this accommodation is recommended for',
    }),
  })
);

export const SensoryBreakActivitySchema = registry.register(
  'SensoryBreakActivity',
  z.object({
    id: z.string().cuid().openapi({ description: 'Activity ID' }),
    name: z.string().openapi({ description: 'Activity name' }),
    type: z.enum(['PROPRIOCEPTIVE', 'VESTIBULAR', 'TACTILE', 'VISUAL', 'AUDITORY']).openapi({
      description: 'Sensory input type',
    }),
    description: z.string().openapi({ description: 'Activity description' }),
    instructions: z.array(z.string()).openapi({ description: 'Step-by-step instructions' }),
    durationSeconds: z.number().int().openapi({ description: 'Recommended duration' }),
    equipmentNeeded: z.array(z.string()).openapi({ description: 'Required equipment' }),
    targetSensitivity: z.enum(['LOW', 'MEDIUM', 'HIGH']).openapi({
      description: 'Best for learners with this sensitivity level',
    }),
    safetyNotes: z.array(z.string()).openapi({ description: 'Safety considerations' }),
    videoUrl: z.string().url().nullable().openapi({ description: 'Demonstration video' }),
    imageUrl: z.string().url().nullable().openapi({ description: 'Activity image' }),
  })
);

// =============================================================================
// Request Schemas
// =============================================================================

export const UpdateSensoryProfileSchema = registry.register(
  'UpdateSensoryProfile',
  z.object({
    // Visual
    visualSensitivity: z.number().min(0).max(10).optional(),
    preferDarkMode: z.boolean().optional(),
    preferReducedMotion: z.boolean().optional(),
    preferHighContrast: z.boolean().optional(),
    fontSizePreference: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE']).optional(),
    
    // Auditory
    auditorySensitivity: z.number().min(0).max(10).optional(),
    preferMutedSounds: z.boolean().optional(),
    enableSoundEffects: z.boolean().optional(),
    enableBackgroundMusic: z.boolean().optional(),
    preferredVoiceType: z.enum(['NEUTRAL', 'WARM', 'ENERGETIC']).nullable().optional(),
    speechRate: z.number().min(0.5).max(2.0).optional(),
    
    // Other
    hapticFeedbackEnabled: z.boolean().optional(),
    preferMinimalInterface: z.boolean().optional(),
    showTimers: z.boolean().optional(),
    enableTransitions: z.boolean().optional(),
  })
);

export const SensoryAssessmentResponseSchema = registry.register(
  'SensoryAssessmentResponse',
  z.object({
    questionId: z.string().cuid().openapi({ description: 'Question ID' }),
    response: z.union([
      z.number().min(1).max(5).openapi({ description: 'Scale response (1-5)' }),
      z.boolean().openapi({ description: 'Yes/No response' }),
      z.enum(['NEVER', 'RARELY', 'SOMETIMES', 'OFTEN', 'ALWAYS']).openapi({
        description: 'Frequency response',
      }),
    ]).openapi({ description: 'Response value' }),
  })
);

// =============================================================================
// Register Endpoints
// =============================================================================

// GET /api/sensory/profile/{learnerId}
registry.registerPath({
  method: 'get',
  path: '/api/sensory/profile/{learnerId}',
  tags: ['Sensory'],
  summary: 'Get sensory profile',
  description: 'Get sensory profile and accommodation settings for a learner',
  request: {
    params: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Sensory profile',
      content: {
        'application/json': {
          schema: z.object({
            profile: SensoryProfileSchema,
          }),
        },
      },
    },
    404: {
      description: 'Learner or profile not found',
    },
  },
});

// PATCH /api/sensory/profile/{learnerId}
registry.registerPath({
  method: 'patch',
  path: '/api/sensory/profile/{learnerId}',
  tags: ['Sensory'],
  summary: 'Update sensory profile',
  description: 'Update sensory accommodation settings for a learner',
  request: {
    params: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateSensoryProfileSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Profile updated',
      content: {
        'application/json': {
          schema: z.object({
            profile: SensoryProfileSchema,
          }),
        },
      },
    },
    404: {
      description: 'Learner not found',
    },
  },
});

// GET /api/sensory/accommodations
registry.registerPath({
  method: 'get',
  path: '/api/sensory/accommodations',
  tags: ['Sensory'],
  summary: 'Get available accommodations',
  description: 'Get list of available sensory accommodations',
  request: {
    query: z.object({
      type: z.enum(['VISUAL', 'AUDITORY', 'TACTILE', 'ENVIRONMENT']).optional().openapi({
        description: 'Filter by accommodation type',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Accommodations list',
      content: {
        'application/json': {
          schema: z.object({
            accommodations: z.array(SensoryAccommodationSchema),
          }),
        },
      },
    },
  },
});

// POST /api/sensory/assessment/start
registry.registerPath({
  method: 'post',
  path: '/api/sensory/assessment/start',
  tags: ['Sensory'],
  summary: 'Start sensory assessment',
  description: 'Start a sensory needs assessment for a learner',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
          }),
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
            assessmentId: z.string().cuid(),
            totalQuestions: z.number(),
            firstQuestion: z.object({
              id: z.string().cuid(),
              questionNumber: z.number(),
              text: z.string(),
              responseType: z.enum(['SCALE', 'BOOLEAN', 'FREQUENCY']),
              category: z.enum(['VISUAL', 'AUDITORY', 'TACTILE', 'GENERAL']),
            }),
          }),
        },
      },
    },
  },
});

// POST /api/sensory/assessment/{assessmentId}/respond
registry.registerPath({
  method: 'post',
  path: '/api/sensory/assessment/{assessmentId}/respond',
  tags: ['Sensory'],
  summary: 'Submit assessment response',
  description: 'Submit a response to a sensory assessment question',
  request: {
    params: z.object({
      assessmentId: z.string().cuid().openapi({ description: 'Assessment ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: SensoryAssessmentResponseSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Response submitted',
      content: {
        'application/json': {
          schema: z.object({
            nextQuestion: z.object({
              id: z.string().cuid(),
              questionNumber: z.number(),
              text: z.string(),
              responseType: z.enum(['SCALE', 'BOOLEAN', 'FREQUENCY']),
              category: z.enum(['VISUAL', 'AUDITORY', 'TACTILE', 'GENERAL']),
            }).nullable().openapi({ description: 'Next question (null if complete)' }),
            isComplete: z.boolean(),
            recommendedProfile: SensoryProfileSchema.nullable().openapi({
              description: 'Recommended settings (only on completion)',
            }),
          }),
        },
      },
    },
  },
});

// GET /api/sensory/activities
registry.registerPath({
  method: 'get',
  path: '/api/sensory/activities',
  tags: ['Sensory'],
  summary: 'Get sensory break activities',
  description: 'Get sensory break activities filtered by type and sensitivity',
  request: {
    query: z.object({
      type: z.enum(['PROPRIOCEPTIVE', 'VESTIBULAR', 'TACTILE', 'VISUAL', 'AUDITORY']).optional().openapi({
        description: 'Sensory input type',
      }),
      sensitivity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().openapi({
        description: 'Target sensitivity level',
      }),
      hasEquipment: z.coerce.boolean().optional().openapi({
        description: 'Filter by equipment requirement',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Activities list',
      content: {
        'application/json': {
          schema: z.object({
            activities: z.array(SensoryBreakActivitySchema),
          }),
        },
      },
    },
  },
});

// GET /api/sensory/recommendations/{learnerId}
registry.registerPath({
  method: 'get',
  path: '/api/sensory/recommendations/{learnerId}',
  tags: ['Sensory'],
  summary: 'Get sensory recommendations',
  description: 'Get personalized sensory accommodation recommendations for a learner',
  request: {
    params: z.object({
      learnerId: z.string().cuid().openapi({ description: 'Learner ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Recommendations',
      content: {
        'application/json': {
          schema: z.object({
            recommendations: z.array(z.object({
              accommodation: SensoryAccommodationSchema,
              priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).openapi({
                description: 'Recommendation priority',
              }),
              reason: z.string().openapi({ description: 'Why this is recommended' }),
              currentlyApplied: z.boolean().openapi({ description: 'Whether already applied' }),
            })),
            suggestedActivities: z.array(SensoryBreakActivitySchema).openapi({
              description: 'Recommended sensory activities',
            }),
          }),
        },
      },
    },
    404: {
      description: 'Learner not found',
    },
  },
});
