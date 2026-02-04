import express from 'express';
const router = express.Router();

// Test API for CI/CD verification
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '🚀 CI/CD Pipeline not Working Successfully!',
    deployment: {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      lastUpdated: 'Feb 4, 2026 - 19:45 IST'
    },
    cicd: {
      status: 'ACTIVE',
      pipeline: 'GitHub Actions → AWS Lambda',
      triggerBranch: 'master',
      autoDeployment: true
    },
    api: {
      baseUrl: 'https://tavbbx35aeb4o7nbitpk76obd40dzbyk.lambda-url.ap-south-1.on.aws',
      endpoints: [
        'GET /api/test - This endpoint',
        'GET / - Health check',
        'GET /health - System status'
      ]
    }
  });
});

// Additional test endpoint for database connectivity
router.get('/test/db', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('pbl')
      .select('*')
      .limit(1);
      
    if (error) throw error;
    
    res.json({
      success: true,
      message: '✅ Database connection successful',
      dbStatus: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '❌ Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;