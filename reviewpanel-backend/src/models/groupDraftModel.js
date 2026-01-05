import supabase from "../config/database.js";

/**
 * Groups Draft Model
 * Stores draft groups before finalization
 * Status: draft | finalized | cancelled
 */

const GroupDraft = {
  /**
   * Create a new draft group
   */
  async createDraft(draftData) {
    const { data, error } = await supabase
      .from("groups_draft")
      .insert([
        {
          group_id: draftData.group_id,
          leader_id: draftData.leader_id,
          group_name: draftData.team_name,
          status: "draft",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  },

  /**
   * Get draft groups by leader enrollment
   */
  async getDraftByLeader(leaderEnrollment) {
    const { data, error } = await supabase
      .from("groups_draft")
      .select("*")
      .eq("leader_id", leaderEnrollment)
      .in("status", ["draft"])
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get draft group by group_id
   */
  async getDraftById(groupId) {
    const { data, error } = await supabase
      .from("groups_draft")
      .select("*")
      .eq("group_id", groupId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update draft status
   */
  async updateStatus(groupId, status) {
    const { data, error } = await supabase
      .from("groups_draft")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("group_id", groupId)
      .select();

    if (error) throw error;
    return data[0];
  },

  /**
   * Delete draft group
   */
  async deleteDraft(groupId) {
    const { error } = await supabase
      .from("groups_draft")
      .delete()
      .eq("group_id", groupId);

    if (error) throw error;
    return true;
  },

  /**
   * Check if leader already has an active draft
   */
  async hasActiveDraft(leaderEnrollment) {
    const { data, error } = await supabase
      .from("groups_draft")
      .select("group_id")
      .eq("leader_id", leaderEnrollment)
      .eq("status", "draft");

    if (error) throw error;
    return data.length > 0;
  },
};

export default GroupDraft;
