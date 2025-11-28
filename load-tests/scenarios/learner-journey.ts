/**
 * Learner Journey Load Test
 * 
 * Simulates realistic learner behavior patterns:
 * 1. Login
 * 2. View dashboard
 * 3. Start homework
 * 4. Request hints (AI endpoint)
 * 5. Submit answers
 * 6. Check in emotions (regulation)
 * 7. Take assessment
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { config, stages } from '../config';

// Custom metrics
const homeworkCreateDuration = new Trend('homework_create_duration');
const hintRequestDuration = new Trend('hint_request_duration');
const assessmentQuestionDuration = new Trend('assessment_question_duration');
const errors = new Rate('errors');

// Get scenario from environment
const scenario = __ENV.SCENARIO || 'normal';

export const options = {
  stages: stages[scenario as keyof typeof stages] || stages.normal,
  thresholds: config.thresholds,
  tags: {
    testType: 'learner-journey',
    scenario: scenario,
  },
};

// Token cache per VU
let token = '';
let headers: Record<string, string> = {};

export function setup() {
  // Verify server is accessible
  const res = http.get(`${config.baseUrl}/api/health`, {
    tags: { endpoint: 'health', type: 'api' },
  });
  
  check(res, {
    'server is healthy': (r) => r.status === 200,
  });
  
  if (res.status !== 200) {
    throw new Error(`Server health check failed: ${res.status}`);
  }
  
  return { baseUrl: config.baseUrl };
}

export default function (data: { baseUrl: string }) {
  const vuId = __VU;
  const baseUrl = data.baseUrl;
  
  // Login once per VU iteration
  if (!token) {
    group('login', () => {
      const email = `test-learner-${vuId % config.testUsers.learners}@${config.testUsers.emailDomain}`;
      const loginRes = http.post(
        `${baseUrl}/api/auth/login`,
        JSON.stringify({
          email,
          password: config.testUsers.passwordTemplate,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { endpoint: 'auth', type: 'api' },
        }
      );
      
      const success = check(loginRes, {
        'login successful': (r) => r.status === 200,
        'has token': (r) => r.json('token') !== undefined,
      });
      
      if (success) {
        token = loginRes.json('token') as string;
        headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
      } else {
        errors.add(1);
      }
    });
  }
  
  if (!token) return; // Skip if login failed
  
  // Think time
  sleep(Math.random() * 2 + 1);
  
  // View Dashboard
  group('dashboard', () => {
    const dashboardRes = http.get(`${baseUrl}/api/learner/dashboard`, {
      headers,
      tags: { endpoint: 'dashboard', type: 'api' },
    });
    
    const success = check(dashboardRes, {
      'dashboard loaded': (r) => r.status === 200,
      'has homework list': (r) => r.json('homework') !== undefined,
    });
    
    if (!success) errors.add(1);
  });
  
  sleep(Math.random() * 3 + 2);
  
  // Start Homework
  let homeworkId: string | null = null;
  group('homework', () => {
    // Get available homework
    const listRes = http.get(`${baseUrl}/api/homework`, {
      headers,
      tags: { endpoint: 'homework', type: 'api' },
    });
    
    check(listRes, {
      'homework list loaded': (r) => r.status === 200,
    });
    
    const homeworkList = listRes.json('data') as Array<{ id: string }>;
    if (homeworkList && homeworkList.length > 0) {
      homeworkId = homeworkList[0].id;
      
      // Start a homework session
      const startTime = Date.now();
      const startRes = http.post(
        `${baseUrl}/api/homework/${homeworkId}/start`,
        JSON.stringify({}),
        {
          headers,
          tags: { endpoint: 'homework', type: 'api' },
        }
      );
      homeworkCreateDuration.add(Date.now() - startTime);
      
      check(startRes, {
        'homework started': (r) => r.status === 200 || r.status === 201,
      });
    }
  });
  
  sleep(Math.random() * 5 + 3);
  
  // Request AI Hint (AI endpoint - longer timeout expected)
  if (homeworkId) {
    group('ai-hints', () => {
      const hintStartTime = Date.now();
      const hintRes = http.post(
        `${baseUrl}/api/homework/${homeworkId}/hint`,
        JSON.stringify({
          questionIndex: 0,
          previousAttempts: 1,
        }),
        {
          headers,
          tags: { endpoint: 'hint', type: 'ai' },
          timeout: '30s',
        }
      );
      hintRequestDuration.add(Date.now() - hintStartTime);
      
      const success = check(hintRes, {
        'hint received': (r) => r.status === 200,
        'hint has content': (r) => r.json('hint') !== undefined,
      });
      
      if (!success) errors.add(1);
    });
  }
  
  sleep(Math.random() * 3 + 2);
  
  // Submit Homework Answer
  if (homeworkId) {
    group('submit-answer', () => {
      const submitRes = http.post(
        `${baseUrl}/api/homework/${homeworkId}/submit`,
        JSON.stringify({
          questionIndex: 0,
          answer: 'Sample answer for load testing',
        }),
        {
          headers,
          tags: { endpoint: 'homework', type: 'api' },
        }
      );
      
      check(submitRes, {
        'answer submitted': (r) => r.status === 200 || r.status === 201,
      });
    });
  }
  
  sleep(Math.random() * 2 + 1);
  
  // Emotion Check-in (Regulation)
  group('emotion-checkin', () => {
    const emotions = ['happy', 'calm', 'sad', 'anxious', 'excited'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const checkinRes = http.post(
      `${baseUrl}/api/regulation/check-in`,
      JSON.stringify({
        emotion: randomEmotion,
        intensity: Math.floor(Math.random() * 10) + 1,
        context: 'homework',
      }),
      {
        headers,
        tags: { endpoint: 'regulation', type: 'api' },
      }
    );
    
    const success = check(checkinRes, {
      'emotion check-in successful': (r) => r.status === 200 || r.status === 201,
    });
    
    if (!success) errors.add(1);
  });
  
  sleep(Math.random() * 3 + 2);
  
  // Take Assessment Question
  group('assessment', () => {
    // Get next assessment question
    const questionStartTime = Date.now();
    const questionRes = http.get(`${baseUrl}/api/assessment/next-question`, {
      headers,
      tags: { endpoint: 'assessment', type: 'api' },
    });
    assessmentQuestionDuration.add(Date.now() - questionStartTime);
    
    const success = check(questionRes, {
      'assessment question received': (r) => r.status === 200,
      'question has content': (r) => r.json('question') !== undefined,
    });
    
    if (success) {
      sleep(Math.random() * 10 + 5); // Simulate reading/thinking
      
      // Submit answer
      const submitRes = http.post(
        `${baseUrl}/api/assessment/submit-answer`,
        JSON.stringify({
          questionId: questionRes.json('question.id'),
          answer: 'A', // Random multiple choice
          timeSpent: Math.floor(Math.random() * 30) + 10,
        }),
        {
          headers,
          tags: { endpoint: 'assessment', type: 'api' },
        }
      );
      
      check(submitRes, {
        'assessment answer submitted': (r) => r.status === 200 || r.status === 201,
      });
    }
  });
  
  sleep(Math.random() * 2 + 1);
}

export function teardown(data: { baseUrl: string }) {
  console.log('Learner journey load test completed');
}
