import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const checkScreenshotData = async () => {
  try {
    console.log('🔍 Checking Screenshot/File Data in Database...\n');

    const { data, error } = await supabase
      .from('evaluation_form_submissions')
      .select('id, group_id, evaluations')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    data.forEach((submission, idx) => {
      console.log(`\n📝 Submission ${idx + 1} - Group: ${submission.group_id}`);
      console.log('='.repeat(60));

      if (submission.evaluations && Array.isArray(submission.evaluations)) {
        submission.evaluations.forEach((evaluation, studentIdx) => {
          console.log(`\n  Student ${studentIdx + 1}: ${evaluation.student_name}`);
          
          if (evaluation.marks) {
            // Find all file-related fields
            const fileFields = ['screenshot', 'upload_screenshot_of_meeting', 'file_upload'];
            
            fileFields.forEach(fieldName => {
              if (fieldName in evaluation.marks) {
                const value = evaluation.marks[fieldName];
                console.log(`\n    📎 Field: ${fieldName}`);
                console.log(`       Type: ${typeof value}`);
                console.log(`       Value: ${JSON.stringify(value, null, 2)}`);
              }
            });
          }
        });
      }
    });

    console.log('\n\n✅ Screenshot data check complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

checkScreenshotData();
