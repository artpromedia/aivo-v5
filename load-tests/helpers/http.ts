import http from 'k6/http';
import { Response } from 'k6/http';

/**
 * HTTP helper with automatic tagging and error handling
 */
export function apiGet(
  url: string, 
  headers: Record<string, string>, 
  endpoint: string
): Response {
  return http.get(url, {
    headers,
    tags: { endpoint, type: 'api' },
  });
}

export function apiPost(
  url: string, 
  body: object, 
  headers: Record<string, string>, 
  endpoint: string
): Response {
  return http.post(url, JSON.stringify(body), {
    headers,
    tags: { endpoint, type: 'api' },
  });
}

export function apiPut(
  url: string, 
  body: object, 
  headers: Record<string, string>, 
  endpoint: string
): Response {
  return http.put(url, JSON.stringify(body), {
    headers,
    tags: { endpoint, type: 'api' },
  });
}

export function apiDelete(
  url: string, 
  headers: Record<string, string>, 
  endpoint: string
): Response {
  return http.del(url, null, {
    headers,
    tags: { endpoint, type: 'api' },
  });
}

/**
 * Random think time to simulate real user behavior
 */
export function randomThinkTime(min: number = 1, max: number = 5): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random test data
 */
export function randomSubject(): string {
  const subjects = ['MATH', 'READING', 'SCIENCE', 'SOCIAL_STUDIES'];
  return subjects[Math.floor(Math.random() * subjects.length)];
}

export function randomGradeLevel(): number {
  return Math.floor(Math.random() * 8) + 1; // Grades 1-8
}

export function randomEmotion(): string {
  const emotions = ['happy', 'calm', 'sad', 'angry', 'anxious', 'excited', 'tired'];
  return emotions[Math.floor(Math.random() * emotions.length)];
}

export function randomIntensity(): number {
  return Math.floor(Math.random() * 10) + 1; // 1-10
}

export function randomDifficulty(): number {
  return Math.random(); // 0-1
}

export default {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  randomThinkTime,
  randomSubject,
  randomGradeLevel,
  randomEmotion,
  randomIntensity,
  randomDifficulty,
};
