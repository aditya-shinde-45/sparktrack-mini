import supabase from "../Model/supabase.js";

// Save or update evaluation
export const saveEvaluation = async (req, res) => {
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
        { onConflict: "group_id,enrolment_no" }
      );

    if (error) throw error;

    res.json({
      success: true,
      message: "Evaluation saved successfully",
      data
    });
  } catch (err) {
    console.error("Error saving evaluation:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get students by group_id
export const getStudentsByGroup = async (req, res) => {
  const { groupId } = req.params;
  try {
    const { data, error } = await supabase
      .from("pbl")
      .select("enrollement_no, name_of_student,guide_name")
      .eq("group_id", groupId);

    if (error) throw error;

    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Error fetching students:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
