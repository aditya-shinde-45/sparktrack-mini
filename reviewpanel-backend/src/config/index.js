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

const jwtSecret = ensureEnv('JWT_SECRET');

// Enforce a strong secret in production to prevent brute-force signing attacks
if (
  (process.env.NODE_ENV === 'production') &&
  (jwtSecret.length < 32 || /^(supersecret|changeme|secret|password)/i.test(jwtSecret))
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