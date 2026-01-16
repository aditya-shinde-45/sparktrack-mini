import supabase from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import nodemailer from 'nodemailer';

/**
 * Student auth model for student authentication
 */
class StudentAuthModel {
  constructor() {
    this.studentsTable = 'students';
    this.otpStore = new Map(); // Temporary OTP storage
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
   * @param {string} password - Student password
   */
  async validateCredentials(enrollmentNo, password) {
    const { data: student, error } = await supabase
      .from(this.studentsTable)
      .select('enrollment_no, email_id, contact, password')
      .eq('enrollment_no', enrollmentNo)
      .single();
    
    if (error || !student) return null;
    
    // Check if password is set
    if (!student.password) {
      // Verify contact number for password setup
      if (password === student.contact) {
        return {
          needsPasswordSetup: true,
          enrollment_no: student.enrollment_no,
          email: student.email_id,
          contact: student.contact
        };
      }
      return null; // Invalid contact number
    }
    
    // Validate password
    const isValid = await bcrypt.compare(password, student.password);
    if (!isValid) return null;
    
    return {
      student_id: student.enrollment_no,
      enrollment_no: student.enrollment_no,
      email: student.email_id,
      role: 'student'
    };
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
   * Set initial password for student
   * @param {string} enrollmentNo - Student enrollment number
   * @param {string} newPassword - New password
   */
  async setPassword(enrollmentNo, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const { error } = await supabase
      .from(this.studentsTable)
      .update({ password: hashedPassword })
      .eq('enrollment_no', enrollmentNo);

    if (error) throw error;
    return true;
  }

  /**
   * Update student password (contact number)
   * @param {string} enrollmentNo - Student enrollment number
   * @param {string} newPassword - New contact number
   */
  async updatePassword(enrollmentNo, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
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

  /**
   * Send forgot password OTP
   * @param {string} email - Student email
   */
  async sendForgotPasswordOTP(email) {
    try {
      // Check if student exists and has password set
      const { data, error } = await supabase
        .from(this.studentsTable)
        .select('enrollment_no, email_id, password')
        .eq('email_id', email);

      console.log('Forgot password lookup:', { 
        email, 
        dataLength: data?.length, 
        found: !!data && data.length > 0, 
        hasPassword: data && data.length > 0 ? !!data[0]?.password : false, 
        error: error?.message 
      });

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('Student not found with email:', email);
        return null;
      }

      const student = data[0];

      if (!student.password) {
        console.log('Student found but password not set:', email);
        return null;
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with 10 minute expiry
      this.otpStore.set(email, {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000,
        enrollment_no: student.enrollment_no
      });

      console.log('OTP generated and stored for:', email);

      // Send OTP via email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP - SparkTrack',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7B74EF;">Password Reset Request</h2>
            <p>Hello Student,</p>
            <p>You have requested to reset your password. Use the OTP below to proceed:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #4C1D95; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666;">This OTP will expire in 10 minutes.</p>
            <p style="color: #666;">If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">SparkTrack - MIT ADT University</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully to:', email);
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
    const otpData = this.otpStore.get(email);

    if (!otpData || otpData.otp !== otp || Date.now() > otpData.expiresAt) {
      return null;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error } = await supabase
      .from(this.studentsTable)
      .update({ password: hashedPassword })
      .eq('email_id', email);

    if (error) throw error;

    // Clear OTP
    this.otpStore.delete(email);

    return true;
  }
}

export default new StudentAuthModel();