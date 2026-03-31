#!/usr/bin/env node

/**
 * Test script to verify toggle-mentor-edit endpoint
 * Run: node test-toggle-route.js
 */

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const FORM_ID = '999d907d-26d4-4716-86df-a5e4c2f6132b'; // Your form ID
const GROUP_ID = 'TYCC203';
const TOKEN = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';

async function testToggleRoute() {
  console.log('🧪 Testing toggle-mentor-edit endpoint...\n');
  console.log(`📍 API Base: ${API_BASE}`);
  console.log(`📋 Form ID: ${FORM_ID}`);
  console.log(`👥 Group ID: ${GROUP_ID}\n`);

  const url = `${API_BASE}/api/admin/evaluation-forms/${FORM_ID}/toggle-mentor-edit`;
  
  console.log(`🔗 Full URL: ${url}`);
  console.log(`📤 Method: PATCH`);
  console.log(`📦 Body: { groupId: "${GROUP_ID}", enabled: true }\n`);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        groupId: GROUP_ID,
        enabled: true
      })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log(`📄 Response Body:`, JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ SUCCESS! Route is working correctly.');
      console.log(`✅ Mentor edit enabled for group: ${GROUP_ID}`);
      console.log(`✅ Enabled groups:`, data.data?.mentor_edit_enabled_groups);
    } else {
      console.log('\n❌ FAILED! Route returned an error.');
      console.log(`❌ Message: ${data.message}`);
    }
  } catch (error) {
    console.log('\n❌ ERROR! Failed to connect to backend.');
    console.log(`❌ Error: ${error.message}`);
    console.log('\n💡 Make sure:');
    console.log('   1. Backend server is running (npm start in reviewpanel-backend)');
    console.log('   2. API_BASE is correct (default: http://localhost:5000)');
    console.log('   3. ADMIN_TOKEN is valid');
  }
}

// Run the test
testToggleRoute();
