import express from "express";
import supabase from "../../Model/supabase.js";
import { verifyToken } from "../../middleware/authmiddleware.js";

// Get all deadline controls
const getAllDeadlineControls = async (req, res) => {
  const { data, error } = await supabase
    .from("deadlines_control")
    .select("*");
  if (error) return res.status(500).json({ message: "Failed to fetch deadlines.", error });
  res.json({ deadlines: data });
};

// Update a deadline control by key
const updateDeadlineControl = async (req, res) => {
  const { key } = req.params;
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    return res.status(400).json({ message: "Enabled must be boolean." });
  }
  const { error } = await supabase
    .from("deadlines_control")
    .update({ enabled })
    .eq("key", key);
  if (error) return res.status(500).json({ message: "Failed to update deadline.", error });
  res.json({ message: "Deadline updated successfully." });
};

const router = express.Router();

router.get("/deadlines_control", verifyToken, getAllDeadlineControls);
router.put("/deadlines_control/:key", verifyToken, updateDeadlineControl);

export default router;