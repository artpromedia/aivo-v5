/**
 * Test Data Utilities for E2E Tests
 */

export const testUsers = {
  learner: {
    email: 'test-learner@aivo.test',
    password: 'TestPassword123!',
    name: 'Test Learner',
    role: 'learner' as const,
  },
  parent: {
    email: 'test-parent@aivo.test',
    password: 'TestPassword123!',
    name: 'Test Parent',
    role: 'parent' as const,
  },
  teacher: {
    email: 'test-teacher@aivo.test',
    password: 'TestPassword123!',
    name: 'Test Teacher',
    role: 'teacher' as const,
  },
  admin: {
    email: 'test-admin@aivo.test',
    password: 'TestPassword123!',
    name: 'Test Admin',
    role: 'admin' as const,
  },
};

export type UserRole = keyof typeof testUsers;

export const testHomework = {
  math: {
    subject: 'Mathematics',
    title: 'Algebra Practice',
    description: 'Solve linear equations',
    questions: [
      { question: 'Solve: 2x + 5 = 15', answer: 'x = 5' },
      { question: 'Solve: 3x - 7 = 8', answer: 'x = 5' },
    ],
  },
  science: {
    subject: 'Science',
    title: 'Photosynthesis Quiz',
    description: 'Understanding plant biology',
  },
};

export const testAssessment = {
  baseline: {
    type: 'baseline',
    subjects: ['math', 'reading', 'science'],
    duration: 30,
  },
};

export function generateTestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
