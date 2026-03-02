import dotenv from 'dotenv';
dotenv.config();

// In Lambda, .env doesn't exist — variables must be set in the Lambda console.
// ensureEnv logs a clear warning instead of crashing the cold start, so the
// error surfaces in CloudWatch rather than a cryptic 502.
const ensureEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    const msg = `[CONFIG] Missing required environment variable: ${key}. Set it in the Lambda console (Configuration → Environment variables).`;
    console.error(msg);
    // Still throw so misconfigured deployments fail fast and visibly in CloudWatch
    throw new Error(msg);
  }
  return value;
};

const parseAllowedOrigins = () => {
  if (process.env.CORS_ALLOWED_ORIGINS) {
    return process.env.CORS_ALLOWED_ORIGINS
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);
  }

  return [
    'https://sparktrack.mituniversity.edu',
    'http://13.201.46.41/frontend',
    'http://localhost:5173'
  ];
};

const jwtSecret = ensureEnv('JWT_SECRET');

// Enforce a strong secret in production.
// Only reject extremely short or well-known placeholder values.
if (
  (process.env.NODE_ENV === 'production') &&
  (jwtSecret.length < 32 ||
    /^(changeme|secret|password|letmein|qwerty|123456|admin)$/i.test(jwtSecret))
) {
  throw new Error(
    'JWT_SECRET is too weak for production. Use a random string of at least 32 characters.'
  );
}

const config = {
  server: {
    port: Number(process.env.PORT) || 5000,
    env: process.env.NODE_ENV || 'development'
  },
  cors: {
    allowedOrigins: parseAllowedOrigins()
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  database: {
    testTable: 'pbl'
  }
};

export default config;