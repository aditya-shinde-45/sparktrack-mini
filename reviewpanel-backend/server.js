const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./Model/supabase');

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const apiRoutes = require('./Route/connectioncheck');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

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
    res.json({ success: true, message: 'Database connected successfully!', supabaseUrl: process.env.SUPABASE_URL });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test database connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Database connected successfully!');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  testConnection();
});