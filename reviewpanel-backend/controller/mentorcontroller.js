import supabase from '../Model/supabase.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const mentorLogin = async (req, res) => {
  try {
    const { username, password } = req.body; // username = contact_number, password = plain password entered

    // Find mentor by contact_number (username)
    const { data, error } = await supabase
      .from("mentors")
      .select("mentor_id, mentor_name, contact_number, password")
      .eq("contact_number", username) // login using contact_number
      .limit(1);

    if (error || !data || data.length === 0) {
      return res.status(401).json({ message: "Invalid username" });
    }

    const mentor = data[0];

    // Verify password
    const isValid = await bcrypt.compare(password, mentor.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Create token with immutable mentor_id
    const token = jwt.sign(
      {
        mentor_id: mentor.mentor_id,
        mentor_name: mentor.mentor_name,
        contact_number: mentor.contact_number,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      mentor_id: mentor.mentor_id,
      mentor_name: mentor.mentor_name,
      contact_number: mentor.contact_number,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

export const getMentorGroups = async (req, res) => {
  try {
    const { contact_number } = req.user;

    // Fetch group_ids assigned to mentor
    const { data, error } = await supabase
      .from('mentors')
      .select('group_id')
      .eq('contact_number', contact_number);

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch groups' });
    }

    const group_ids = data.map(row => row.group_id);

    res.json({ group_ids });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
};

export const saveMentorEvaluation = async (req, res) => {
  try {
    const { group_id, faculty_guide, feedback, evaluations } = req.body;


    // Validate payload
    if (!group_id || !faculty_guide || !Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format"
      });
    }

    const updates = [];

    for (const evalData of evaluations) {
      const { enrolment_no, student_name, A, B, C, D, E } = evalData;
      const total = Number(A) + Number(B) + Number(C) + Number(D) + Number(E);

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
          guide_name: faculty_guide
        })
        .eq("group_id", group_id)
        .eq("enrollement_no", enrolment_no); // Match DB column spelling exactly

      if (error) throw error;
      updates.push({ enrolment_no, result: data });
    }

    console.log("📤 All updates complete:", updates);

    res.json({
      success: true,
      message: "Mentor marks and feedback saved successfully",
      data: updates
    });

  } catch (err) {
    console.error("❌ Error saving mentor evaluation:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getStudentsByMentorGroup = async (req, res) => {
  const { groupId } = req.params;
  try {
    const { data, error } = await supabase
      .from("pbl")
      .select(`
        enrollement_no,
        name_of_student,
        guide_name,
        A,
        B,
        C,
        D,
        E,
        total,
        feedback
      `)
      .eq("group_id", groupId);

    if (error) throw error;

    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Error fetching students:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateMentorPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { mentor_id } = req.user; // comes from JWT

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both old and new passwords are required" });
    }

    // Fetch mentor (to get contact_number + current password)
    const { data, error } = await supabase
      .from("mentors")
      .select("password, contact_number")
      .eq("mentor_id", mentor_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    // Check old password
    const isValid = await bcrypt.compare(oldPassword, data.password);
    if (!isValid) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // ✅ Update ALL mentors with the same contact_number
    const { error: updateError } = await supabase
      .from("mentors")
      .update({ password: hashed })
      .eq("contact_number", data.contact_number);

    if (updateError) {
      return res.status(500).json({ message: "Failed to update password for all mentors" });
    }

    res.json({ message: "✅ Password updated successfully for all mentors with this contact number" });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
