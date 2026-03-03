import rateLimit from 'express-rate-limit';

/**
 * Safe key generator: handles Lambda/API Gateway where req.ip may be undefined
 * because X-Forwarded-For hasn't been resolved yet.
 */
const lambdaSafeKeyGenerator = (req) =>
  req.ip ||
  req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  'unknown';

/**
 * Production-grade rate limiters.
 *
 * Each limiter is keyed by the client IP.  The values below are tuned for a
 * university-scale app (a few thousand users).  Adjust via env vars if needed.
 *
 * ┌───────────────────────┬──────────┬─────────────────────────────────────┐
 * │ Limiter               │ Window   │ Max requests per IP                 │
 * ├───────────────────────┼──────────┼─────────────────────────────────────┤
 * │ loginLimiter          │ 15 min   │ 10  (brute-force protection)        │
 * │ otpLimiter            │ 15 min   │  5  (SMS/email abuse prevention)    │
 * │ passwordResetLimiter  │ 15 min   │  5  (reset-spam prevention)         │
 * │ tokenValidationLimiter│ 15 min   │ 30  (token validate is called often)│
 * │ apiLimiter            │ 15 min   │ 200 (general authenticated routes)  │
 * └───────────────────────┴──────────┴─────────────────────────────────────┘
 */

const standardMessage = {
  success: false,
  message: 'Too many requests from this IP address. Please try again later.'
};

// Disable express-rate-limit's built-in X-Forwarded-For validation — Lambda
// Function URLs format this header differently and the validator throws a raw
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR error which becomes a 500.
const lambdaValidate = { xForwardedForHeader: false };

// ---------- Auth / Login ----------
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: lambdaSafeKeyGenerator,
  validate: lambdaValidate,
  message: {
    ...standardMessage,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

// ---------- OTP send ----------
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_OTP_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: lambdaSafeKeyGenerator,
  validate: lambdaValidate,
  message: {
    ...standardMessage,
    message: 'Too many OTP requests. Please try again after 15 minutes.'
  }
});

// ---------- Password reset / set ----------
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PASSWORD_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: lambdaSafeKeyGenerator,
  validate: lambdaValidate,
  message: {
    ...standardMessage,
    message: 'Too many password reset attempts. Please try again after 15 minutes.'
  }
});

// ---------- Token validation ----------
export const tokenValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_VALIDATE_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: lambdaSafeKeyGenerator,
  validate: lambdaValidate,
  message: standardMessage
});

// ---------- General API (applied globally to /api) ----------
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: lambdaSafeKeyGenerator,
  validate: lambdaValidate,
  message: standardMessage
});
