import dotenv from 'dotenv';
dotenv.config();

const config = {
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development'
  },
  cors: {
    allowedOrigins: [
      "https://sparktrack-mini-lkij.vercel.app",
      "https://sparktrack-mini-3r93.vercel.app",
      "http://localhost:5173"
    ]
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'sparktrack_secret_key',
    expiresIn: '24h'
  },
  database: {
    testTable: 'pbl'
  }
};

export default config;