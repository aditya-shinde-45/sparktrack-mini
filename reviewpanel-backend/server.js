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
const allowedOrigins = [
  "https://sparktrack-mini-lkij.vercel.app", // your frontend URL
  "http://localhost:5173" // optional: for local dev
];

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like curl or postman)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  testConnection();
});
