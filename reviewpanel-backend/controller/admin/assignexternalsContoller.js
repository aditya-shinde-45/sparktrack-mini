import supabase from "../../Model/supabase.js";

export const createAssignedExternal = async (req, res) => {
  try {
    const {
      name,
      contact,
      id: external_id,
      email,
      year,
      syClass,
      tySpec,
      tyClassNo,
      lySpec,
      lyClassNo,
    } = req.body;

    // Basic validation
    if (!name || !contact || !external_id || !email || !year) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Construct class string based on year
    let assignedClass = null;

    if (year === 'SY') {
      if (!syClass) {
        return res.status(400).json({ message: "Missing SY class." });
      }
      assignedClass = `${syClass}`;
    } else if (year === 'TY') {
      if (!tySpec || !tyClassNo) {
        return res.status(400).json({ message: "Missing TY specialization or class number." });
      }
      assignedClass = `TY${tySpec}${tyClassNo}`;
    } else if (year === 'LY') {
      if (!lySpec || !lyClassNo) {
        return res.status(400).json({ message: "Missing LY specialization or class number." });
      }
      assignedClass = `LY${lySpec}${lyClassNo}`;
    } else {
      return res.status(400).json({ message: "Invalid year provided." });
    }

    // Prepare data to insert
    const dataToInsert = {
      name,
      contact,
      external_id,
      email,
      year,
      class: assignedClass,
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('externals')
      .insert([dataToInsert]);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ message: "Failed to save data.", error: error.message });
    }

    res.status(201).json({ message: "External assigned successfully.", data });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error occurred." });
  }
};
