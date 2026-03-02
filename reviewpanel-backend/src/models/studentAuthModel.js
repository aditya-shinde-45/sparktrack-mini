import supabase from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID, randomInt } from 'node:crypto';
import config from '../config/index.js';
import emailService from '../services/emailService.js';

/**
 * Student auth model for student authentication
 */
class StudentAuthModel {
  constructor() {
    this.studentsTable = 'students';
    this.otpStore = new Map(); // Temporary OTP storage
  }

  getValidOtpEntry(email, otp) {
    const otpData = this.otpStore.get(email);

    if (!otpData) {
      return null;
    }

    if (otpData.otp !== otp) {
      return null;
    }

    if (Date.now() > otpData.expiresAt) {
      this.otpStore.delete(email);
      return null;
    }

    return otpData;
  }

  clearOtp(email) {
    this.otpStore.delete(email);
  }

  /**
   * Find student by enrollment number
   * @param {string} enrollmentNo - Student enrollment number
   */
  async findStudentByEnrollmentNo(enrollmentNo) {
    const { data, error } = await supabase
      .from(this.studentsTable)
      .select('enrollment_no, student_email_id, student_contact_no, name_of_student')
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
   * @param {string} password - Student password
   */
  async validateCredentials(enrollmentNo, password) {
    const { data: student, error } = await supabase
      .from(this.studentsTable)
      .select('enrollment_no, student_email_id, student_contact_no, name_of_student, password, status')
      .eq('enrollment_no', enrollmentNo)
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      return null;
    }
    
    if (!student) {
      console.log('❌ Student not found in database');
      return null;
    }
    
    // Check if student is active (only reject if explicitly 'Inactive')
    const statusLower = student.status ? student.status.toLowerCase().trim() : '';
    
    if (statusLower === 'inactive') {
      return null;
    }
    
    // Check if password is set
    if (!student.password) {
      return {
        needsPasswordSetup: true,
        enrollment_no: student.enrollment_no,
        email: student.student_email_id,
        contact: student.student_contact_no,
        name: student.name_of_student
      };
    }
    
    // Validate password
    const isValid = await bcrypt.compare(password, student.password);
    if (!isValid) return null;
    
    return {
      student_id: student.enrollment_no,
      enrollment_no: student.enrollment_no,
      email: student.student_email_id,
      name: student.name_of_student,
      role: 'student'
    };
  }

  /**
   * Generate JWT token for student
   * @param {object} student - Student data
   * @param {string} expiresIn - Token expiration time (default: 1d)
   */
  generateToken(student, expiresIn = '1d') {
    return jwt.sign({ ...student, jti: randomUUID() }, config.jwt.secret, { expiresIn });
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
   * Set initial password for student
   * @param {string} enrollmentNo - Student enrollment number
   * @param {string} newPassword - New password
   */
  async setPassword(enrollmentNo, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const { error } = await supabase
      .from(this.studentsTable)
      .update({ password: hashedPassword })
      .eq('enrollment_no', enrollmentNo);

    if (error) throw error;
    return true;
  }

  /**
   * Update student password
   * @param {string} enrollmentNo - Student enrollment number
   * @param {string} newPassword - New password
   */
  async updatePassword(enrollmentNo, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const { error } = await supabase
      .from(this.studentsTable)
      .update({ password: hashedPassword })
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
      .select('enrollment_no, student_email_id, name_of_student, status')
      .eq('enrollment_no', id)
      .single();

    if (error) return null;
    
    return {
      id: data.enrollment_no,
      enrollment_no: data.enrollment_no,
      email: data.student_email_id,
      name: data.name_of_student,
      status: data.status,
      role: 'student'
    };
  }

  /**
   * Send forgot password OTP
   * @param {string} email - Student email
   */
  async sendForgotPasswordOTP(email) {
    try {
      // Check if student exists and has password set
      const { data, error } = await supabase
        .from(this.studentsTable)
        .select('enrollment_no, student_email_id, name_of_student, password, status')
        .eq('student_email_id', email);

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const student = data[0];

      // Generate cryptographically secure 6-digit OTP
      const otp = randomInt(100000, 1000000).toString();
      
      // Store OTP with 10 minute expiry
      this.otpStore.set(email, {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000,
        enrollment_no: student.enrollment_no
      });

      // Send OTP via shared email service
      await emailService.sendOtpEmail(email, otp);
      return true;
    } catch (error) {
      console.error('Error in sendForgotPasswordOTP:', error);
      throw error;
    }
  }

  /**
   * Reset password with OTP
   * @param {string} email - Student email
   * @param {string} otp - OTP code
   * @param {string} newPassword - New password
   */
  async resetPasswordWithOTP(email, otp, newPassword) {
    const otpData = this.getValidOtpEntry(email, otp);

    if (!otpData) {
      return null;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const { error } = await supabase
      .from(this.studentsTable)
      .update({ password: hashedPassword })
      .eq('student_email_id', email);

    if (error) throw error;

    // Clear OTP
    this.clearOtp(email);

    return true;
  }
}

export default new StudentAuthModel();