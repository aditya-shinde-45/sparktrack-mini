const express = require("express");
const router = express.Router();
const supabase = require("../Model/supabase");

// GET details for a group (students + faculty guide) without roll no
router.get("/group-details/:group_id", async (req, res) => {
  try {
    const { group_id } = req.params;

    const { data, error } = await supabase
      .from("pbl")
      .select("group_id, enrollement_no, name_of_student, guide_name, contact, guide_contact")
      .eq("group_id", group_id);

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Faculty guide info (assume same for all students in the group)
    const facultyGuide = {
      name: data[0].guide_name,
      contact: data[0].guide_contact || null
    };

    res.json({
      success: true,
      group_id,
      faculty_guide: facultyGuide,
      students: data.map((row) => ({
        student_name: row.name_of_student,
        enrolment_no: row.enrollement_no,
        contact: row.contact || null
      }))
    });
  } catch (err) {
    console.error("Error fetching group details:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
