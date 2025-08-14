import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import supabase from "./Model/supabase.js";

// Route imports
import apiRoutes from "./Route/connectioncheck.js";
import evaluationRoutes from "./Route/evalutionRoute.js";
import groupInfoRoutes from "./Route/groupinfo.js";
import authRoutes from "./Route/authroutes.js";
import assignExternalRoutes from './Route/assignExternalroute.js';
import externalAuthRoute from './Route/externalAuthRoute.js';
import sendevaluationRouter from './controller/sendevaluation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const TEST_TABLE = "pbl"; // Change this to an existing table

// CORS configuration
app.use(cors({
  origin: [
    "https://sparktrack-mini-3r93.vercel.app",
    "https://sparktrack-mini-lkij.vercel.app", 
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5000"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
  next();
});

// Routes
app.use("/api", apiRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/groupinfo", groupInfoRoutes);
app.use("/api/auth", authRoutes);
app.use('/api', assignExternalRoutes);
app.use('/api/external-auth', externalAuthRoute);
app.use('/api/evaluation', sendevaluationRouter);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Review Panel Backend API is running!" });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Database connection test route
app.get("/db-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TEST_TABLE)
      .select("*")
      .limit(1);

    if (error) throw error;

    res.json({
      success: true,
      message: "Database connected successfully!",
      sampleData: data,
      supabaseUrl: process.env.SUPABASE_URL,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Startup connection check
const testConnection = async () => {
  try {
    const { error } = await supabase
      .from(TEST_TABLE)
      .select("*")
      .limit(1);
    if (error) throw error;
    console.log("✅ Database connected successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
};

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  testConnection();
});
