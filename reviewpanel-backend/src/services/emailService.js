import nodemailer from 'nodemailer';

/**
 * Email service for sending emails
 */
class EmailService {
  constructor() {
    // Check if email credentials are configured
    const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    
    if (!hasEmailConfig) {
      console.warn('⚠️  Email credentials not configured. Emails will be logged to console only.');
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
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
      // If no transporter (credentials not configured), log to console for development
      if (!this.transporter) {
        console.log('\n📧 [EMAIL SIMULATION - No credentials configured]');
        console.log('═══════════════════════════════════════════════');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`\n${text}`);
        console.log('═══════════════════════════════════════════════\n');
        return true;
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        text,
        ...(html && { html }),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.response);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      
      // In development, don't fail the whole operation if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Development mode: Continuing despite email failure');
        return true;
      }
      
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

  /**
   * Send an OTP email to an external evaluator
   * @param {string} email - External evaluator email
   * @param {string} otp - One-time password
   * @param {string} name - Evaluator name
   * @param {string} organization - Evaluator organization
   * @param {number} expiresInMinutes - OTP expiry time in minutes
   */
  async sendExternalOtpEmail(email, otp, name, organization, expiresInMinutes = 10) {
    const subject = 'Your SparkTrack External Evaluator Verification Code';
    
    const text = `Dear ${name},

Thank you for agreeing to serve as an external evaluator for SparkTrack PBL Review 3.

Your verification code is: ${otp}

Organization: ${organization}

This code will expire in ${expiresInMinutes} minutes. Please enter this code on the registration page to complete your verification.

If you did not expect this email or have any questions, please contact the project mentor or administrator.

Security Note: Do not share this code with anyone.

Best regards,
SparkTrack Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .otp-box { background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; }
    .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
    .warning-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 SparkTrack External Evaluator</h1>
      <p>PBL Review 3 Verification</p>
    </div>
    <div class="content">
      <p>Dear <strong>${name}</strong>,</p>
      
      <p>Thank you for agreeing to serve as an external evaluator for SparkTrack PBL Review 3.</p>
      
      <div class="otp-box">
        <p style="margin: 0; color: #666; font-size: 14px;">Your Verification Code</p>
        <div class="otp-code">${otp}</div>
        <p style="margin: 0; color: #666; font-size: 12px;">Valid for ${expiresInMinutes} minutes</p>
      </div>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>📋 Organization:</strong> ${organization}</p>
      </div>
      
      <p>Please enter this code on the registration page to complete your verification and access the evaluation portal.</p>
      
      <div class="warning-box">
        <p style="margin: 0;"><strong>⚠️ Security Note:</strong> Do not share this code with anyone. Our team will never ask for your verification code.</p>
      </div>
      
      <p>If you did not expect this email or have any questions, please contact the project mentor or administrator immediately.</p>
      
      <p>Best regards,<br><strong>SparkTrack Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; 2024 SparkTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendMail(email, subject, text, html);
  }

  /**
   * Send welcome email to verified external evaluator
   * @param {string} email - External evaluator email
   * @param {string} name - Evaluator name
   * @param {string} groupId - Group ID they will evaluate
   */
  async sendExternalWelcomeEmail(email, name, groupId) {
    const subject = 'Welcome to SparkTrack - External Evaluator Portal';
    
    const text = `Dear ${name},

Welcome to SparkTrack! Your account as an external evaluator has been successfully verified.

Group Assignment: ${groupId}

You can now access the evaluation portal to review and assess student projects. Please login using your registered email address.

Portal Access: [Your Portal URL]

If you need any assistance or have questions about the evaluation process, please contact the project mentor.

Thank you for your valuable contribution to our students' learning experience.

Best regards,
SparkTrack Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Verification Complete!</h1>
      <p>Welcome to SparkTrack</p>
    </div>
    <div class="content">
      <p>Dear <strong>${name}</strong>,</p>
      
      <div class="success-box">
        <p style="margin: 0;"><strong>🎉 Success!</strong> Your account as an external evaluator has been successfully verified.</p>
      </div>
      
      <p><strong>Group Assignment:</strong> ${groupId}</p>
      
      <p>You can now access the evaluation portal to review and assess student projects. Please login using your registered email address.</p>
      
      <a href="#" class="button">Access Evaluation Portal</a>
      
      <p>If you need any assistance or have questions about the evaluation process, please don't hesitate to contact the project mentor.</p>
      
      <p>Thank you for your valuable contribution to our students' learning experience.</p>
      
      <p>Best regards,<br><strong>SparkTrack Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; 2024 SparkTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendMail(email, subject, text, html);
  }
}

export default new EmailService();