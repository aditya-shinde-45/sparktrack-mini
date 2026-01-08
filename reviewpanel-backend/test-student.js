import supabase from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function createTestStudent() {
  const testPassword = 'password123';
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  
  const testStudent = {
    enrollment_no: 'TEST001',
    email_id: 'test@student.com',
    password: hashedPassword,
    name: 'Test Student'
  };

  console.log('Creating test student:', testStudent);
  
  const { data, error } = await supabase
    .from('students')
    .insert([testStudent])
    .select();

  if (error) {
    console.error('Error creating test student:', error);
  } else {
    console.log('Test student created successfully:', data);
    console.log(`\nLogin credentials:`);
    console.log(`Enrollment No: ${testStudent.enrollment_no}`);
    console.log(`Password: ${testPassword}`);
  }
}

createTestStudent();