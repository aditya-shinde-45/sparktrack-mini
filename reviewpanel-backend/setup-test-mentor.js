import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 Setting up test mentor...\n');

async function setup() {
  // Check existing mentors
  const { data: existing, error: fetchError } = await supabase
    .from('mentors')
    .select('*')
    .limit(5);

  if (fetchError) {
    console.error('❌ Error fetching mentors:', fetchError.message);
    return;
  }

  console.log(`📋 Found ${existing?.length || 0} existing mentors`);
  
  if (existing && existing.length > 0) {
    console.log('\n✅ Existing mentors:');
    existing.forEach((m, i) => {
      console.log(`   ${i + 1}. Name: ${m.mentor_name}`);
      console.log(`      Contact: ${m.contact_number}`);
      console.log(`      Group: ${m.group_id}\n`);
    });
    
    console.log('💡 You can test login with any of the above credentials\n');
    console.log('Example curl command:');
    console.log(`curl -X POST http://localhost:5000/api/pbl3/mentor/login \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"mentor_name":"${existing[0].mentor_name}","contact_number":"${existing[0].contact_number}"}'`);
    return;
  }

  // No mentors exist, create a test one
  console.log('\n⚠️  No mentors found. Creating test mentor...');
  
  const { data: newMentor, error: insertError } = await supabase
    .from('mentors')
    .insert([{
      mentor_name: 'Test Mentor',
      contact_number: '9876543210',
      group_id: 'TEST01'
    }])
    .select();

  if (insertError) {
    console.error('❌ Failed to create mentor:', insertError.message);
    return;
  }

  console.log('✅ Test mentor created successfully!');
  console.log(`   Name: ${newMentor[0].mentor_name}`);
  console.log(`   Contact: ${newMentor[0].contact_number}`);
  console.log(`   Group: ${newMentor[0].group_id}\n`);
  
  console.log('💡 Test login with:');
  console.log(`curl -X POST http://localhost:5000/api/pbl3/mentor/login \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"mentor_name":"Test Mentor","contact_number":"9876543210"}'`);
}

setup().catch(console.error);
