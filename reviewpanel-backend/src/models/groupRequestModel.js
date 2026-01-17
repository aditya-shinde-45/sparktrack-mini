import supabase from "../config/database.js";
import { randomUUID } from "crypto";

/**
 * Group Requests Model
 * Manages invitations sent to students to join groups
 * Status: pending | accepted | rejected
 */

const GroupRequest = {
  /**
   * Create group invitations for multiple members
   */
  async createRequests(requests) {
    const requestData = requests.map((req) => ({
      request_id: randomUUID(),
      group_id: req.group_id,
      student_id: req.student_id,
      status: "PENDING",
    }));

    const { data, error } = await supabase
      .from("group_requests")
      .insert(requestData)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Get all requests for a specific group
   */
  async getRequestsByGroup(groupId) {
    const { data, error } = await supabase
      .from("group_requests")
      .select("*")
      .eq("group_id", groupId);

    if (error) throw error;
    return data;
  },

  /**
   * Get pending invitations for a student
   */
  async getPendingRequestsByStudent(enrollmentNo) {
    const { data, error } = await supabase
      .from("group_requests")
      .select(`
        *,
        groups_draft (
          group_id,
          group_name,
          leader_id,
          created_at
        )
      `)
      .eq("student_id", enrollmentNo)
      .in("status", ["PENDING", "ACCEPTED"]);

    if (error) throw error;
    return data;
  },

  /**
   * Update request status (accept/reject)
   */
  async updateRequestStatus(requestId, status) {
    const { data, error } = await supabase
      .from("group_requests")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("request_id", requestId)
      .select();

    if (error) throw error;
    return data[0];
  },

  /**
   * Check if student already has pending/accepted request
   */
  async hasActiveRequest(enrollmentNo) {
    const { data, error } = await supabase
      .from("group_requests")
      .select("request_id, status, group_id")
      .eq("student_id", enrollmentNo)
      .in("status", ["PENDING", "ACCEPTED"]);

    if (error) throw error;
    return data;
  },

  /**
   * Get request statistics for a group
   */
  async getGroupRequestStats(groupId) {
    const { data, error } = await supabase
      .from("group_requests")
      .select("status")
      .eq("group_id", groupId);

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter((r) => r.status === "PENDING").length,
      accepted: data.filter((r) => r.status === "ACCEPTED").length,
      rejected: data.filter((r) => r.status === "REJECTED").length,
    };

    return stats;
  },

  /**
   * Delete a specific request by ID
   */
  async deleteRequest(requestId) {
    const { error } = await supabase
      .from("group_requests")
      .delete()
      .eq("request_id", requestId);

    if (error) throw error;
    return true;
  },

  /**
   * Delete all requests for a group (used when cancelling draft)
   */
  async deleteRequestsByGroup(groupId) {
    const { error } = await supabase
      .from("group_requests")
      .delete()
      .eq("group_id", groupId);

    if (error) throw error;
    return true;
  },

  /**
   * Check if all invited members have accepted
   */
  async allAccepted(groupId) {
    const { data, error } = await supabase
      .from("group_requests")
      .select("status")
      .eq("group_id", groupId);

    if (error) throw error;

    if (data.length === 0) return false;
    return data.every((req) => req.status === "ACCEPTED");
  },
};

export default GroupRequest;
