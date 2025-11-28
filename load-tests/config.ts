/**
 * k6 Load Testing Configuration
 * 
 * Performance thresholds and test scenarios for AIVO v5
 */

export const config = {
  baseUrl: __ENV.BASE_URL || 'http://localhost:3000',
  wsUrl: __ENV.WS_URL || 'ws://localhost:3001',
  
  // Test scenarios
  scenarios: {
    // Normal school day load
    normalLoad: {
      vus: 100,        // 100 concurrent users
      duration: '10m',
      rampUp: '2m',
    },
    // Peak load (start of school day)
    peakLoad: {
      vus: 500,        // 500 concurrent users
      duration: '5m',
      rampUp: '1m',
    },
    // Stress test
    stressTest: {
      vus: 1000,       // 1000 concurrent users
      duration: '5m',
      rampUp: '2m',
    },
    // Soak test (extended duration)
    soakTest: {
      vus: 200,
      duration: '1h',
      rampUp: '5m',
    },
  },
  
  // Performance thresholds
  thresholds: {
    // General HTTP requests
    'http_req_duration': ['p(95)<2000'],           // 95% under 2s
    'http_req_duration{type:api}': ['p(95)<500'],  // API calls under 500ms
    'http_req_duration{type:ai}': ['p(95)<30000'], // AI calls under 30s
    'http_req_failed': ['rate<0.01'],              // Less than 1% failure
    
    // Specific endpoints
    'http_req_duration{endpoint:health}': ['p(99)<100'],
    'http_req_duration{endpoint:auth}': ['p(95)<500'],
    'http_req_duration{endpoint:dashboard}': ['p(95)<1000'],
    'http_req_duration{endpoint:homework}': ['p(95)<1000'],
    'http_req_duration{endpoint:assessment}': ['p(95)<2000'],
    'http_req_duration{endpoint:regulation}': ['p(95)<500'],
    
    // Custom metrics
    'homework_create_duration': ['p(95)<1000'],
    'hint_request_duration': ['p(95)<5000'],
    'assessment_question_duration': ['p(95)<3000'],
    
    // Error rates
    'errors': ['rate<0.01'],
    'ws_errors': ['rate<0.05'],
  },
  
  // Test user configuration
  testUsers: {
    learners: 100,       // Number of test learner accounts
    teachers: 20,        // Number of test teacher accounts
    passwordTemplate: 'TestPassword123!',
    emailDomain: 'aivo.test',
  },
};

// Stage configurations for different test types
export const stages = {
  smoke: [
    { duration: '1m', target: 5 },
    { duration: '2m', target: 5 },
    { duration: '1m', target: 0 },
  ],
  normal: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  peak: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  stress: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '5m', target: 1000 },
    { duration: '5m', target: 1000 },
    { duration: '5m', target: 0 },
  ],
  soak: [
    { duration: '5m', target: 200 },
    { duration: '50m', target: 200 },
    { duration: '5m', target: 0 },
  ],
};

export default config;
