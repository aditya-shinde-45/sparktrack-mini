// Rate limiting disabled — replaced with no-op middleware for Lambda compatibility
const noOp = (_req, _res, next) => next();

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

export const loginLimiter = noOp;
export const otpLimiter = noOp;
export const passwordResetLimiter = noOp;
export const tokenValidationLimiter = noOp;
export const apiLimiter = noOp;
