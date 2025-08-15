import supabase from "../Model/supabase.js";

export const saveEvaluation = async (req, res) => {
  try {
    const { group_id, feedback, evaluations } = req.body;

    console.log("📥 Incoming request data:", req.body);

    if (!group_id || !Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format"
      });
    }

    const updates = [];

    for (const evalData of evaluations) {
      const { enrolment_no, A, B, C, D, E } = evalData;
      const total = Number(A) + Number(B) + Number(C) + Number(D) + Number(E);

      const { data, error } = await supabase
        .from("pbl")
        .update({ A, B, C, D, E, total, feedback })
        .eq("group_id", group_id)
        .eq("enrollement_no", enrolment_no); // exact spelling as in DB

      if (error) throw error;

      updates.push(data);
    }

    console.log("📤 Supabase update response:", updates);

    res.json({
      success: true,
      message: "Marks and feedback saved successfully",
      data: updates
    });

  } catch (err) {
    console.error("Error saving evaluation:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getStudentsByGroup = async (req, res) => {
  const { groupId } = req.params;
  try {

    const { data, error } = await supabase
      .from("pbl")
      .select("enrollement_no, name_of_student, guide_name, A, B, C, D, E, total, feedback")
      .eq("group_id", groupId);


    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("🚨 Error fetching students:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
