import supabase from './src/config/database.js';

async function checkSchema() {
  try {
    const { data, error } = await supabase
      .from('problem_statement')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error:', error.message);
    } else if (data && data[0]) {
      console.log('Columns in problem_statement table:');
      console.log(Object.keys(data[0]));
    } else {
      console.log('No rows found in problem_statement table');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkSchema();
