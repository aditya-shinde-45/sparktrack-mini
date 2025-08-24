import supabase from "../Model/supabase.js";

// Pass the key for the function you want to control
export function deadlineBlocker(taskKey) {
  return async (req, res, next) => {
    const { data, error } = await supabase
      .from("deadlines_control")
      .select("enabled")
      .eq("key", taskKey)
      .single();

    if (error || !data) {
      return res.status(500).json({ message: "Deadline control not found." });
    }

    if (!data.enabled) {
      return res.status(403).json({ message: "This function is currently disabled by admin." });
    }

    next();
  };
}