import supabase from './src/config/database.js';

async function addPasswordColumn() {
  console.log('Adding password column to students table...');
  
  // Note: This requires direct SQL execution
  // You'll need to run this SQL in your Supabase dashboard:
  console.log(`
Please run this SQL in your Supabase SQL Editor:

ALTER TABLE students ADD COLUMN password TEXT;

Then run this script again to add test data.
  `);
}

addPasswordColumn();