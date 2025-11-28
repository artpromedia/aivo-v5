/**
 * File Upload Validation Schemas for AIVO v5
 */

import { z } from 'zod';

/** Allowed MIME types for different upload contexts */
export const imageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const audioMimeTypes = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/webm',
  'audio/ogg',
] as const;

export const videoMimeTypes = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const documentMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

/** File size limits (in bytes) */
export const fileSizeLimits = {
  image: 5 * 1024 * 1024, // 5MB
  audio: 25 * 1024 * 1024, // 25MB
  video: 100 * 1024 * 1024, // 100MB
  document: 10 * 1024 * 1024, // 10MB
  avatar: 2 * 1024 * 1024, // 2MB
} as const;

/** Generic file upload schema */
export const fileUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.string(),
  size: z.number().max(100 * 1024 * 1024), // 100MB max
});

/** Image upload schema */
export const imageUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.enum(imageMimeTypes),
  size: z.number().max(fileSizeLimits.image),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

/** Audio upload schema (for speech/voice) */
export const audioUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.enum(audioMimeTypes),
  size: z.number().max(fileSizeLimits.audio),
  duration: z.number().positive().optional(), // seconds
});

/** Video upload schema */
export const videoUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.enum(videoMimeTypes),
  size: z.number().max(fileSizeLimits.video),
  duration: z.number().positive().optional(), // seconds
});

/** Document upload schema */
export const documentUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.enum(documentMimeTypes),
  size: z.number().max(fileSizeLimits.document),
  pageCount: z.number().int().positive().optional(),
});

/** Avatar upload schema (smaller images) */
export const avatarUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(fileSizeLimits.avatar),
});

/** Homework image upload (for problem scanning) */
export const homeworkImageUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.enum(imageMimeTypes),
  size: z.number().max(fileSizeLimits.image),
  context: z.enum(['PROBLEM', 'SOLUTION', 'REFERENCE']).default('PROBLEM'),
});

/** Presigned URL request */
export const presignedUrlRequestSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.string(),
  size: z.number().positive(),
  purpose: z.enum([
    'AVATAR',
    'HOMEWORK_IMAGE',
    'VOICE_RECORDING',
    'DOCUMENT',
    'ASSESSMENT_MEDIA',
  ]),
});

/** Confirm upload completion */
export const confirmUploadSchema = z.object({
  uploadId: z.string(),
  key: z.string(),
  success: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
});

// Export types
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type ImageUpload = z.infer<typeof imageUploadSchema>;
export type AudioUpload = z.infer<typeof audioUploadSchema>;
export type VideoUpload = z.infer<typeof videoUploadSchema>;
export type DocumentUpload = z.infer<typeof documentUploadSchema>;
export type AvatarUpload = z.infer<typeof avatarUploadSchema>;
export type HomeworkImageUpload = z.infer<typeof homeworkImageUploadSchema>;
export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;
export type ConfirmUpload = z.infer<typeof confirmUploadSchema>;
