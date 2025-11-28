/**
 * API Load Test
 * 
 * Tests API endpoints under constant load with
 * arrival rate executor for realistic traffic patterns.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { config } from '../config';

// Custom metrics
const errors = new Rate('errors');
const authLatency = new Trend('auth_latency');
const apiLatency = new Trend('api_latency');

export const options = {
  scenarios: {
    // Constant arrival rate for API testing
    constantLoad: {
      executor: 'constant-arrival-rate',
      rate: 100, // 100 requests per second
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
    // Ramping arrival rate for stress testing
    rampingLoad: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { target: 50, duration: '2m' },
        { target: 100, duration: '3m' },
        { target: 200, duration: '2m' },
        { target: 50, duration: '2m' },
        { target: 0, duration: '1m' },
      ],
    },
  },
  thresholds: config.thresholds,
  tags: {
    testType: 'api-load',
  },
};

// Shared token store
const tokens: Map<number, string> = new Map();

function getToken(vuId: number): string {
  if (tokens.has(vuId)) {
    return tokens.get(vuId)!;
  }
  
  const email = `test-learner-${vuId % config.testUsers.learners}@${config.testUsers.emailDomain}`;
  const startTime = Date.now();
  
  const res = http.post(
    `${config.baseUrl}/api/auth/login`,
    JSON.stringify({
      email,
      password: config.testUsers.passwordTemplate,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'auth', type: 'api' },
    }
  );
  
  authLatency.add(Date.now() - startTime);
  
  if (res.status === 200) {
    const token = res.json('token') as string;
    tokens.set(vuId, token);
    return token;
  }
  
  errors.add(1);
  return '';
}

export default function () {
  const vuId = __VU;
  const token = getToken(vuId);
  
  if (!token) return;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Weighted endpoint selection (realistic traffic distribution)
  const rand = Math.random();
  
  if (rand < 0.30) {
    // 30% - Dashboard views
    testDashboard(headers);
  } else if (rand < 0.50) {
    // 20% - Homework endpoints
    testHomework(headers);
  } else if (rand < 0.65) {
    // 15% - Assessment endpoints
    testAssessment(headers);
  } else if (rand < 0.80) {
    // 15% - Regulation endpoints
    testRegulation(headers);
  } else if (rand < 0.90) {
    // 10% - User profile
    testProfile(headers);
  } else {
    // 10% - Miscellaneous
    testMisc(headers);
  }
  
  sleep(0.1); // Small delay between requests
}

function testDashboard(headers: Record<string, string>) {
  const startTime = Date.now();
  const res = http.get(`${config.baseUrl}/api/learner/dashboard`, {
    headers,
    tags: { endpoint: 'dashboard', type: 'api' },
  });
  apiLatency.add(Date.now() - startTime);
  
  const success = check(res, {
    'dashboard status 200': (r) => r.status === 200,
    'dashboard response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  if (!success) errors.add(1);
}

function testHomework(headers: Record<string, string>) {
  // List homework
  const startTime = Date.now();
  const listRes = http.get(`${config.baseUrl}/api/homework`, {
    headers,
    tags: { endpoint: 'homework', type: 'api' },
  });
  apiLatency.add(Date.now() - startTime);
  
  const success = check(listRes, {
    'homework list status 200': (r) => r.status === 200,
    'homework response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  if (!success) errors.add(1);
}

function testAssessment(headers: Record<string, string>) {
  const startTime = Date.now();
  const res = http.get(`${config.baseUrl}/api/assessment/status`, {
    headers,
    tags: { endpoint: 'assessment', type: 'api' },
  });
  apiLatency.add(Date.now() - startTime);
  
  const success = check(res, {
    'assessment status 200': (r) => r.status === 200,
    'assessment response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  if (!success) errors.add(1);
}

function testRegulation(headers: Record<string, string>) {
  // Get regulation status
  const startTime = Date.now();
  const res = http.get(`${config.baseUrl}/api/regulation/status`, {
    headers,
    tags: { endpoint: 'regulation', type: 'api' },
  });
  apiLatency.add(Date.now() - startTime);
  
  const success = check(res, {
    'regulation status 200': (r) => r.status === 200,
    'regulation response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!success) errors.add(1);
}

function testProfile(headers: Record<string, string>) {
  const startTime = Date.now();
  const res = http.get(`${config.baseUrl}/api/user/profile`, {
    headers,
    tags: { endpoint: 'profile', type: 'api' },
  });
  apiLatency.add(Date.now() - startTime);
  
  const success = check(res, {
    'profile status 200': (r) => r.status === 200,
    'profile response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!success) errors.add(1);
}

function testMisc(headers: Record<string, string>) {
  // Health check (no auth needed)
  const healthRes = http.get(`${config.baseUrl}/api/health`, {
    tags: { endpoint: 'health', type: 'api' },
  });
  
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  // Subjects list
  const startTime = Date.now();
  const subjectsRes = http.get(`${config.baseUrl}/api/subjects`, {
    headers,
    tags: { endpoint: 'subjects', type: 'api' },
  });
  apiLatency.add(Date.now() - startTime);
  
  check(subjectsRes, {
    'subjects status 200': (r) => r.status === 200,
  });
}

export function handleSummary(data: object) {
  return {
    'api-load-results.json': JSON.stringify(data, null, 2),
  };
}
