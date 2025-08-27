import supabase from "../../Model/supabase.js";

// Get all students (for students directory page)
export async function getAllStudents(req, res) {
  try {
    // First, get all students
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("*")
      .order("name", { ascending: true });

    if (studentsError) {
      console.error("Error fetching students:", studentsError);
      return res.status(500).json({ message: "Error fetching students data" });
    }

    // Then, get all student profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("student_profiles")
      .select("*");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Create a map of profiles by enrollment_no
    const profilesMap = {};
    if (profiles) {
      profiles.forEach(profile => {
        profilesMap[profile.enrollment_no] = profile;
      });
    }

    // Merge the data
    const formattedStudents = students.map(student => {
      const profile = profilesMap[student.enrollment_no] || {};
      
      return {
        ...student,
        name_of_students: student.name,
        bio: profile.bio || null,
        skills: profile.skills || null,
        github_url: profile.github_url || null,
        linkedin_url: profile.linkedin_url || null,
        portfolio_url: profile.portfolio_url || null,
        profile_picture_url: profile.profile_picture_url || null,
        resume_url: profile.resume_url || null,
        phone: profile.phone || null
      };
    });

    res.json({ 
      students: formattedStudents,
      count: formattedStudents.length 
    });

  } catch (err) {
    console.error("Error in getAllStudents:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get student profile (with group_id from pbl table)
export async function getStudentProfile(req, res) {
  const tokenEmail = req.user?.email || req.body?.email;
  if (!tokenEmail) return res.status(401).json({ message: "Unauthorized" });

  // Get student basic info
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("enrollment_no, email_id, class, name, specialization")
    .eq("email_id", tokenEmail)
    .single();

  if (studentError || !student) return res.status(404).json({ message: "Student not found" });

  // Get extended profile data
  const { data: extendedProfile, error: profileError } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("enrollment_no", student.enrollment_no)
    .single();

  // Get group_id from pbl table using enrollment_no
  const { data: groupEntry, error: groupError } = await supabase
    .from("pbl")
    .select("group_id")
    .eq("enrollement_no", student.enrollment_no)
    .single();

  // Merge all data including extended profile
  const profile = {
    ...student,
    name_of_students: student.name,
    group_id: groupEntry?.group_id || null,
    bio: extendedProfile?.bio || null,
    skills: extendedProfile?.skills || null,
    github_url: extendedProfile?.github_url || null,
    linkedin_url: extendedProfile?.linkedin_url || null,
    portfolio_url: extendedProfile?.portfolio_url || null,
    profile_picture_url: extendedProfile?.profile_picture_url || null,
    resume_url: extendedProfile?.resume_url || null,
    phone: extendedProfile?.phone || null
  };

  res.json({ profile });
}

// Get group details: find group_id by enrollment, then fetch all group members and guide name
export async function getGroupDetails(req, res) {
  const { enrollment_no } = req.params;

  // Step 1: Find group_id for this enrollment_no
  const { data: groupEntry, error: groupEntryError } = await supabase
    .from("pbl")
    .select("group_id")
    .eq("enrollement_no", enrollment_no)
    .single();

  if (groupEntryError || !groupEntry) {
    return res.status(404).json({ message: "Group not found for this enrollment." });
  }

  const group_id = groupEntry.group_id;

  // Step 2: Find all members and guide name in this group
  const { data: members, error: membersError } = await supabase
    .from("pbl")
    .select("enrollement_no, name_of_student, guide_name")
    .eq("group_id", group_id);

  if (membersError || !members || members.length === 0) {
    return res.status(404).json({ message: "No members found for this group." });
  }

  // Get guide name (assuming same for all members)
  const guide_name = members[0].guide_name;

  res.json({
    group_id,
    guide_name,
    members,
  });
}

// Get announcements for class prefix
export async function getAnnouncements(req, res) {
  const { classPrefix } = req.params;
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .ilike("class", `${classPrefix}%`);

  if (error) return res.status(500).json({ message: "Error fetching announcements" });
  res.json(data);
}

// Get students by class (additional utility function)
export async function getStudentsByClass(req, res) {
  try {
    const { classname } = req.params;

    const { data: students, error } = await supabase
      .from("students")
      .select(`
        *,
        student_profiles (
          bio,
          skills,
          phone,
          github_url,
          linkedin_url,
          portfolio_url,
          resume_url,
          profile_picture_url
        )
      `)
      .eq("class", classname)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching students by class:", error);
      return res.status(500).json({ message: "Error fetching students" });
    }

    // Flatten the data structure
    const formattedStudents = (students || []).map(student => {
      const profile = student.student_profiles?.[0] || {};
      return {
        ...student,
        name_of_students: student.name,
        bio: profile.bio || null,
        skills: profile.skills || null,
        github_url: profile.github_url || null,
        linkedin_url: profile.linkedin_url || null,
        portfolio_url: profile.portfolio_url || null,
        profile_picture_url: profile.profile_picture_url || null,
        resume_url: profile.resume_url || null,
        phone: profile.phone || null,
        student_profiles: undefined
      };
    });

    res.json({ students: formattedStudents });

  } catch (err) {
    console.error("Error in getStudentsByClass:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get students by specialization (additional utility function)
export async function getStudentsBySpecialization(req, res) {
  try {
    const { specialization } = req.params;

    const { data: students, error } = await supabase
      .from("students")
      .select(`
        *,
        student_profiles (
          bio,
          skills,
          phone,
          github_url,
          linkedin_url,
          portfolio_url,
          resume_url,
          profile_picture_url
        )
      `)
      .ilike("specialization", `%${specialization}%`)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching students by specialization:", error);
      return res.status(500).json({ message: "Error fetching students" });
    }

    // Flatten the data structure
    const formattedStudents = (students || []).map(student => {
      const profile = student.student_profiles?.[0] || {};
      return {
        ...student,
        name_of_students: student.name,
        bio: profile.bio || null,
        skills: profile.skills || null,
        github_url: profile.github_url || null,
        linkedin_url: profile.linkedin_url || null,
        portfolio_url: profile.portfolio_url || null,
        profile_picture_url: profile.profile_picture_url || null,
        resume_url: profile.resume_url || null,
        phone: profile.phone || null,
        student_profiles: undefined
      };
    });

    res.json({ students: formattedStudents });

  } catch (err) {
    console.error("Error in getStudentsBySpecialization:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}