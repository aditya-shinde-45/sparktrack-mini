import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const checkSubmissions = async () => {
  try {
    console.log('🔍 Checking evaluation form submissions in database...\n');

    const { data, error } = await supabase
      .from('evaluation_form_submissions')
      .select('id, form_id, group_id, external_name, feedback, evaluations, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching submissions:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No submissions found in database');
      return;
    }

    console.log(`✅ Found ${data.length} submission(s):\n`);

    data.forEach((submission, index) => {
      console.log(`\n--- Submission ${index + 1} ---`);
      console.log(`ID: ${submission.id}`);
      console.log(`Form ID: ${submission.form_id}`);
      console.log(`Group ID: ${submission.group_id}`);
      console.log(`External Name: ${submission.external_name}`);
      console.log(`Feedback: ${submission.feedback || 'N/A'}`);
      console.log(`Created: ${submission.created_at}`);
      
      if (submission.evaluations && Array.isArray(submission.evaluations)) {
        console.log(`\n📋 Evaluations (${submission.evaluations.length} student(s)):`);
        
        submission.evaluations.forEach((evaluation, idx) => {
          console.log(`\n  Student ${idx + 1}:`);
          console.log(`    - Enrollment: ${evaluation.enrollment_no || evaluation.enrollement_no}`);
          console.log(`    - Name: ${evaluation.student_name}`);
          console.log(`    - Absent: ${evaluation.absent || false}`);
          console.log(`    - Total: ${evaluation.total || 0}`);
          
          if (evaluation.marks) {
            console.log(`    - Marks Keys: ${Object.keys(evaluation.marks).join(', ')}`);
            
            // Check for file data
            Object.entries(evaluation.marks).forEach(([key, value]) => {
              if (typeof value === 'object' && value !== null && value.url) {
                console.log(`      📎 File Field: ${key}`);
                console.log(`         URL: ${value.url}`);
                console.log(`         Name: ${value.name}`);
                console.log(`         Type: ${value.type}`);
              } else if (typeof value === 'string' && value.includes('http')) {
                console.log(`      🔗 URL Field: ${key} = ${value}`);
              } else if (typeof value === 'number' || typeof value === 'boolean') {
                console.log(`      ✓ ${key}: ${value}`);
              }
            });
          }
        });
      }
    });

    console.log('\n\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

checkSubmissions();
