import express from 'express';
const router = express.Router();

// Test API for CI/CD verification
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'CI/CD deployment working!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;