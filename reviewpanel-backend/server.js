const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./Model/supabase');

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const apiRoutes = require('./Route/connectioncheck');
const evaluationRoutes = require('./Route/evalution');  // Evaluation route
const groupInfoRoutes = require('./Route/groupinfo');    // Group info route

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/groupinfo', groupInfoRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Review Panel Backend API is running!' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database connection test route
app.get('/db-test', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    res.json({
      success: true,
      message: 'Database connected successfully!',
      supabaseUrl: process.env.SUPABASE_URL
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test database connection at startup
const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ Database connected successfully!');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  testConnection();
});
