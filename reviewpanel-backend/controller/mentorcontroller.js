import supabase from '../Model/supabase.js';
import jwt from 'jsonwebtoken';

const MENTOR_USERNAME = 'MITADT25';

export const mentorLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username !== MENTOR_USERNAME) {
      return res.status(401).json({ message: 'Invalid username' });
    }

    // Find all mentors with matching contact_number
    const { data, error } = await supabase
      .from('mentors')
      .select('mentor_name, contact_number')
      .eq('contact_number', String(password));

    if (error || !data || data.length === 0) {
      return res.status(401).json({ message: 'Invalid password/contact number' });
    }

    // Use the first matching mentor
    const mentor = data[0];

    const token = jwt.sign(
      { username, contact_number: mentor.contact_number },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, mentor_name: mentor.mentor_name, contact_number: mentor.contact_number });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
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
