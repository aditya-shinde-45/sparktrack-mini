import express from "express";
import cors from "cors";
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
import externalRoutes from "./src/routes/external/externalRoutes.js";
import postRoutes from "./src/routes/admin/postRoutes.js";
import pblEvaluationRoutes from "./src/routes/admin/pblEvaluationRoutes.js";

// Routes we just created
import adminRoutes from "./src/routes/admin/adminRoutes.js";
import studentRoutes from "./src/routes/students/studentRoutes.js";
import dashboardRoutes from "./src/routes/admin/dashboardRoutes.js";
import pblReviewRoutes from "./src/routes/admin/pblReviewRoutes.js";
import pbl3Routes from "./src/routes/mentor/pbl3Routes.js";

// New routes from recent migration
import externalAuthRoutes from "./src/routes/external/externalAuthRoutes.js";
import evaluationRoutes from "./src/routes/external/evaluationRoutes.js";
import studentAuthRoutes from "./src/routes/students/studentAuthRoutes.js";
import problemStatementRoutes from "./src/routes/students/problemStatementRoutes.js";
import studentProfileRoutes from "./src/routes/students/studentProfileRoutes.js";
import externalAssignmentRoutes from "./src/routes/external/externalAssignmentRoutes.js";

// Error handler middleware
import { errorHandler } from './src/utils/errorHandler.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.server.port;

// CORS configuration
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(config.cors.allowedOrigins.indexOf(origin) === -1){
      return callback(null, false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Add CORS error handling

// Basic middleware
app.use(express.json());
app.use(morgan("dev"));

// Security middleware

// Only apply general rate limiting in production
if (config.server.env === 'production') {
  app.use(securityMiddleware.rateLimiter());
  logger.info('Rate limiting enabled for production environment');
}


// Serve uploaded files statically with security headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes - New MVC Structure
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", dashboardRoutes);  // Added admin dashboard routes
app.use("/api/mentors", mentorRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/deadlines", deadlineRoutes);
app.use("/api/pbl", pblRoutes);
app.use("/api/external", externalRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/students", studentProfileRoutes);
app.use("/api/students", problemStatementRoutes);
app.use("/api/admin", externalAssignmentRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reviews", pblReviewRoutes);
app.use("/api/evaluation", pblEvaluationRoutes); // Added PBL evaluation routes
app.use("/api/pbl3", pbl3Routes); // Added PBL3 routes

// Newly migrated routes
app.use("/api/external-auth", externalAuthRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/student-auth", studentAuthRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "SparkTrack Backend API is running!", version: "1.0" });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Database connection test route
app.get("/db-test", async (req, res) => {
  try {
    const result = await dbConfig.testConnection();
    res.json({
      success: true,
      message: "Database connected successfully!",
      sampleData: result.data,
      supabaseUrl: process.env.SUPABASE_URL,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Global error handling middleware
app.use(errorHandler);

// Startup connection check
const testConnection = async () => {
  try {
    await dbConfig.testConnection();
    logger.success("Database connected successfully!");
  } catch (error) {
    logger.error("Database connection failed:", error);
  }
};

// Start server
app.listen(PORT, () => {
  logger.serverStarted(PORT, config.server.env);
  testConnection();
});