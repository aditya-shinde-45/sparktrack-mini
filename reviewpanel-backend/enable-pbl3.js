import supabase from './src/config/database.js';

async function enablePBL3() {
  try {
    console.log('Checking current status...');
    
    // Check current status
    const { data: current, error: checkError } = await supabase
      .from('deadlines_control')
      .select('*')
      .eq('key', 'pbl_review_3')
      .single();
    
    if (checkError) {
      console.error('Error checking status:', checkError);
      process.exit(1);
    }
    
    console.log('Current status:', current);
    
    // Update to enable
    const { data, error } = await supabase
      .from('deadlines_control')
      .update({ enabled: true })
      .eq('key', 'pbl_review_3')
      .select();
    
    if (error) {
      console.error('Error enabling PBL Review 3:', error);
      process.exit(1);
    }
    
    console.log('\n✅ PBL Review 3 has been enabled!');
    console.log('Updated data:', data);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

enablePBL3();
