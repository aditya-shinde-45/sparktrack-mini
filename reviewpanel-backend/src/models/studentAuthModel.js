import supabase from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Student auth model for student authentication
 */
class StudentAuthModel {
  constructor() {
    this.studentsTable = 'students';
  }

  /**
   * Find student by enrollment number
   * @param {string} enrollmentNo - Student enrollment number
   */
  async findStudentByEnrollmentNo(enrollmentNo) {
    const { data, error } = await supabase
      .from(this.studentsTable)
      .select('enrollment_no, email_id, contact')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (error) {
      console.log('Student not found:', enrollmentNo);
      return null;
    }
    return data;
  }

  /**
   * Validate student credentials
   * @param {string} enrollmentNo - Student enrollment number
   * @param {string} password - Student password (contact number)
   */
  async validateCredentials(enrollmentNo, password) {
    const student = await this.findStudentByEnrollmentNo(enrollmentNo);
    
    if (!student) return null;
    
    // Use contact number as password
    if (password === student.contact) {
      return {
        student_id: student.enrollment_no,
        enrollment_no: student.enrollment_no,
        email: student.email_id,
        role: 'student'
      };
    }
    
    return null;
  }

  /**
   * Generate JWT token for student
   * @param {object} student - Student data
   * @param {string} expiresIn - Token expiration time (default: 1d)
   */
  generateToken(student, expiresIn = '1d') {
    return jwt.sign(student, config.jwt.secret, { expiresIn });
  }

  /**
   * Get student profile
   * @param {string} enrollmentNo - Student enrollment number
   */
  async getStudentProfile(enrollmentNo) {
    const { data, error } = await supabase
      .from(this.studentsTable)
      .select('*')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Update student password (contact number)
   * @param {string} enrollmentNo - Student enrollment number
   * @param {string} newPassword - New contact number
   */
  async updatePassword(enrollmentNo, newPassword) {
    const { error } = await supabase
      .from(this.studentsTable)
      .update({ contact: newPassword })
      .eq('enrollment_no', enrollmentNo);

    if (error) throw error;
    return true;
  }

  /**
   * Find student by ID (enrollment number)
   * @param {string} id - Student enrollment number
   */
  async findById(id) {
    const { data, error } = await supabase
      .from(this.studentsTable)
      .select('enrollment_no, email_id, name')
      .eq('enrollment_no', id)
      .single();

    if (error) return null;
    
    return {
      id: data.enrollment_no,
      enrollment_no: data.enrollment_no,
      email: data.email_id,
      name: data.name,
      role: 'student'
    };
  }
}

export default new StudentAuthModel();