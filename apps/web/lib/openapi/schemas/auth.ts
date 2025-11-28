import { registry, z } from '../config';

// =============================================================================
// User Schema
// =============================================================================

export const UserSchema = registry.register(
  'User',
  z.object({
    id: z.string().cuid().openapi({ description: 'User ID', example: 'clx123abc...' }),
    email: z.string().email().openapi({ description: 'User email', example: 'user@example.com' }),
    name: z.string().nullable().openapi({ description: 'User display name', example: 'John Doe' }),
    role: z.enum(['LEARNER', 'PARENT', 'TEACHER', 'ADMIN', 'DISTRICT_ADMIN', 'PLATFORM_ADMIN']).openapi({
      description: 'User role',
      example: 'PARENT',
    }),
    emailVerified: z.string().datetime().nullable().openapi({ description: 'Email verification timestamp' }),
    image: z.string().url().nullable().openapi({ description: 'Profile image URL' }),
    createdAt: z.string().datetime().openapi({ description: 'Account creation timestamp' }),
  })
);

// =============================================================================
// Request Schemas
// =============================================================================

export const LoginRequestSchema = registry.register(
  'LoginRequest',
  z.object({
    email: z.string().email().openapi({ description: 'User email address', example: 'user@example.com' }),
    password: z.string().min(8).openapi({ description: 'User password (min 8 characters)' }),
  })
);

export const RegisterRequestSchema = registry.register(
  'RegisterRequest',
  z.object({
    email: z.string().email().openapi({ description: 'User email address', example: 'user@example.com' }),
    password: z.string().min(8).openapi({ description: 'Password (min 8 characters, must include number and special char)' }),
    name: z.string().min(2).max(100).openapi({ description: 'Display name', example: 'John Doe' }),
    role: z.enum(['LEARNER', 'PARENT', 'TEACHER']).default('PARENT').openapi({
      description: 'User role (learner, parent, or teacher)',
      example: 'PARENT',
    }),
  })
);

export const RefreshTokenRequestSchema = registry.register(
  'RefreshTokenRequest',
  z.object({
    refreshToken: z.string().openapi({ description: 'Refresh token from previous authentication' }),
  })
);

export const ForgotPasswordRequestSchema = registry.register(
  'ForgotPasswordRequest',
  z.object({
    email: z.string().email().openapi({ description: 'Email address for password reset', example: 'user@example.com' }),
  })
);

export const ResetPasswordRequestSchema = registry.register(
  'ResetPasswordRequest',
  z.object({
    token: z.string().openapi({ description: 'Password reset token from email' }),
    password: z.string().min(8).openapi({ description: 'New password (min 8 characters)' }),
  })
);

// =============================================================================
// Response Schemas
// =============================================================================

export const AuthResponseSchema = registry.register(
  'AuthResponse',
  z.object({
    user: UserSchema,
    accessToken: z.string().openapi({ description: 'JWT access token' }),
    refreshToken: z.string().openapi({ description: 'Refresh token for token renewal' }),
    expiresIn: z.number().openapi({ description: 'Token expiration time in seconds', example: 3600 }),
  })
);

export const SessionResponseSchema = registry.register(
  'SessionResponse',
  z.object({
    user: UserSchema.nullable(),
    expires: z.string().datetime().openapi({ description: 'Session expiration timestamp' }),
  })
);

// =============================================================================
// Register Endpoints
// =============================================================================

// POST /api/auth/login
registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Authentication'],
  summary: 'Login with email and password',
  description: 'Authenticate a user with email and password credentials',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: AuthResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid credentials',
    },
    429: {
      description: 'Too many login attempts',
    },
  },
  security: [], // No auth required for login
});

// POST /api/auth/register
registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Authentication'],
  summary: 'Register a new user',
  description: 'Create a new user account',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Registration successful',
      content: {
        'application/json': {
          schema: AuthResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error or email already exists',
    },
  },
  security: [],
});

// POST /api/auth/refresh
registry.registerPath({
  method: 'post',
  path: '/api/auth/refresh',
  tags: ['Authentication'],
  summary: 'Refresh access token',
  description: 'Get a new access token using a refresh token',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RefreshTokenRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Token refreshed successfully',
      content: {
        'application/json': {
          schema: z.object({
            accessToken: z.string(),
            expiresIn: z.number(),
          }),
        },
      },
    },
    401: {
      description: 'Invalid or expired refresh token',
    },
  },
  security: [],
});

// GET /api/auth/session
registry.registerPath({
  method: 'get',
  path: '/api/auth/session',
  tags: ['Authentication'],
  summary: 'Get current session',
  description: 'Get the current user session information',
  responses: {
    200: {
      description: 'Session information',
      content: {
        'application/json': {
          schema: SessionResponseSchema,
        },
      },
    },
  },
});

// POST /api/auth/logout
registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Authentication'],
  summary: 'Logout user',
  description: 'Invalidate the current session and tokens',
  responses: {
    200: {
      description: 'Logout successful',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
  },
});

// POST /api/auth/forgot-password
registry.registerPath({
  method: 'post',
  path: '/api/auth/forgot-password',
  tags: ['Authentication'],
  summary: 'Request password reset',
  description: 'Send a password reset email to the user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ForgotPasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset email sent (if account exists)',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
  security: [],
});

// POST /api/auth/reset-password
registry.registerPath({
  method: 'post',
  path: '/api/auth/reset-password',
  tags: ['Authentication'],
  summary: 'Reset password',
  description: 'Reset password using the token from email',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ResetPasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset successful',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: 'Invalid or expired reset token',
    },
  },
  security: [],
});
