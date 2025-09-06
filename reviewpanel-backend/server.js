import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import supabase from "./Model/supabase.js";
import morgan from "morgan";
import path from "path";

// Route imports
import apiRoutes from "./Route/admin/connectioncheck.js";
import evaluationRoutes from "./Route/admin/evalutionRoute.js";
import groupInfoRoutes from "./Route/admin/groupinfo.js";
import authRoutes from "./Route/admin/authroutes.js";
import assignExternalRoutes from './Route/admin/assignExternalroute.js';
import externalAuthRoute from './Route/admin/externalAuthRoute.js';
import mentorRoutes from './Route/admin/mentorRoutes.js';
import adminRoutes from './Route/admin/adminRoute.js';
import sihRoutes from './Route/admin/sihRoutes.js';
import studentLoginRoutes from './Route/students/studentloginRoute.js';
import studentRoutes from './Route/students/studentRoute.js';
import psRoutes from './Route/students/psroutes.js';
import announcementRoutes from './Route/admin/announcementroute.js';
import deadline from './Route/admin/deadlinecontrolRoute.js';
import post from './Route/admin/postroute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const TEST_TABLE = "pbl";

// CORS configuration
const allowedOrigins = [
  "https://sparktrack-mini-lkij.vercel.app",
  "https://sparktrack-mini-3r93.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      return callback(null, false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use("/api", apiRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/groupinfo", groupInfoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", assignExternalRoutes);
app.use("/api/external-auth", externalAuthRoute);
app.use("/api", mentorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sih", sihRoutes);
app.use("/api/studentlogin", studentLoginRoutes);
app.use("/api", studentRoutes);
app.use("/api", psRoutes);
app.use("/api", announcementRoutes);
app.use("/api", deadline);
app.use("/api/admin/posts", post);

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

// Error handling middleware (optional, but recommended)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: err.message });
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  testConnection();
});