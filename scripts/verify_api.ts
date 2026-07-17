import axios from 'axios';
import { env } from './backend/config'; // Assuming we can use this or just hardcode

const API_BASE = 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = 'admin@nermaiias.com';
const ADMIN_PASSWORD = 'password';

async function verifyContract(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', token?: string, payload?: any) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios({
      method,
      url: `${API_BASE}${endpoint}`,
      headers,
      data: payload,
      validateStatus: () => true // Resolve all statuses to inspect them
    });

    return {
      endpoint,
      status: response.status,
      data: response.data,
      passed: response.status >= 200 && response.status < 300,
      hasProperEnvelope: response.data && typeof response.data.status === 'string'
    };
  } catch (err: any) {
    return {
      endpoint,
      status: 500,
      error: err.message,
      passed: false
    };
  }
}

async function run() {
  console.log('--- Starting API Regression Checks ---');
  
  const results = [];
  
  // 1. Check Public Endpoint (should be 401 or 403 if it requires auth, 200 if public)
  results.push(await verifyContract('/health/live', 'get'));
  
  // 2. Auth - Admin Login (assuming /admin/auth/login exists, we can mock it or check standard)
  const loginRes = await verifyContract('/admin/auth/login', 'post', undefined, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  results.push(loginRes);

  let token = loginRes.data?.data?.token; // Try to extract token

  // 3. Admin Dashboard
  results.push(await verifyContract('/dashboard/admin/metrics', 'get', token));

  // 4. Batches List
  results.push(await verifyContract('/admin/student-management/batch/list', 'get', token));

  // 5. Courses List
  results.push(await verifyContract('/admin/course/list', 'get', token));

  // 6. Announcements
  results.push(await verifyContract('/admin/announcements/list', 'get', token));

  console.log('\n--- Results ---');
  results.forEach(r => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.endpoint} - Status: ${r.status}`);
    if (!r.passed) console.log(`   Response: ${JSON.stringify(r.data)}`);
    if (r.passed && !r.hasProperEnvelope) console.log(`   WARN: Missing standard envelope { status, data, message }`);
  });
}

run().catch(console.error);
