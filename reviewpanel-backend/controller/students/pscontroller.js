import supabase from "../../Model/supabase.js";

// Submit a new problem statement
export async function submitProblemStatement(req, res) {
  const { group_id, title, type, technologyBucket, domain, description } = req.body;

  if (!group_id || !title) {
    return res.status(400).json({ message: "Group ID and Title are required." });
  }

  const { data, error } = await supabase
    .from("problem_statement")
    .insert([{ group_id, title, type, technologyBucket, domain, description }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: "Failed to submit problem statement.", error });
  }

  res.status(201).json({ message: "Problem statement submitted successfully.", problemStatement: data });
}

// Edit an existing problem statement by group_id
export async function editProblemStatement(req, res) {
  const { group_id } = req.params;
  const { title, type, technologyBucket, domain, description } = req.body;

  if (!group_id) {
    return res.status(400).json({ message: "Group ID is required." });
  }

  const { data, error } = await supabase
    .from("problem_statement")
    .update({ title, type, technologyBucket, domain, description })
    .eq("group_id", group_id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: "Failed to edit problem statement.", error });
  }

  res.json({ message: "Problem statement updated successfully.", problemStatement: data });
}

// Delete a problem statement by group_id
export async function deleteProblemStatement(req, res) {
  const { group_id } = req.params;

  if (!group_id) {
    return res.status(400).json({ message: "Group ID is required." });
  }

  const { error } = await supabase
    .from("problem_statement")
    .delete()
    .eq("group_id", group_id);

  if (error) {
    return res.status(500).json({ message: "Failed to delete problem statement.", error });
  }

  res.json({ message: "Problem statement deleted successfully." });
}