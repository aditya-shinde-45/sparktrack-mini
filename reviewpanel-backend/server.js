import express from "express";
import cors from "cors";
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from 'url';

// Import configurations
import config from './src/config/index.js';
import { databaseConfig as dbConfig } from './src/config/database.js';
import logger from './src/utils/logger.js';

// Import middleware

// Route imports - New MVC Structure
import authRoutes from "./src/routes/admin/authRoutes.js";
import mentorRoutes from "./src/routes/mentor/mentorRoutes.js";
import announcementRoutes from "./src/routes/admin/announcementRoutes.js";
import deadlineRoutes from "./src/routes/admin/deadlineRoutes.js";
import pblRoutes from "./src/routes/admin/pblRoutes.js";
import postRoutes from "./src/routes/admin/postRoutes.js";

// Routes we just created
import adminRoutes from "./src/routes/admin/adminRoutes.js";
import studentRoutes from "./src/routes/students/studentRoutes.js";
import dashboardRoutes from "./src/routes/admin/dashboardRoutes.js";
import pblReviewRoutes from "./src/routes/admin/pblReviewRoutes.js";
import evaluationFormRoutes from "./src/routes/admin/evaluationFormRoutes.js";
import mentorEvaluationFormRoutes from "./src/routes/mentor/evaluationFormRoutes.js";
import mentorGroupRoutes from "./src/routes/mentor/mentorGroupRoutes.js";
import industrialMentorRoutes from "./src/routes/mentor/industrialMentorRoutes.js";
import industrialMentorAuthRoutes from "./src/routes/mentor/industrialMentorAuthRoutes.js";

// New routes from recent migration
import studentAuthRoutes from "./src/routes/students/studentAuthRoutes.js";
import problemStatementRoutes from "./src/routes/students/problemStatementRoutes.js";
import studentProfileRoutes from "./src/routes/students/studentProfileRoutes.js";
import creategroupRoutes from "./src/routes/students/creategroupRoutes.js";
import groupDraftRoutes from "./src/routes/students/groupDraftRoutes.js";
import internshipRoutes from "./src/routes/students/internshipRoutes.js";
import documentRoutes from "./src/routes/students/documentRoutes.js";
import rolesRoutes from "./src/routes/admin/rolesRoutes.js";
import roleAccessRoutes from "./src/routes/admin/roleAccessRoutes.js";
import testRoutes from "./src/routes/testRoutes.js";

// Rate limiting
import { apiLimiter } from './src/middleware/rateLimiter.js';

// Error handler middleware
import { errorHandler } from './src/utils/errorHandler.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.server.port;

app.disable('x-powered-by');

// ─── CORS ──────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // In production, never allow plain-HTTP origins
    if (config.server.env === 'production' && origin && origin.startsWith('http://')) {
      return callback(new Error(`Insecure HTTP origin ${origin} is not allowed in production`));
    }
    // Allow Vercel preview deployments (*.vercel.app)
    if (origin && /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    if (!origin || config.cors.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    }
  },
  hsts: {
    maxAge: 31536000,   // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false // allow S3/CDN resources
}));

// HTTP Parameter Pollution protection
app.use(hpp());

// Global rate limit – route-specific tighter limits are applied inside route files
app.use('/api', apiLimiter);

// Basic middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan(config.server.env === 'production' ? 'combined' : 'dev'));



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes - New MVC Structure
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", dashboardRoutes);  // Added admin dashboard routes
app.use("/api/mentors", mentorRoutes);
app.use("/api/mentors", mentorEvaluationFormRoutes);
app.use("/api/mentors", mentorGroupRoutes);
app.use("/api/mentors", industrialMentorRoutes);
app.use("/api/industrial-mentors", industrialMentorAuthRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/deadlines", deadlineRoutes);
app.use("/api/pbl", pblRoutes);
// IMPORTANT: Register more specific routes BEFORE generic ones
app.use("/api/students/internship", internshipRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/students", studentProfileRoutes);
app.use("/api/students", problemStatementRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reviews", pblReviewRoutes);
app.use("/api/roles", rolesRoutes); // Role management routes
app.use("/api/role-access", roleAccessRoutes); // Role-based table access for sub-admins
app.use("/api/admin", evaluationFormRoutes); // Admin evaluation form routes

// Newly migrated routes
app.use("/api/student-auth", studentAuthRoutes);
app.use("/api/student/documents", documentRoutes); // Student document upload/management
app.use("/api/groups", creategroupRoutes); // Group creation routes (legacy)
app.use("/api/groups-draft", groupDraftRoutes); // Draft-based group creation routes
if (config.server.env !== 'production') {
  app.use("/api", testRoutes); // Test routes for CI/CD
}

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "SparkTrack Backend API is running!", version: "1.0" });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Database connection test route (development only)
if (config.server.env !== 'production') {
  app.get("/db-test", async (req, res) => {
    try {
      const result = await dbConfig.testConnection();
      res.json({
        success: true,
        message: "Database connected successfully!",
        sampleData: result.data
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// Global error handling middleware
app.use(errorHandler);

// Catch-all 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Startup connection check
const testConnection = async () => {
  try {
    await dbConfig.testConnection();
    logger.success("Database connected successfully!");
  } catch (error) {
    logger.error("Database connection failed:", error);
  }
};

// Start server (skip in Lambda — detected via IS_LAMBDA env var)
if (!process.env.IS_LAMBDA) {
  app.listen(PORT, () => {
    logger.serverStarted(PORT, config.server.env);
    testConnection();
  });
}

// ─── Process-level error guards ────────────────────────────────────────────
// Prevent the process from crashing on unexpected async errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
  if (config.server.env === 'production') {
    // Give the logger time to flush before exiting
    setTimeout(() => process.exit(1), 200);
  }
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception – shutting down:', err);
  setTimeout(() => process.exit(1), 200);
});

// Export app for serverless
export default app;