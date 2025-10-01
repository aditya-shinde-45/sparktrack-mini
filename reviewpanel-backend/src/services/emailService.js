import nodemailer from 'nodemailer';

/**
 * Email service for sending emails
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send an email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} text - Email body text
   * @param {string} html - Optional HTML content
   */
  async sendMail(to, subject, text, html = null) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        text,
        ...(html && { html }),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send an OTP email to a student
   * @param {string} email - Student email
   * @param {string} otp - One-time password
   */
  async sendOtpEmail(email, otp) {
    const subject = 'Your SparkTrack OTP';
    const text = `Dear Student,

Your One-Time Password (OTP) for SparkTrack is: ${otp}

Please use this OTP to verify your account or reset your password. 
Do not share this code with anyone.

If you did not request this, please ignore this email.

Thank you,
SparkTrack Team`;

    return this.sendMail(email, subject, text);
  }

  /**
   * Send a welcome email to a student
   * @param {string} email - Student email
   * @param {string} name - Student name
   */
  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to SparkTrack';
    const text = `Dear ${name},

Welcome to SparkTrack! Your account has been successfully created.

You can now login to access all our features.

Thank you,
SparkTrack Team`;

    return this.sendMail(email, subject, text);
  }
}

export default new EmailService();