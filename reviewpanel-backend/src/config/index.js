import dotenv from 'dotenv';
dotenv.config();

const ensureEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
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

const config = {
  server: {
    port: Number(process.env.PORT) || 5000,
    env: process.env.NODE_ENV || 'development'
  },
  cors: {
    allowedOrigins: parseAllowedOrigins()
  },
  jwt: {
    secret: ensureEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  security: {
    rateLimit: {
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300
    }
  },
  database: {
    testTable: 'pbl'
  }
};

export default config;