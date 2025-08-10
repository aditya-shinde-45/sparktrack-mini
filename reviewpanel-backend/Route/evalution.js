const express = require("express");
const router = express.Router();
const supabase = require("../Model/supabase"); // Import your existing Supabase client

// Save or update evaluation
router.post("/save-evaluation", async (req, res) => {
  try {
    const {
      group_id,
      enrolment_no,
      roll_number,
      student_name,
      A,
      B,
      C,
      D,
      E,
      faculty_guide,
      feedback
    } = req.body;

    const total_marks =
      Number(A) + Number(B) + Number(C) + Number(D) + Number(E);

    const { data, error } = await supabase
      .from("evaluations")
      .upsert(
        [
          {
            group_id,
            enrolment_no,
            roll_number,
            student_name,
            a_marks: A,
            b_marks: B,
            c_marks: C,
            d_marks: D,
            e_marks: E,
            total_marks,
            faculty_guide,
            feedback
          }
        ],
        { onConflict: "group_id,enrolment_no" } // composite key
      );

    if (error) throw error;

    res.json({ success: true, message: "Evaluation saved successfully", data });
  } catch (err) {
    console.error("Error saving evaluation:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
