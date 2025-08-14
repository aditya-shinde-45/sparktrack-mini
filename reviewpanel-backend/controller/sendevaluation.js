import express from 'express';
const router = express.Router();
import supabase from '../Model/supabase.js'; // Your Supabase client

router.post('/save-evaluation', async (req, res) => {
  try {
    const { evaluations, feedback } = req.body;

    if (!evaluations || !Array.isArray(evaluations)) {
      return res.status(400).json({ message: "Missing evaluations array." });
    }

    // Update marks and feedback for each student in the pbl table
    for (const studentEval of evaluations) {
      const { enrollement_no, A, B, C, D, E, total } = studentEval;

      const { error } = await supabase
        .from('pbl')
        .update({ A, B, C, D, E, total, feedback })
        .eq('enrollement_no', enrollement_no);

      if (error) {
        console.error(`Error updating enrollement_no ${enrollement_no}:`, error);
        return res.status(500).json({ error: `Failed to update marks for ${enrollement_no}`, details: error.message });
      }
    }

    res.status(200).json({ message: 'Marks and feedback updated successfully in pbl table.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update marks and feedback.' });
  }
});

export default router;