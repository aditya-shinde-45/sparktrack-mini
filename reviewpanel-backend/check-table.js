import supabase from './src/config/database.js';

async function checkStudentsTable() {
  console.log('Checking students table structure...');
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error querying students table:', error);
  } else {
    console.log('Students table sample data:', data);
    if (data.length > 0) {
      console.log('Available columns:', Object.keys(data[0]));
    }
  }
}

checkStudentsTable();