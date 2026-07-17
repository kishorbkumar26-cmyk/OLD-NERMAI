import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metric to track error rate
export let errorRate = new Rate('errors');

// Test Configuration
export let options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 200 }, // Ramp up to 200 users (Stress)
    { duration: '1m', target: 200 },  // Stay at 200 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms
    errors: ['rate<0.01'], // Error rate should be less than 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api/v1';

export default function () {
  const liveSessionId = 'load-test-session';
  const token = __ENV.TEST_TOKEN || 'mock-token-for-k6';

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  // 1. Fetch Comments
  let resGet = http.get(`${BASE_URL}/live-comments/${liveSessionId}`, params);
  
  let successGet = check(resGet, {
    'GET comments status is 200': (r) => r.status === 200,
  });
  errorRate.add(!successGet);

  sleep(1);

  // 2. Post a Comment (Simulating active chat)
  // To avoid spamming DB too heavily in a simple test, we only post 10% of the time
  if (Math.random() < 0.1) {
    let payload = JSON.stringify({
      liveSessionId,
      type: 'COMMENT',
      text: `Hello from k6 user ${__VU} at ${new Date().toISOString()}`,
    });

    let resPost = http.post(`${BASE_URL}/live-comments`, payload, params);
    
    let successPost = check(resPost, {
      'POST comment status is 201': (r) => r.status === 201,
    });
    errorRate.add(!successPost);
  }

  // Simulate user reading time
  sleep(Math.random() * 3 + 2); // Sleep between 2-5 seconds
}
