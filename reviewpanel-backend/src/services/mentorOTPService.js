import crypto from 'crypto';

/**
 * Mentor OTP Service for managing OTP verification during password setup.
 * Uses in-memory storage with rate limiting, expiration, and security features.
 */
class MentorOTPService {
  constructor() {
    // In-memory stores (swap for Redis in production for scalability)
    this.otpStore = new Map();
    this.attemptStore = new Map();

    // Configuration
    this.OTP_LENGTH = 6;
    this.OTP_EXPIRY = 10 * 60 * 1000;          // 10 minutes for OTP to be entered
    this.VERIFIED_WINDOW = 15 * 60 * 1000;      // 15 minutes after verify to set password
    this.MAX_ATTEMPTS = 5;
    this.RATE_LIMIT_WINDOW = 60 * 60 * 1000;    // 1 hour window
    this.MAX_REQUESTS_PER_HOUR = 3;

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
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
   * @returns {{ allowed: boolean, message?: string }}
   */
  checkRateLimit(contactNumber) {
    const now = Date.now();
    const key = `rate_${contactNumber}`;
    const requests = this.attemptStore.get(key) || [];
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
  recordRequest(contactNumber) {
    const key = `rate_${contactNumber}`;
    const requests = this.attemptStore.get(key) || [];
    requests.push(Date.now());
    this.attemptStore.set(key, requests);
  }

  /**
   * Create and store an OTP for a mentor
   * @param {string} contactNumber - Mentor's contact number (used as identifier)
   * @param {string} email - Mentor's email (where OTP will be sent)
   * @param {string} mentorName - Mentor's name (for email personalisation)
   * @returns {{ sessionToken: string, otp: string, expiresInMinutes: number }}
   */
  createOTP(contactNumber, email, mentorName) {
    const rateCheck = this.checkRateLimit(contactNumber);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.message);
    }

    const otp = this.generateOTP();
    const sessionToken = this.generateSessionToken();
    const expiresAt = Date.now() + this.OTP_EXPIRY;

    this.otpStore.set(sessionToken, {
      otp,
      contactNumber,
      email,
      mentorName,
      expiresAt,
      attempts: 0,
      verified: false,
      verifiedAt: null,
      createdAt: Date.now(),
    });

    this.recordRequest(contactNumber);

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
   * @returns {{ success: boolean, error?: string, contactNumber?: string, remainingAttempts?: number }}
   */
  verifyOTP(sessionToken, otp) {
    const data = this.otpStore.get(sessionToken);

    if (!data) {
      return { success: false, error: 'Invalid or expired session. Please request a new OTP.' };
    }

    if (Date.now() > data.expiresAt) {
      this.otpStore.delete(sessionToken);
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }

    if (data.verified) {
      return { success: false, error: 'OTP already used. Please request a new one.' };
    }

    if (data.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(sessionToken);
      return { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    data.attempts++;

    if (data.otp !== otp.toString().trim()) {
      const remaining = this.MAX_ATTEMPTS - data.attempts;
      return {
        success: false,
        error: `Invalid OTP. ${remaining} attempt(s) remaining.`,
        remainingAttempts: remaining,
      };
    }

    // Mark as verified and record when verification happened
    data.verified = true;
    data.verifiedAt = Date.now();

    console.info('[MentorOTP] OTP verified successfully');

    return {
      success: true,
      message: 'OTP verified successfully. You may now set your password.',
      contactNumber: data.contactNumber,
    };
  }

  /**
   * Check whether a session token is verified and still within the password-set window.
   * @param {string} sessionToken
   * @param {string} contactNumber - Must match the contact number used to request the OTP
   * @returns {boolean}
   */
  isVerified(sessionToken, contactNumber) {
    const data = this.otpStore.get(sessionToken);
    if (!data) return false;
    if (!data.verified) return false;
    if (data.contactNumber !== contactNumber) return false;
    if (Date.now() > data.verifiedAt + this.VERIFIED_WINDOW) return false;
    return true;
  }

  /**
   * Invalidate a session (call after password is successfully set)
   * @param {string} sessionToken
   */
  invalidateSession(sessionToken) {
    this.otpStore.delete(sessionToken);
    console.info('[MentorOTP] Session invalidated after password set');
  }

  /**
   * Cleanup expired entries to prevent memory growth
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [token, data] of this.otpStore.entries()) {
      const expiry = data.verified
        ? data.verifiedAt + this.VERIFIED_WINDOW
        : data.expiresAt;
      if (now > expiry) {
        this.otpStore.delete(token);
        cleaned++;
      }
    }

    for (const [key, requests] of this.attemptStore.entries()) {
      const recent = requests.filter((ts) => now - ts < this.RATE_LIMIT_WINDOW);
      if (recent.length === 0) this.attemptStore.delete(key);
      else this.attemptStore.set(key, recent);
    }

    if (cleaned > 0) {
      console.info(`[MentorOTP] Cleanup: removed ${cleaned} expired session(s)`);
    }
  }

  /**
   * Graceful shutdown
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.otpStore.clear();
    this.attemptStore.clear();
  }
}

export default new MentorOTPService();
