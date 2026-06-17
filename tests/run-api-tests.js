/**
 * EviCheck - Automated API & Integration Test Suite
 * Zero-dependency Node.js script. Validate local servers and database connections.
 * 
 * Run with: node tests/run-api-tests.js
 */

const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5001';

const testUser = {
  name: 'Automated Tester',
  email: `test_${Math.floor(Math.random() * 1000000)}@evicheck-test.com`,
  password: 'Password123!',
  userType: 'analyst'
};

let sessionCookie = '';
let createdCaseId = '';
let createdEvidenceId = '';
let partnerUserId = ''; // Admin user to test chat with
let currentUserId = ''; // The registered user's ID

// Helper to print colored console logs
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  pass: (msg) => console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`),
  fail: (msg) => console.log(`\x1b[31m[FAIL]\x1b[0m ${msg}`),
  section: (title) => console.log(`\n\x1b[35m=== ${title} ===\x1b[0m`)
};

async function runTests() {
  log.section('EviCheck Automated Test Suite');
  let passedCount = 0;
  let failedCount = 0;

  const testSteps = [
    { name: 'Flask AI Service Health Check', fn: testFlaskHealth },
    { name: 'User Registration (POST /api/auth/signup)', fn: testSignup },
    { name: 'User Login & Session Extraction (POST /api/auth/login)', fn: testLogin },
    { name: 'Authenticated Profile Lookup (GET /api/user/profile)', fn: testProfile },
    { name: 'Create Case (POST /api/cases)', fn: testCreateCase },
    { name: 'List Cases (GET /api/cases)', fn: testListCases },
    { name: 'Upload Mock Evidence (POST /api/evidence)', fn: testUploadEvidence },
    { name: 'List Evidence Records (GET /api/evidence)', fn: testListEvidence },
    { name: 'Send Notification to Admin (POST /api/admin/notifications)', fn: testAdminNotification },
    { name: 'Fetch Chat Contacts (GET /api/contacts)', fn: testFetchContacts },
    { name: 'Send Chat Message (POST /api/messages)', fn: testSendChatMessage },
    { name: 'Fetch Chat History (GET /api/messages?with=...)', fn: testFetchChatHistory },
    { name: 'Chat Local File Attachment (POST /api/chat-upload)', fn: testChatFileUpload },
    { name: 'Cleanup Test Case & Evidence', fn: testCleanup }
  ];

  for (const step of testSteps) {
    try {
      const start = Date.now();
      await step.fn();
      const duration = Date.now() - start;
      log.pass(`${step.name} (${duration}ms)`);
      passedCount++;
    } catch (error) {
      log.fail(`${step.name} failed: ${error.message}`);
      failedCount++;
    }
  }

  log.section('Test Run Summary');
  console.log(`Total Passed: \x1b[32m${passedCount}\x1b[0m`);
  console.log(`Total Failed: \x1b[31m${failedCount}\x1b[0m`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// 1. Health Check
async function testFlaskHealth() {
  const res = await fetch(`${BACKEND_URL}/health`);
  if (!res.ok) throw new Error(`Flask server returned status ${res.status}`);
  const data = await res.json();
  if (!data.status && !data.message) throw new Error('Invalid Flask response schema');
}

// 2. Signup
async function testSignup() {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Signup returned status ${res.status}`);
  }
  const data = await res.json();
  if (!data.user || data.user.email !== testUser.email) throw new Error('User not registered correctly');
}

// 3. Login & Session cookie
async function testLogin() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Login returned status ${res.status}`);
  }
  
  // Extract set-cookie
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) throw new Error('No set-cookie headers received from login response');
  
  const match = setCookie.match(/evicheck_session=([^;]+)/);
  if (!match) throw new Error('evicheck_session cookie not found in set-cookie header');
  
  sessionCookie = match[0];
}

// 4. Authenticated profile check
async function testProfile() {
  const res = await fetch(`${BASE_URL}/api/user/profile`, {
    headers: { 'Cookie': sessionCookie }
  });
  if (!res.ok) throw new Error(`Profile returned status ${res.status}`);
  const data = await res.json();
  if (data.user.email !== testUser.email) throw new Error('Session user mismatch');
  currentUserId = data.user.id || data.user._id;
}

// 5. Create Case
async function testCreateCase() {
  const res = await fetch(`${BASE_URL}/api/cases`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': sessionCookie 
    },
    body: JSON.stringify({
      caseNumber: `TEST-CASE-${Math.floor(Math.random() * 100000)}`,
      caseName: 'Automated Integration Testing Case',
      createdDate: new Date().toISOString()
    })
  });
  if (!res.ok) throw new Error(`Create case returned status ${res.status}`);
  const data = await res.json();
  createdCaseId = data.case.id || data.case._id;
  if (!createdCaseId) throw new Error('No case ID returned');
}

// 6. List Cases
async function testListCases() {
  const res = await fetch(`${BASE_URL}/api/cases`, {
    headers: { 'Cookie': sessionCookie }
  });
  if (!res.ok) throw new Error(`List cases returned status ${res.status}`);
  const data = await res.json();
  const found = data.cases.some(c => (c.id || c._id) === createdCaseId);
  if (!found) throw new Error('Created case not found in list');
}

// 7. Upload mock evidence
async function testUploadEvidence() {
  // Simple 1x1 transparent base64 PNG
  const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const res = await fetch(`${BASE_URL}/api/evidence`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': sessionCookie 
    },
    body: JSON.stringify({
      fileName: 'automated_test_mock_file.png',
      imageData: mockBase64,
      size: '116 B',
      type: 'image/png',
      caseId: createdCaseId,
      caseNumber: 'TEST-CASE-MOCK',
      caseName: 'Automated Integration Testing Case',
      evidenceName: 'Forensic Mock Ingestion Check',
      status: 'pending'
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Upload returned status ${res.status}`);
  }
  const data = await res.json();
  createdEvidenceId = data.evidence.id || data.evidence._id;
  if (!createdEvidenceId) throw new Error('No evidence ID returned');
}

// 8. List Evidence
async function testListEvidence() {
  const res = await fetch(`${BASE_URL}/api/evidence`, {
    headers: { 'Cookie': sessionCookie }
  });
  if (!res.ok) throw new Error(`List evidence returned status ${res.status}`);
  const data = await res.json();
  const found = data.evidence.some(e => (e.id || e._id) === createdEvidenceId);
  if (!found) throw new Error('Uploaded evidence not found in database records');
}

// 9. Send Notification to Admin
async function testAdminNotification() {
  const res = await fetch(`${BASE_URL}/api/admin/notifications`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': sessionCookie 
    },
    body: JSON.stringify({
      evidenceId: createdEvidenceId,
      fileName: 'automated_test_mock_file.png',
      caseName: 'Automated Integration Testing Case',
      analystName: testUser.name,
      verdict: 'authentic',
      confidence: 100,
      fullReport: 'Mock Report details sent via automated tests.'
    })
  });
  if (!res.ok) throw new Error(`Send admin notification returned status ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error('Notification save failed');
}

// 10. Fetch Chat Contacts
async function testFetchContacts() {
  const res = await fetch(`${BASE_URL}/api/contacts`, {
    headers: { 'Cookie': sessionCookie }
  });
  if (!res.ok) throw new Error(`Fetch contacts returned status ${res.status}`);
  const data = await res.json();
  
  // Find an admin or any partner user to test chat with
  const partner = data.contacts.find(c => c.userType === 'admin' || c._id !== testUser.email);
  if (partner) {
    partnerUserId = partner._id;
  } else {
    // If database has no other users, mock setting partner to self/current user for testing
    partnerUserId = currentUserId || '767bf2b5-4398-47b5-9b6b-305ecf440ac7';
  }
}

// 11. Send Chat Message
async function testSendChatMessage() {
  const res = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': sessionCookie 
    },
    body: JSON.stringify({
      toUserId: partnerUserId,
      message: 'Automated integration check message.'
    })
  });
  if (!res.ok) throw new Error(`Send message returned status ${res.status}`);
}

// 12. Fetch Chat History
async function testFetchChatHistory() {
  const res = await fetch(`${BASE_URL}/api/messages?with=${partnerUserId}`, {
    headers: { 'Cookie': sessionCookie }
  });
  if (!res.ok) throw new Error(`Fetch chat history returned status ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.messages) || data.messages.length === 0) {
    throw new Error('Sent message not found in chat history');
  }
}

// 13. Chat Local File Attachment
async function testChatFileUpload() {
  const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const res = await fetch(`${BASE_URL}/api/chat-upload`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': sessionCookie 
    },
    body: JSON.stringify({
      fileData: mockBase64
    })
  });
  if (!res.ok) throw new Error(`Chat upload API returned status ${res.status}`);
  const data = await res.json();
  if (!data.url || !data.url.startsWith('http')) throw new Error('Cloudinary attachment URL was not returned');
}

// 14. Cleanup
async function testCleanup() {
  // Delete evidence
  if (createdEvidenceId) {
    const res = await fetch(`${BASE_URL}/api/evidence/${createdEvidenceId}`, {
      method: 'DELETE',
      headers: { 'Cookie': sessionCookie }
    });
    if (!res.ok) throw new Error(`Failed to delete evidence: status ${res.status}`);
  }

  // Delete case
  if (createdCaseId) {
    const res = await fetch(`${BASE_URL}/api/cases/${createdCaseId}`, {
      method: 'DELETE',
      headers: { 'Cookie': sessionCookie }
    });
    if (!res.ok) throw new Error(`Failed to delete case: status ${res.status}`);
  }
}

runTests();
