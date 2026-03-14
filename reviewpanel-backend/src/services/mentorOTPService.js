import crypto from 'crypto';
import supabase from '../config/database.js';

/**
 * Mentor OTP Service for managing OTP verification during password setup.
 * Uses Supabase database for storage to work with serverless/Lambda deployments.
 */
class MentorOTPService {
  constructor() {
    // Configuration
    this.OTP_LENGTH = 6;
    this.OTP_EXPIRY = 10 * 60 * 1000;          // 10 minutes for OTP to be entered
    this.VERIFIED_WINDOW = 15 * 60 * 1000;      // 15 minutes after verify to set password
    this.MAX_ATTEMPTS = 5;
    this.RATE_LIMIT_WINDOW = 60 * 60 * 1000;    // 1 hour window
    this.MAX_REQUESTS_PER_HOUR = 3;
  }

  /**
   * Generate a cryptographically secure 6-digit OTP
   * @returns {string}
   */
  generateOTP() {
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0);
    return (num % 1000000).toString().padStart(this.OTP_LENGTH, '0');
  }

  /**
   * Generate a random session token
   * @returns {string}
   */
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Check rate limiting for a contact number
   * @param {string} contactNumber
   * @returns {Promise<{ allowed: boolean, message?: string }>}
   */
  async checkRateLimit(contactNumber) {
    const now = Date.now();
    
    // Get rate limit data from database
    const { data, error } = await supabase
      .from('mentor_otp_rate_limit')
      .select('request_timestamps')
      .eq('contact_number', contactNumber)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[MentorOTP] Rate limit check error:', error);
      return { allowed: true }; // Fail open to allow requests if DB has issues
    }

    const requests = data?.request_timestamps || [];
    const recentRequests = requests.filter((ts) => now - ts < this.RATE_LIMIT_WINDOW);

    if (recentRequests.length >= this.MAX_REQUESTS_PER_HOUR) {
      const waitTime = Math.ceil(
        (this.RATE_LIMIT_WINDOW - (now - recentRequests[0])) / 1000 / 60
      );
      return {
        allowed: false,
        message: `Too many OTP requests. Please try again in ${waitTime} minute(s).`,
      };
    }

    return { allowed: true };
  }

  /**
   * Record an OTP request timestamp for rate limiting
   * @param {string} contactNumber
   */
  async recordRequest(contactNumber) {
    const now = Date.now();
    
    // Get existing timestamps
    const { data } = await supabase
      .from('mentor_otp_rate_limit')
      .select('request_timestamps')
      .eq('contact_number', contactNumber)
      .single();

    const requests = data?.request_timestamps || [];
    const recentRequests = requests.filter((ts) => now - ts < this.RATE_LIMIT_WINDOW);
    recentRequests.push(now);

    // Upsert the updated timestamps
    await supabase
      .from('mentor_otp_rate_limit')
      .upsert({
        contact_number: contactNumber,
        request_timestamps: recentRequests,
        updated_at: now,
      });
  }

  /**
   * Create and store an OTP for a mentor
   * @param {string} contactNumber - Mentor's contact number (used as identifier)
   * @param {string} email - Mentor's email (where OTP will be sent)
   * @param {string} mentorName - Mentor's name (for email personalisation)
   * @returns {Promise<{ sessionToken: string, otp: string, expiresInMinutes: number }>}
   */
  async createOTP(contactNumber, email, mentorName) {
    const rateCheck = await this.checkRateLimit(contactNumber);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.message);
    }

    // Delete any existing OTP sessions for this contact number (resend scenario)
    await supabase
      .from('mentor_otp_sessions')
      .delete()
      .eq('contact_number', contactNumber);

    const otp = this.generateOTP();
    const sessionToken = this.generateSessionToken();
    const now = Date.now();
    const expiresAt = now + this.OTP_EXPIRY;

    // Store OTP session in database
    const { error } = await supabase
      .from('mentor_otp_sessions')
      .insert({
        session_token: sessionToken,
        otp,
        contact_number: contactNumber,
        email,
        mentor_name: mentorName,
        expires_at: expiresAt,
        attempts: 0,
        verified: false,
        verified_at: null,
        created_at: now,
      });

    if (error) {
      console.error('[MentorOTP] Error creating OTP session:', error);
      throw new Error('Failed to create OTP session. Please try again.');
    }

    await this.recordRequest(contactNumber);

    console.info(`[MentorOTP] OTP created for mentor, expires in ${this.OTP_EXPIRY / 1000 / 60} minutes`);

    return {
      sessionToken,
      otp,                                          // Only used internally to pass to email sender
      expiresInMinutes: this.OTP_EXPIRY / 1000 / 60,
    };
  }

  /**
   * Verify an OTP for a given session token
   * @param {string} sessionToken
   * @param {string} otp
   * @returns {Promise<{ success: boolean, error?: string, contactNumber?: string, remainingAttempts?: number, message?: string }>}
   */
  async verifyOTP(sessionToken, otp) {
    // Clean up OTPs that expired more than 1 minute ago
    const oneMinuteAgo = Date.now() - 60000; // 1 minute
    await supabase
      .from('mentor_otp_sessions')
      .delete()
      .lt('expires_at', oneMinuteAgo);

    // Get session from database
    const { data, error } = await supabase
      .from('mentor_otp_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid or expired session. Please request a new OTP.' };
    }

    const now = Date.now();

    // Check if OTP has expired
    if (now > data.expires_at) {
      await supabase
        .from('mentor_otp_sessions')
        .delete()
        .eq('session_token', sessionToken);
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }

    // Check if already verified
    if (data.verified) {
      return { success: false, error: 'OTP already used. Please request a new one.' };
    }

    // Check max attempts
    if (data.attempts >= this.MAX_ATTEMPTS) {
      await supabase
        .from('mentor_otp_sessions')
        .delete()
        .eq('session_token', sessionToken);
      return { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    // Increment attempts
    const newAttempts = data.attempts + 1;

    // Check if OTP matches
    if (data.otp !== otp.toString().trim()) {
      const remaining = this.MAX_ATTEMPTS - newAttempts;
      
      // Update attempts in database
      await supabase
        .from('mentor_otp_sessions')
        .update({ attempts: newAttempts })
        .eq('session_token', sessionToken);

      return {
        success: false,
        error: `Invalid OTP. ${remaining} attempt(s) remaining.`,
        remainingAttempts: remaining,
      };
    }

    // Mark as verified in database
    const { error: updateError } = await supabase
      .from('mentor_otp_sessions')
      .update({
        verified: true,
        verified_at: now,
        attempts: newAttempts,
      })
      .eq('session_token', sessionToken);

    if (updateError) {
      console.error('[MentorOTP] Error marking OTP as verified:', updateError);
      return { success: false, error: 'Failed to verify OTP. Please try again.' };
    }

    console.info('[MentorOTP] OTP verified successfully');

    return {
      success: true,
      message: 'OTP verified successfully. You may now set your password.',
      contactNumber: data.contact_number,
    };
  }

  /**
   * Check whether a session token is verified and still within the password-set window.
   * @param {string} sessionToken
   * @param {string} contactNumber - Must match the contact number used to request the OTP
   * @returns {Promise<boolean>}
   */
  async isVerified(sessionToken, contactNumber) {
    const { data, error } = await supabase
      .from('mentor_otp_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (error || !data) return false;
    if (!data.verified) return false;
    if (data.contact_number !== contactNumber) return false;
    if (Date.now() > data.verified_at + this.VERIFIED_WINDOW) return false;
    return true;
  }

  /**
   * Invalidate a session (call after password is successfully set)
   * @param {string} sessionToken
   */
  async invalidateSession(sessionToken) {
    await supabase
      .from('mentor_otp_sessions')
      .delete()
      .eq('session_token', sessionToken);
    console.info('[MentorOTP] Session invalidated after password set');
  }

  /**
   * Cleanup expired entries to prevent database growth
   * Call this periodically or trigger via scheduled Lambda
   */
  async cleanup() {
    const now = Date.now();
    const oneMinuteGrace = 60000; // 1 minute after expiry

    // Delete OTP sessions that expired more than 1 minute ago
    const { data: deletedSessions } = await supabase
      .from('mentor_otp_sessions')
      .delete()
      .or(`expires_at.lt.${now - oneMinuteGrace},and(verified.eq.true,verified_at.lt.${now - this.VERIFIED_WINDOW})`)
      .select('session_token');

    // Cleanup old rate limit entries
    await supabase
      .from('mentor_otp_rate_limit')
      .delete()
      .lt('updated_at', now - this.RATE_LIMIT_WINDOW - 86400000); // Keep for 1 day extra

    const cleaned = deletedSessions?.length || 0;
    if (cleaned > 0) {
      console.info(`[MentorOTP] Cleanup: removed ${cleaned} expired session(s)`);
    }
  }
}

export default new MentorOTPService();
