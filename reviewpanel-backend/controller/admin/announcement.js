import supabase from "../../Model/supabase.js";

// Send announcement to all students
export async function sendAnnouncement(req, res) {
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required." });
  }

  // Insert announcement into the announcements table
  const { data, error } = await supabase
    .from("announcements")
    .insert([{ title, message, created_at: new Date().toISOString() }]);

  if (error) {
    return res.status(500).json({ message: "Failed to send announcement.", error });
  }

  res.json({ message: "Announcement sent successfully!", announcement: data });
}

// Get all announcements (optional, for listing)
export async function getAnnouncements(req, res) {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: "Failed to fetch announcements.", error });
  }

  res.json({ announcements: data });
}

// Delete an announcement by id
export async function deleteAnnouncement(req, res) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Announcement ID is required." });
  }

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ message: "Failed to delete announcement.", error });
  }

  res.json({ message: "Announcement deleted successfully." });
}

// Show PBL Review 1 marks for a single student
export async function showPBLReview1Marks(req, res) {
  const { enrollement_no } = req.query;
  if (!enrollement_no) {
    return res.status(400).json({ message: "enrollement_no is required." });
  }
  const { data, error } = await supabase
    .from("pbl")
    .select("enrollement_no, total, feedback")
    .eq("enrollement_no", enrollement_no)
    .single();

  if (error) {
    return res.status(500).json({ message: "Failed to fetch PBL Review 1 marks.", error });
  }

  res.json({ review1Marks: data });
}

// Show PBL Review 2 marks for a single student
export async function showPBLReview2Marks(req, res) {
  const { enrollement_no } = req.query;
  if (!enrollement_no) {
    return res.status(400).json({ message: "enrollement_no is required." });
  }
  const { data, error } = await supabase
    .from("pbl2")
    .select("enrollement_no, total, feedback")
    .eq("enrollement_no", enrollement_no)
    .single();

  if (error) {
    return res.status(500).json({ message: "Failed to fetch PBL Review 2 marks.", error });
  }

  res.json({ review2Marks: data });
}