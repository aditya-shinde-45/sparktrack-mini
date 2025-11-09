import crypto from 'crypto';

/**
 * External OTP Service for managing OTP verification for external evaluators
 * Production-ready with rate limiting, expiration, and security features
 */
class ExternalOTPService {
  constructor() {
    // In-memory storage (replace with Redis in production for scalability)
    this.otpStore = new Map();
    this.attemptStore = new Map();
    
    // Configuration
    this.OTP_LENGTH = 6;
    this.OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
    this.MAX_ATTEMPTS = 5;
    this.RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
    this.MAX_REQUESTS_PER_HOUR = 3;
    this.LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
    
    // Cleanup expired OTPs every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Generate a secure numeric OTP
   * @returns {string} 6-digit OTP
   */
  generateOTP() {
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0);
    const otp = (num % 1000000).toString().padStart(this.OTP_LENGTH, '0');
    return otp;
  }

  /**
   * Generate a unique session token for OTP verification
   * @returns {string} Session token
   */
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Check rate limiting for email requests
   * @param {string} email - External evaluator email
   * @returns {Object} Rate limit status
   */
  checkRateLimit(email) {
    const now = Date.now();
    const key = `rate_${email.toLowerCase()}`;
    const requests = this.attemptStore.get(key) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(
      timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
    );
    
    if (recentRequests.length >= this.MAX_REQUESTS_PER_HOUR) {
      const oldestRequest = recentRequests[0];
      const waitTime = Math.ceil((this.RATE_LIMIT_WINDOW - (now - oldestRequest)) / 1000 / 60);
      return {
        allowed: false,
        waitMinutes: waitTime,
        message: `Too many OTP requests. Please try again in ${waitTime} minutes.`
      };
    }
    
    return { allowed: true };
  }

  /**
   * Record an OTP request for rate limiting
   * @param {string} email - External evaluator email
   */
  recordRequest(email) {
    const now = Date.now();
    const key = `rate_${email.toLowerCase()}`;
    const requests = this.attemptStore.get(key) || [];
    requests.push(now);
    this.attemptStore.set(key, requests);
  }

  /**
   * Create and store OTP for external evaluator
   * @param {string} email - External evaluator email
   * @param {Object} data - Additional data (name, organization, groupId, etc.)
   * @returns {Object} OTP details and session token
   */
  createOTP(email, data = {}) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check rate limiting
    const rateCheck = this.checkRateLimit(normalizedEmail);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.message);
    }
    
    // Generate OTP and session token
    const otp = this.generateOTP();
    const sessionToken = this.generateSessionToken();
    const expiresAt = Date.now() + this.OTP_EXPIRY;
    
    // Store OTP data
    const otpData = {
      otp,
      sessionToken,
      email: normalizedEmail,
      expiresAt,
      attempts: 0,
      verified: false,
      createdAt: Date.now(),
      ...data
    };
    
    this.otpStore.set(sessionToken, otpData);
    this.recordRequest(normalizedEmail);
    
    // Log for monitoring (remove OTP in production logs)
    console.log(`OTP created for ${normalizedEmail}, expires in ${this.OTP_EXPIRY / 1000 / 60} minutes`);
    
    return {
      sessionToken,
      expiresAt,
      expiresInMinutes: this.OTP_EXPIRY / 1000 / 60
    };
  }

  /**
   * Verify OTP for external evaluator
   * @param {string} sessionToken - Session token
   * @param {string} otp - OTP to verify
   * @returns {Object} Verification result
   */
  verifyOTP(sessionToken, otp) {
    const otpData = this.otpStore.get(sessionToken);
    
    if (!otpData) {
      return {
        success: false,
        error: 'Invalid or expired session. Please request a new OTP.'
      };
    }
    
    // Check expiration
    if (Date.now() > otpData.expiresAt) {
      this.otpStore.delete(sessionToken);
      return {
        success: false,
        error: 'OTP has expired. Please request a new one.'
      };
    }
    
    // Check if already verified
    if (otpData.verified) {
      return {
        success: false,
        error: 'OTP already used. Please request a new one.'
      };
    }
    
    // Check max attempts
    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(sessionToken);
      return {
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a new OTP.'
      };
    }
    
    // Increment attempts
    otpData.attempts++;
    
    // Verify OTP
    if (otpData.otp !== otp.trim()) {
      const remainingAttempts = this.MAX_ATTEMPTS - otpData.attempts;
      return {
        success: false,
        error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts
      };
    }
    
    // Mark as verified
    otpData.verified = true;
    otpData.verifiedAt = Date.now();
    
    console.log(`OTP verified successfully for ${otpData.email}`);
    
    return {
      success: true,
      message: 'OTP verified successfully',
      data: {
        email: otpData.email,
        name: otpData.name,
        organization: otpData.organization,
        groupId: otpData.groupId,
        sessionToken
      }
    };
  }

  /**
   * Get OTP data for a session (without exposing the OTP)
   * @param {string} sessionToken - Session token
   * @returns {Object|null} OTP data (without OTP value)
   */
  getOTPData(sessionToken) {
    const otpData = this.otpStore.get(sessionToken);
    
    if (!otpData) {
      return null;
    }
    
    // Return data without exposing the actual OTP
    return {
      email: otpData.email,
      name: otpData.name,
      organization: otpData.organization,
      groupId: otpData.groupId,
      expiresAt: otpData.expiresAt,
      verified: otpData.verified,
      attempts: otpData.attempts,
      remainingAttempts: this.MAX_ATTEMPTS - otpData.attempts
    };
  }

  /**
   * Resend OTP for existing session
   * @param {string} sessionToken - Session token
   * @returns {Object} New OTP details
   */
  resendOTP(sessionToken) {
    const otpData = this.otpStore.get(sessionToken);
    
    if (!otpData) {
      throw new Error('Invalid session. Please start the registration process again.');
    }
    
    const normalizedEmail = otpData.email;
    
    // Check rate limiting
    const rateCheck = this.checkRateLimit(normalizedEmail);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.message);
    }
    
    // Generate new OTP but keep same session token
    const newOTP = this.generateOTP();
    const newExpiresAt = Date.now() + this.OTP_EXPIRY;
    
    otpData.otp = newOTP;
    otpData.expiresAt = newExpiresAt;
    otpData.attempts = 0;
    otpData.verified = false;
    
    this.recordRequest(normalizedEmail);
    
    console.log(`OTP resent for ${normalizedEmail}`);
    
    return {
      sessionToken,
      expiresAt: newExpiresAt,
      expiresInMinutes: this.OTP_EXPIRY / 1000 / 60,
      otp: newOTP // Only for email sending
    };
  }

  /**
   * Invalidate a session token
   * @param {string} sessionToken - Session token
   */
  invalidateSession(sessionToken) {
    this.otpStore.delete(sessionToken);
    console.log(`Session invalidated: ${sessionToken}`);
  }

  /**
   * Clean up expired OTPs and old rate limit data
   */
  cleanup() {
    const now = Date.now();
    let cleanedOTPs = 0;
    let cleanedRateLimits = 0;
    
    // Clean expired OTPs
    for (const [token, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(token);
        cleanedOTPs++;
      }
    }
    
    // Clean old rate limit data
    for (const [key, requests] of this.attemptStore.entries()) {
      const recentRequests = requests.filter(
        timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
      );
      if (recentRequests.length === 0) {
        this.attemptStore.delete(key);
        cleanedRateLimits++;
      } else {
        this.attemptStore.set(key, recentRequests);
      }
    }
    
    if (cleanedOTPs > 0 || cleanedRateLimits > 0) {
      console.log(`Cleanup completed: ${cleanedOTPs} OTPs, ${cleanedRateLimits} rate limits removed`);
    }
  }

  /**
   * Get statistics for monitoring
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      activeOTPs: this.otpStore.size,
      trackedEmails: this.attemptStore.size,
      config: {
        otpExpiry: this.OTP_EXPIRY / 1000 / 60 + ' minutes',
        maxAttempts: this.MAX_ATTEMPTS,
        maxRequestsPerHour: this.MAX_REQUESTS_PER_HOUR
      }
    };
  }

  /**
   * Cleanup on service shutdown
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.otpStore.clear();
    this.attemptStore.clear();
  }
}

export default new ExternalOTPService();
