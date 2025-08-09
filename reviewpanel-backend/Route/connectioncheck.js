const express = require('express');
const supabase = require('../Model/supabase');
const router = express.Router();

router.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('your_table_name')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Database connection successful', data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;