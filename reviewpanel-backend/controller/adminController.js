import supabase from "../Model/supabase.js";

// ====================== EXTERNALS ======================

// 1. Get all externals
export const getAllExternals = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("externals")
      .select("external_id, password, name");

    if (error) {
      console.error("Error fetching externals:", error);
      return res.status(500).json({ message: "Error fetching externals." });
    }

    res.json({ externals: data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error occurred." });
  }
};

// 2. Add a new external
export const addExternal = async (req, res) => {
  try {
    const { external_id, password, name } = req.body;

    if (!external_id || !password || !name) {
      return res
        .status(400)
        .json({ message: "External ID, password, and name are required." });
    }

    // Duplicate check
    const { data: existing, error: checkError } = await supabase
      .from("externals")
      .select("external_id")
      .eq("external_id", external_id);

    if (checkError) {
      console.error("Error checking external ID:", checkError);
      return res.status(500).json({ message: "Error checking external ID." });
    }

    if (existing && existing.length > 0) {
      return res.status(400).json({ message: "External ID already exists." });
    }

    const { data, error } = await supabase
      .from("externals")
      .insert([{ external_id, password, name }])
      .select();

    if (error) {
      console.error("Error adding external:", error);
      return res.status(500).json({ message: "Error adding external." });
    }

    res.status(201).json({
      message: "External added successfully.",
      added: data,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error occurred." });
  }
};

// 3. Update an external
export const updateExternal = async (req, res) => {
  try {
    const { external_id } = req.params;
    const { password, name } = req.body;

    if (!external_id) {
      return res.status(400).json({ message: "External ID is required." });
    }

    const updateData = {};
    if (password) updateData.password = password;
    if (name) updateData.name = name;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    const { data, error } = await supabase
      .from("externals")
      .update(updateData)
      .eq("external_id", external_id)
      .select();

    if (error) {
      console.error("Error updating external:", error);
      return res.status(500).json({ message: "Error updating external." });
    }

    res.json({
      message: "External updated successfully.",
      updated: data,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error occurred." });
  }
};

// 4. Delete an external
export const deleteExternal = async (req, res) => {
  try {
    const { external_id } = req.params;

    if (!external_id) {
      return res.status(400).json({ message: "External ID is required." });
    }

    const { error } = await supabase
      .from("externals")
      .delete()
      .eq("external_id", external_id);

    if (error) {
      console.error("Error deleting external:", error);
      return res.status(500).json({ message: "Error deleting external." });
    }

    res.json({ message: "External deleted successfully." });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error occurred." });
  }
};

// ====================== PBL GROUPS ======================

// 5. Get PBL data (optionally filtered by class)
export const getPBLData = async (req, res) => {
  try {
    const classFilter = req.query.class?.toUpperCase();

    let query = supabase.from("pbl").select("*");

    if (classFilter) {
      // Match both "LYIT-*" and exact "LYIT"
      query = query.or(
        `class.eq.${classFilter},class.ilike.${classFilter}-%`
      );
    }

    query = query.range(0, 50000);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching PBL data:", error);
      return res.status(500).json({ message: "Error fetching PBL data." });
    }

    res.json(data || []);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error occurred." });
  }
};



// 6. Get PBL group by group_id (for handleFetch)
export const getPBLGroupById = async (req, res) => {
  try {
    const { group_id } = req.params;

    if (!group_id) {
      return res.status(400).json({ message: "Group ID is required." });
    }

    const { data, error } = await supabase
      .from("pbl")
      .select("*")
      .eq("group_id", group_id);

    if (error) {
      console.error("Error fetching PBL group:", error);
      return res.status(500).json({ message: "Error fetching PBL group." });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Group-level info
    const { guide_name, guide_contact } = data[0];

    // Students list
    const students = data.map((row) => ({
      enrollement_no: row.enrollement_no,
      name_of_student: row.name_of_student,
      class: row.class,
      email_id: row.email_id,
      contact: row.contact,
    }));

    res.json({
      group_id,
      guide_name,
      guide_contact,
      students,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error occurred." });
  }
};

// 7. Add a new PBL group
export const addPBLGroup = async (req, res) => {
  try {
    const { group_id, guide_name, guide_contact, students } = req.body;

    if (
      !group_id ||
      !guide_name ||
      !guide_contact ||
      !Array.isArray(students) ||
      students.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Missing required fields or students array." });
    }

    const rows = students.map((student) => ({
      group_id,
      enrollement_no: student.enrollement_no,
      name_of_student: student.name_of_student,
      class: student.class,
      email_id: student.email_id,
      contact: student.contact,
      guide_name,
      guide_contact,
      A: null,
      B: null,
      C: null,
      D: null,
      E: null,
      total: null,
      feedback: null,
    }));

    const { data, error } = await supabase.from("pbl").insert(rows).select();

    if (error) {
      console.error("Error inserting PBL group:", error);
      return res.status(500).json({ message: "Error inserting PBL group." });
    }

    res.json({ message: "PBL group added successfully.", inserted: data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error occurred." });
  }
};

// 8. Update a PBL group
export const updatePBLGroup = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { guide_name, guide_contact, students } = req.body;

    if (!group_id) {
      return res.status(400).json({ message: "Group ID is required." });
    }

    // Update guide info for all students in group
    if (guide_name || guide_contact) {
      const { error: guideError } = await supabase
        .from("pbl")
        .update({ guide_name, guide_contact })
        .eq("group_id", group_id);

      if (guideError) {
        console.error("Error updating guide info:", guideError);
        return res
          .status(500)
          .json({ message: "Error updating guide information." });
      }
    }

    // Update students if provided
    if (Array.isArray(students) && students.length > 0) {
      for (const student of students) {
        const { error: studentError } = await supabase
          .from("pbl")
          .update({
            name_of_student: student.name_of_student,
            class: student.class,
            email_id: student.email_id,
            contact: student.contact,
          })
          .eq("group_id", group_id)
          .eq("enrollement_no", student.enrollement_no);

        if (studentError) {
          console.error("Error updating student:", studentError);
        }
      }
    }

    res.json({ message: "PBL group updated successfully." });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error occurred." });
  }
};


export const getAllMentors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("mentors")
      .select("mentor_name, contact_number, group_id");

    if (error) {
      console.error("Error fetching mentors:", error);
      return res.status(500).json({ message: "Error fetching mentors." });
    }

    // Group mentors by mentor_name
    const mentorsMap = {};
    data.forEach((row) => {
      if (!mentorsMap[row.mentor_name]) {
        mentorsMap[row.mentor_name] = {
          mentor_name: row.mentor_name,
          contact_number: row.contact_number,
          groups: [],
        };
      }
      mentorsMap[row.mentor_name].groups.push(row.group_id);
    });

    const mentors = Object.values(mentorsMap);

    res.json({ mentors });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error occurred." });
  }
};