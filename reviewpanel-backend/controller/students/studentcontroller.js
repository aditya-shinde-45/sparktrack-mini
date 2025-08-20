import supabase from "../../Model/supabase.js";

// Get student profile
export async function getStudentProfile(req, res) {
  const tokenEmail = req.user?.email || req.body?.email;
  if (!tokenEmail) return res.status(401).json({ message: "Unauthorized" });

  const { data, error } = await supabase
    .from("students")
    .select("enrollment_no, email, class, name, specialization")
    .eq("email", tokenEmail)
    .single();

  if (error || !data) return res.status(404).json({ message: "Student not found" });
  res.json({ profile: data });
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