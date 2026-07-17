import { io } from 'socket.io-client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
const BASE_URL = 'http://localhost:3000'; // Assuming backend is on 3000

const generateToken = (uid: string, role: string) => {
  return jwt.sign({ uid, role, email: `${uid}@test.com`, aud: 'demo-test', iss: 'https://securetoken.google.com/demo-test', sub: uid }, JWT_SECRET, { expiresIn: '1h' });
};

async function runSyncValidation() {
  console.log('🚀 Starting Automated Synchronization Validation...\n');

  const liveSessionId = 'val-session-123';
  
  // Create 3 simulated clients
  const webStudentToken = generateToken('web_student_1', 'student');
  const mobileStudentToken = generateToken('mobile_student_2', 'student');
  const teacherToken = generateToken('teacher_1', 'teacher');

  const webClient = io(BASE_URL, { auth: { token: webStudentToken }, query: { liveSessionId } });
  const mobileClient = io(BASE_URL, { auth: { token: mobileStudentToken }, query: { liveSessionId } });
  const teacherClient = io(BASE_URL, { auth: { token: teacherToken }, query: { liveSessionId } });

  let testsPassed = 0;
  let testsFailed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      testsFailed++;
    }
  };

  const awaitEvent = (client: any, event: string, timeout = 3000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout);
      client.once(event, (data: any) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  };

  try {
    // Wait for all to connect
    await Promise.all([
      new Promise(r => webClient.on('connect', r)),
      new Promise(r => mobileClient.on('connect', r)),
      new Promise(r => teacherClient.on('connect', r))
    ]);
    console.log('📡 All 3 clients connected successfully.');

    // 1. Web -> Mobile Chat Sync
    console.log('\n--- Test 1: Web -> Mobile Chat Sync ---');
    const webMsgPayload = { text: 'Hello from Web!', type: 'COMMENT' };
    webClient.emit('comment:send', webMsgPayload);

    // Both mobile and teacher should receive it
    const [mobileRecv, teacherRecv] = await Promise.all([
      awaitEvent(mobileClient, 'comment:new'),
      awaitEvent(teacherClient, 'comment:new')
    ]) as any[];

    assert(mobileRecv.text === webMsgPayload.text, 'Mobile client received Web message');
    assert(teacherRecv.text === webMsgPayload.text, 'Teacher client received Web message');

    const commentId = mobileRecv.id;

    // 2. Teacher Pin Sync
    console.log('\n--- Test 2: Teacher Moderation Sync (Pin) ---');
    teacherClient.emit('comment:moderate', { commentId, action: 'PIN' });

    const [webPinRecv, mobilePinRecv] = await Promise.all([
      awaitEvent(webClient, 'comment:updated'),
      awaitEvent(mobileClient, 'comment:updated')
    ]) as any[];

    assert(webPinRecv.isPinned === true, 'Web client saw message pinned');
    assert(mobilePinRecv.isPinned === true, 'Mobile client saw message pinned');

    // 3. Teacher Delete Sync
    console.log('\n--- Test 3: Teacher Moderation Sync (Delete) ---');
    teacherClient.emit('comment:moderate', { commentId, action: 'DELETE' });

    const [webDelRecv, mobileDelRecv] = await Promise.all([
      awaitEvent(webClient, 'comment:deleted'),
      awaitEvent(mobileClient, 'comment:deleted')
    ]) as any[];

    assert(webDelRecv.id === commentId, 'Web client saw message deleted');
    assert(mobileDelRecv.id === commentId, 'Mobile client saw message deleted');

  } catch (err: any) {
    console.error('❌ Automation Error:', err.message);
  } finally {
    webClient.disconnect();
    mobileClient.disconnect();
    teacherClient.disconnect();

    console.log('\n=======================================');
    console.log(`🏁 Validation Complete. Passed: ${testsPassed} | Failed: ${testsFailed}`);
    console.log('=======================================\n');
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

runSyncValidation();
