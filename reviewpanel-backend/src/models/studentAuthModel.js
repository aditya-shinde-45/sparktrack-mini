import supabase from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import config from '../config/index.js';

// Configure dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Student auth model for student authentication
 */
class StudentAuthModel {
  constructor() {
    this.authTable = 'student_auth';
    this.studentsTable = 'students';
    this.profileTable = 'student_profiles';
  }

  /**
   * Generate a random OTP
   * @param {number} length - Length of OTP
   */
  generateOTP(length = 6) {
    return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
  }

  /**
   * Find student by email
   * @param {string} email - Student email
   */
  async findStudentByEmail(email) {
    const { data, error } = await supabase
      .from(this.authTable)
      .select('email')
      .eq('email', email)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Find student auth by enrollment number
   * @param {string} enrollmentNo - Student enrollment number
   */
  async findStudentByEnrollmentNo(enrollmentNo) {
    const { data, error } = await supabase
      .from(this.authTable)
      .select('enrollment_no, email, password_hash')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Check if email exists in students table
   * @param {string} email - Student email
   */
  async checkEmailInRecords(email) {
    const { data, error } = await supabase
      .from(this.studentsTable)
      .select('enrollment_no, email_id')
      .eq('email_id', email)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Save OTP for student
   * @param {string} email - Student email
   * @param {string} enrollmentNo - Student enrollment number
   */
  async saveOtp(email, enrollmentNo) {
    const otp = this.generateOTP();
    const expiry = dayjs().utc().add(10, 'minute').toISOString();
    
    const { error } = await supabase
      .from(this.authTable)
      .insert([{
        enrollment_no: enrollmentNo,
        email: email,
        otp,
        otp_expiry: expiry
      }]);

    if (error) throw error;
    
    return { otp, expiry };
  }

  /**
   * Update OTP for student
   * @param {string} email - Student email
   */
  async updateOtp(email) {
    const otp = this.generateOTP();
    const expiry = dayjs().utc().add(10, 'minute').toISOString();
    
    const { error } = await supabase
      .from(this.authTable)
      .update({ otp, otp_expiry: expiry })
      .eq('email', email);

    if (error) throw error;
    
    return { otp, expiry };
  }

  /**
   * Verify OTP
   * @param {string} email - Student email
   * @param {string} otp - OTP to verify
   */
  async verifyOtp(email, otp) {
    const { data, error } = await supabase
      .from(this.authTable)
      .select('otp, otp_expiry')
      .eq('email', email)
      .single();

    if (error || !data) return false;
    
    const dbOtp = String(data.otp);
    const reqOtp = String(otp);
    const nowUTC = dayjs().utc();
    const expiryUTC = dayjs(data.otp_expiry).utc();
    
    if (!dbOtp || dbOtp !== reqOtp) return false;
    if (nowUTC.isAfter(expiryUTC)) return false;
    
    return true;
  }

  /**
   * Set or update password
   * @param {string} email - Student email
   * @param {string} password - New password
   */
  async setPassword(email, password) {
    const hash = await bcrypt.hash(password, 10);
    
    const { error } = await supabase
      .from(this.authTable)
      .update({ password_hash: hash, otp: null, otp_expiry: null })
      .eq('email', email);

    if (error) throw error;
    return true;
  }

  /**
   * Fetch full auth record by email
   */
  async getAuthByEmail(email) {
    const { data, error } = await supabase
      .from(this.authTable)
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  }

  /**
   * Update fields on the auth table filtered by email
   */
  async updateAuthByEmail(email, updates) {
    const { data, error } = await supabase
      .from(this.authTable)
      .update(updates)
      .eq('email', email)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Validate password for a given enrollment number
   */
  async validatePassword(enrollmentNo, password) {
    const { data, error } = await supabase
      .from(this.authTable)
      .select('password_hash')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (error) throw error;

    return bcrypt.compare(password, data.password_hash);
  }

  /**
   * Update password by enrollment number without requiring current password
   */
  async updatePasswordByEnrollment(enrollmentNo, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from(this.authTable)
      .update({ password_hash: hash, otp: null, otp_expiry: null })
      .eq('enrollment_no', enrollmentNo);

    if (error) throw error;
    return true;
  }

  /**
   * Validate student credentials
   * @param {string} enrollmentNo - Student enrollment number
   * @param {string} password - Student password
   */
  async validateCredentials(enrollmentNo, password) {
    const student = await this.findStudentByEnrollmentNo(enrollmentNo);
    
    if (!student) return null;
    
    const valid = await bcrypt.compare(password, student.password_hash);
    
    if (!valid) return null;
    
    return {
      student_id: student.enrollment_no,
      enrollment_no: student.enrollment_no,
      email: student.email,
      role: 'student'
    };
  }

  /**
   * Generate JWT token for student
   * @param {object} student - Student data
   */
  generateToken(student) {
    return jwt.sign(student, config.jwt.secret, { expiresIn: '1d' });
  }

  /**
   * Get student profile
   * @param {string} enrollmentNo - Student enrollment number
   */
  async getStudentProfile(enrollmentNo) {
    // Get basic student data
    const { data: student, error: studentError } = await supabase
      .from(this.studentsTable)
      .select('*')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (studentError) throw studentError;
    
    // Get extended profile data
    const { data: extendedProfile, error: profileError } = await supabase
      .from(this.profileTable)
      .select('*')
      .eq('enrollment_no', enrollmentNo)
      .maybeSingle();
    
    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }
    
    // Merge basic info with extended profile
    return {
      ...student,
      ...(extendedProfile || {})
    };
  }

  /**
   * Update student password
   * @param {string} enrollmentNo - Student enrollment number
   * @param {string} oldPassword - Old password
   * @param {string} newPassword - New password
   */
  async updatePassword(enrollmentNo, oldPassword, newPassword) {
    const { data, error } = await supabase
      .from(this.authTable)
      .select('password_hash')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (error) throw error;
    
    const valid = await bcrypt.compare(oldPassword, data.password_hash);
    if (!valid) return false;
    
    const hash = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from(this.authTable)
      .update({ password_hash: hash })
      .eq('enrollment_no', enrollmentNo);

    if (updateError) throw updateError;
    return true;
  }
  
  /**
   * Find student by ID
   * @param {string|number} id - Student ID (likely enrollment number)
   */
  async findById(id) {
    const { data, error } = await supabase
      .from(this.authTable)
      .select('enrollment_no, email')
      .eq('enrollment_no', id)
      .single();

    if (error) return null;
    
    // Return student with role for consistency with other models
    return {
      id: data.enrollment_no,
      enrollment_no: data.enrollment_no,
      email: data.email,
      role: 'student'
    };
  }
  
  /**
   * Get count of students
   * @returns {number} Count of students
   */
  async getStudentCount() {
    // For development, return a mock count
    return 120; // Example count
  }
}

export default new StudentAuthModel();