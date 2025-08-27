// routes/testdb.js
import express from 'express';
import supabase from '../../Model/supabase.js';


const router = express.Router();

router.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('your_table_name') // change to actual table
      .select('*')
      .limit(1);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Database connection successful',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
