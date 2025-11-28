/**
 * Authentication Validation Schemas for AIVO v5
 */

import { z } from 'zod';
import { emailSchema, passwordSchema, displayNameSchema, idSchema } from './common';

/** User role */
export const userRoleSchema = z.enum([
  'LEARNER',
  'PARENT',
  'TEACHER',
  'ADMIN',
  'SUPER_ADMIN',
]);

/** Login credentials */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

/** Registration input */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: displayNameSchema,
  lastName: displayNameSchema,
  role: userRoleSchema.default('LEARNER'),
  tenantId: idSchema.optional(),
  inviteCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/** Password reset request */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/** Password reset with token */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/** Change password (authenticated) */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

/** Update profile */
export const updateProfileSchema = z.object({
  firstName: displayNameSchema.optional(),
  lastName: displayNameSchema.optional(),
  avatarUrl: z.string().url().optional().nullable(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

/** OAuth callback */
export const oauthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
  provider: z.enum(['google', 'apple', 'microsoft']),
});

/** Email verification */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/** Resend verification email */
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

/** Two-factor authentication setup */
export const setup2faSchema = z.object({
  method: z.enum(['totp', 'sms']),
  phoneNumber: z.string().optional(),
});

/** Verify 2FA code */
export const verify2faSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
  trustDevice: z.boolean().default(false),
});

// Export types
export type UserRole = z.infer<typeof userRoleSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type Setup2faInput = z.infer<typeof setup2faSchema>;
export type Verify2faInput = z.infer<typeof verify2faSchema>;
