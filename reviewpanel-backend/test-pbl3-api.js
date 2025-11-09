import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🧪 PBL3 API Testing Suite\n');
console.log('='.repeat(50));

// Test data
let mentorToken = null;
let externalToken = null;
let testGroupId = null;

// Helper function to make API requests
async function apiCall(method, endpoint, data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test 1: Check if mentor exists in database
async function test1_checkMentor() {
  console.log('\n📋 Test 1: Check Mentors in Database');
  console.log('-'.repeat(50));
  
  const { data, error } = await supabase
    .from('mentors')
    .select('mentor_name, contact_number, group_id')
    .limit(3);

  if (error) {
    console.log('❌ Error:', error.message);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No mentors found. Creating test mentor...');
    
    // Create a test mentor
    const { data: newMentor, error: insertError } = await supabase
      .from('mentors')
      .insert([{
        mentor_name: 'Test Mentor',
        contact_number: '9876543210',
        group_id: 'TEST01'
      }])
      .select();

    if (insertError) {
      console.log('❌ Failed to create mentor:', insertError.message);
      return null;
    }
    
    console.log('✅ Test mentor created');
    return newMentor[0];
  }

  console.log(`✅ Found ${data.length} mentors:`);
  data.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.mentor_name} (${m.contact_number}) - Group: ${m.group_id}`);
  });
  
  return data[0];
}

// Test 2: Mentor Login
async function test2_mentorLogin(mentor) {
  console.log('\n🔐 Test 2: Mentor Login');
  console.log('-'.repeat(50));
  
  if (!mentor) {
    console.log('❌ No mentor data available');
    return false;
  }

  const result = await apiCall('POST', '/pbl3/mentor/login', {
    mentor_name: mentor.mentor_name,
    contact_number: mentor.contact_number
  });

  console.log(`Status: ${result.status}`);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Login successful');
    console.log('Token:', result.data.data.token.substring(0, 20) + '...');
    mentorToken = result.data.data.token;
    testGroupId = mentor.group_id;
    return true;
  } else {
    console.log('❌ Login failed');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

// Test 3: Get Mentor Groups
async function test3_getMentorGroups() {
  console.log('\n📦 Test 3: Get Mentor Groups');
  console.log('-'.repeat(50));
  
  if (!mentorToken) {
    console.log('❌ No mentor token available');
    return false;
  }

  const result = await apiCall('GET', '/pbl3/mentor/groups', null, mentorToken);
  
  console.log(`Status: ${result.status}`);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Groups retrieved');
    console.log('Groups:', result.data.data.groups);
    return true;
  } else {
    console.log('❌ Failed to get groups');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

// Test 4: Check if PBL3 is enabled
async function test4_checkDeadline() {
  console.log('\n⏰ Test 4: Check PBL3 Deadline Status');
  console.log('-'.repeat(50));
  
  const { data, error } = await supabase
    .from('deadlines_control')
    .select('*')
    .eq('key', 'pbl_review_3')
    .single();

  if (error) {
    console.log('❌ Error:', error.message);
    return false;
  }

  console.log('Status:', data.enabled ? '✅ ENABLED' : '❌ DISABLED');
  console.log('Details:', JSON.stringify(data, null, 2));
  
  if (!data.enabled) {
    console.log('\n⚠️  PBL3 is currently disabled. Some APIs will be blocked.');
    console.log('To enable: UPDATE deadlines_control SET enabled = true WHERE key = \'pbl_review_3\';');
  }
  
  return data.enabled;
}

// Test 5: Register Externals
async function test5_registerExternals() {
  console.log('\n👥 Test 5: Register External Evaluators');
  console.log('-'.repeat(50));
  
  if (!mentorToken || !testGroupId) {
    console.log('❌ Missing mentor token or group ID');
    return false;
  }

  const result = await apiCall('POST', '/pbl3/register-externals', {
    group_id: testGroupId,
    externals: [
      {
        name: 'Dr. External One',
        organization: 'Test Organization',
        phone: '9998887776',
        email: 'external1@test.com'
      },
      {
        name: 'Prof. External Two',
        organization: 'Another Org',
        phone: '8887776665',
        email: 'external2@test.com'
      }
    ]
  }, mentorToken);

  console.log(`Status: ${result.status}`);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Externals registered successfully');
    console.log('OTP Note:', result.data.data.otp_note);
    return true;
  } else {
    console.log('❌ Failed to register externals');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

// Test 6: Verify OTP
async function test6_verifyOTP() {
  console.log('\n🔑 Test 6: Verify External OTP');
  console.log('-'.repeat(50));
  
  if (!testGroupId) {
    console.log('❌ No test group ID available');
    return false;
  }

  const result = await apiCall('POST', '/pbl3/verify-otp', {
    group_id: testGroupId,
    email: 'external1@test.com',
    otp: '123456'
  });

  console.log(`Status: ${result.status}`);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ OTP verified successfully');
    console.log('Token:', result.data.data.token.substring(0, 20) + '...');
    externalToken = result.data.data.token;
    return true;
  } else {
    console.log('❌ OTP verification failed');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

// Test 7: Get Evaluation Data
async function test7_getEvaluation() {
  console.log('\n📊 Test 7: Get Evaluation Data');
  console.log('-'.repeat(50));
  
  if (!externalToken && !mentorToken) {
    console.log('❌ No token available');
    return false;
  }

  const token = externalToken || mentorToken;
  const result = await apiCall('GET', `/pbl3/evaluation/${testGroupId}`, null, token);

  console.log(`Status: ${result.status}`);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Evaluation data retrieved');
    console.log('Evaluations count:', result.data.data.evaluations?.length || 0);
    return true;
  } else {
    console.log('❌ Failed to get evaluation data');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

// Run all tests
async function runTests() {
  try {
    const mentor = await test1_checkMentor();
    await test2_mentorLogin(mentor);
    await test3_getMentorGroups();
    const isPbl3Enabled = await test4_checkDeadline();
    
    if (isPbl3Enabled) {
      await test5_registerExternals();
      await test6_verifyOTP();
      await test7_getEvaluation();
    } else {
      console.log('\n⚠️  Skipping deadline-protected tests (PBL3 is disabled)');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test Suite Complete!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  }
}

// Wait for server to be ready
console.log('⏳ Waiting for server...\n');
setTimeout(runTests, 2000);
