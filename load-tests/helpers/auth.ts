import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config';

// Token cache to avoid repeated logins
const tokens: Map<string, string> = new Map();

/**
 * Login and get authentication token
 */
export function login(email: string, password: string): string {
  const cached = tokens.get(email);
  if (cached) return cached;
  
  const res = http.post(
    `${config.baseUrl}/api/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'auth', type: 'api' },
    }
  );
  
  const success = check(res, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });
  
  if (!success) {
    console.error(`Login failed for ${email}: ${res.status} ${res.body}`);
    return '';
  }
  
  const token = res.json('token') as string;
  tokens.set(email, token);
  return token;
}

/**
 * Generate auth headers with token
 */
export function authHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get a test learner email
 */
export function getTestLearnerEmail(vuId: number): string {
  const index = vuId % config.testUsers.learners;
  return `test-learner-${index}@${config.testUsers.emailDomain}`;
}

/**
 * Get a test teacher email
 */
export function getTestTeacherEmail(vuId: number): string {
  const index = vuId % config.testUsers.teachers;
  return `test-teacher-${index}@${config.testUsers.emailDomain}`;
}

/**
 * Login as a test learner
 */
export function loginAsLearner(vuId: number): { token: string; headers: Record<string, string> } {
  const email = getTestLearnerEmail(vuId);
  const token = login(email, config.testUsers.passwordTemplate);
  return { token, headers: authHeaders(token) };
}

/**
 * Login as a test teacher
 */
export function loginAsTeacher(vuId: number): { token: string; headers: Record<string, string> } {
  const email = getTestTeacherEmail(vuId);
  const token = login(email, config.testUsers.passwordTemplate);
  return { token, headers: authHeaders(token) };
}

export default { login, authHeaders, loginAsLearner, loginAsTeacher };
