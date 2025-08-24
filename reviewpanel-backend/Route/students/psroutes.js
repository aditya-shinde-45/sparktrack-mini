import express from "express";
import {
  submitProblemStatement,
  editProblemStatement,
  deleteProblemStatement,
} from "../../controller/students/pscontroller.js";
import { authenticateUser } from "../../controller/students/studentlogin.js";

const router = express.Router();

// Submit a new problem statement
router.post("/student/problem-statement", authenticateUser, submitProblemStatement);

// Get a problem statement by group_id
router.get("/student/problem-statement/:group_id", authenticateUser, async (req, res) => {
  // Simple controller inline for GET
  const { group_id } = req.params;
  if (!group_id) return res.status(400).json({ message: "Group ID is required." });
  const { data, error } = await req.supabase
    ? req.supabase.from("problem_statement").select("*").eq("group_id", group_id).single()
    : import("../../Model/supabase.js").then(({ default: supabase }) =>
        supabase.from("problem_statement").select("*").eq("group_id", group_id).single()
      );
  if (error || !data) return res.status(404).json({ message: "Problem statement not found." });
  res.json({ problemStatement: data });
});

// Edit an existing problem statement by group_id
router.put("/student/problem-statement/:group_id", authenticateUser, editProblemStatement);

// Delete a problem statement by group_id
router.delete("/student/problem-statement/:group_id", authenticateUser, deleteProblemStatement);

export default router;