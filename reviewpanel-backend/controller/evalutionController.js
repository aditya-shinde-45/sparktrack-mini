import supabase from "../Model/supabase.js";

export const saveEvaluation = async (req, res) => {
  try {
    const {
      group_id,
      feedback,
      evaluations,
      crieya,
      patent,
      copyright,
      aic,
      tech_transfer,
      external_name,
    } = req.body;

    console.log("📥 Incoming request data:", req.body);

    if (!group_id || !Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
      });
    }

    // ✅ Check if external marks already exist for this group
    const { data: existing, error: checkError } = await supabase
      .from("pbl")
      .select("externalname")
      .eq("group_id", group_id)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0 && existing[0].externalname) {
      return res.status(403).json({
        success: false,
        message:
          "This group has already been evaluated by an external examiner. Editing is only allowed by guide.",
      });
    }

    const updates = [];

    for (const evalData of evaluations) {
      // ✅ match frontend + DB spelling
      const { enrollement_no, A, B, C, D, E } = evalData;

      // calculate total
      const total =
        Number(A || 0) +
        Number(B || 0) +
        Number(C || 0) +
        Number(D || 0) +
        Number(E || 0);

      const { data, error } = await supabase
        .from("pbl")
        .update({
          A,
          B,
          C,
          D,
          E,
          total,
          feedback,
          externalname: external_name || null,
          crieya: crieya || null,
          patent: patent || null,
          copyright: copyright || null,
          aic: aic || null,
          tech_transfer: tech_transfer || null,
        })
        .eq("group_id", group_id)
        .eq("enrollement_no", enrollement_no) // ✅ consistent spelling
        .select(); // ✅ return updated row(s)

      if (error) throw error;

      updates.push(data);
    }

    console.log("📤 Supabase update response:", updates);

    res.json({
      success: true,
      message:
        "Marks, feedback, external name and additional evaluations saved successfully",
      data: updates,
    });
  } catch (err) {
    console.error("🚨 Error saving evaluation:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get students by group_id with extra fields
 */
export const getStudentsByGroup = async (req, res) => {
  const { groupId } = req.params;
  try {
    const { data, error } = await supabase
      .from("pbl")
      .select(
        `
        enrollement_no,
        name_of_student,
        guide_name,
        A, B, C, D, E,
        total,
        feedback,
        crieya,
        copyright,
        patent,
        aic,
        tech_transfer
      `
      )
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
