import supabase from "../../config/database.js";
import GroupDraft from "../../models/groupDraftModel.js";
import GroupRequest from "../../models/groupRequestModel.js";
import ApiResponse from "../../utils/apiResponse.js";
import { randomUUID } from "crypto";

/**
 * Generate unique group ID (UUID)
 */
const generateGroupId = () => {
  return randomUUID();
};

/**
 * Create a draft group (Step 1)
 */
export const createDraft = async (req, res) => {
  try {
    const {
      leader_enrollment,
      team_name,
      previous_ps_id,
    } = req.body;

    // Validation
    if (!leader_enrollment || !team_name) {
      return ApiResponse.error(res, "Missing required fields", 400);
    }

    // Check if leader already has an active draft
    const hasActiveDraft = await GroupDraft.hasActiveDraft(leader_enrollment);
    if (hasActiveDraft) {
      return ApiResponse.error(res, "You already have an active draft group", 409);
    }

    // Check if leader already exists in pbl table (finalized group)
    const { data: existingGroup } = await supabase
      .from("pbl")
      .select("enrollment_no")
      .eq("enrollment_no", leader_enrollment);

    if (existingGroup && existingGroup.length > 0) {
      return ApiResponse.error(res, "You are already part of a finalized group", 409);
    }

    // Generate unique group ID
    const group_id = generateGroupId();

    // Create draft
    const draft = await GroupDraft.createDraft({
      group_id,
      leader_id: leader_enrollment,
      team_name,
    });

    return ApiResponse.success(res, "Draft group created successfully", draft, 201);
  } catch (error) {
    console.error("Error creating draft:", error);
    return ApiResponse.error(res, error.message || "Failed to create draft", 500);
  }
};

/**
 * Get leader's draft groups
 */
export const getLeaderDrafts = async (req, res) => {
  try {
    const { enrollmentNo } = req.params;

    const drafts = await GroupDraft.getDraftByLeader(enrollmentNo);

    // Get invitations for each draft
    const draftsWithInvitations = await Promise.all(
      drafts.map(async (draft) => {
        const invitations = await GroupRequest.getRequestsByGroup(draft.group_id);
        const acceptedCount = invitations.filter(inv => inv.status === "ACCEPTED").length;
        const canFinalize = acceptedCount >= 1; // At least 1 member accepted
        
        return { 
          ...draft, 
          invitations: invitations.map(inv => ({
            request_id: inv.request_id,
            enrollment_no: inv.student_id,
            status: inv.status.toLowerCase()
          })),
          all_accepted: canFinalize,
          accepted_count: acceptedCount
        };
      })
    );

    return ApiResponse.success(res, "Draft groups retrieved", { drafts: draftsWithInvitations });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return ApiResponse.error(res, error.message || "Failed to fetch drafts", 500);
  }
};

/**
 * Send invitations to members (Step 2)
 */
export const sendInvitations = async (req, res) => {
  try {
    const { group_id, enrollments } = req.body;

    // Validation
    if (!group_id || !enrollments || !Array.isArray(enrollments) || enrollments.length === 0) {
      return ApiResponse.error(res, "Invalid request data", 400);
    }

    // Verify draft exists and is in draft status
    const draft = await GroupDraft.getDraftById(group_id);
    if (!draft) {
      return ApiResponse.error(res, "Draft group not found", 404);
    }
    if (draft.status !== "DRAFT") {
      return ApiResponse.error(res, "Group is not in draft status", 400);
    }

    // Validate enrollments exist in pbl_2025
    const { data: students } = await supabase
      .from("pbl_2025")
      .select("enrollement_no")
      .in("enrollement_no", enrollments);

    if (!students || students.length !== enrollments.length) {
      return ApiResponse.error(res, "Some enrollment numbers are invalid", 400);
    }

    // Check if any student already has active requests or is in a finalized group
    const validationPromises = enrollments.map(async (enrollment) => {
      // Check active requests
      const activeRequests = await GroupRequest.hasActiveRequest(enrollment);
      if (activeRequests.length > 0) {
        return { enrollment, error: "Already has pending/accepted invitation" };
      }

      // Check finalized groups
      const { data: finalizedGroup } = await supabase
        .from("pbl")
        .select("enrollment_no")
        .eq("enrollment_no", enrollment);

      if (finalizedGroup && finalizedGroup.length > 0) {
        return { enrollment, error: "Already in a finalized group" };
      }

      return { enrollment, error: null };
    });

    const validationResults = await Promise.all(validationPromises);
    const errors = validationResults.filter((r) => r.error);

    if (errors.length > 0) {
      return ApiResponse.error(
        res,
        "Some enrollments are invalid",
        400,
        { invalid_enrollments: errors }
      );
    }

    // Create requests
    const requests = enrollments.map((enrollment) => ({
      group_id,
      student_id: enrollment,
    }));

    const createdRequests = await GroupRequest.createRequests(requests);

    return ApiResponse.success(
      res,
      "Invitations sent successfully",
      { sent: createdRequests.length, requests: createdRequests },
      201
    );
  } catch (error) {
    console.error("Error sending invitations:", error);
    return ApiResponse.error(res, error.message || "Failed to send invitations", 500);
  }
};

/**
 * Get invitations for a student
 */
export const getStudentInvitations = async (req, res) => {
  try {
    const { enrollmentNo } = req.params;

    const invitations = await GroupRequest.getPendingRequestsByStudent(enrollmentNo);

    // Format invitations with group details
    const formattedInvitations = invitations.map(inv => ({
      request_id: inv.request_id,
      group_id: inv.group_id,
      team_name: inv.groups_draft?.group_name,
      leader_enrollment: inv.groups_draft?.leader_id,
      status: inv.status.toLowerCase(),
      invited_at: inv.groups_draft?.created_at
    }));

    return ApiResponse.success(res, "Invitations retrieved", { invitations: formattedInvitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return ApiResponse.error(res, error.message || "Failed to fetch invitations", 500);
  }
};

/**
 * Respond to invitation (accept/reject)
 */
export const respondToInvitation = async (req, res) => {
  try {
    const { request_id, status } = req.body;

    // Validation
    if (!request_id || !["accepted", "rejected"].includes(status)) {
      return ApiResponse.error(res, "Invalid request data", 400);
    }

    if (status === "rejected") {
      // Delete the request entry instead of updating status
      await GroupRequest.deleteRequest(request_id);
      return ApiResponse.success(res, "Invitation declined successfully", { request_id, deleted: true });
    }

    // For accepted status, update as before
    const dbStatus = status.toUpperCase();
    const updatedRequest = await GroupRequest.updateRequestStatus(request_id, dbStatus);

    return ApiResponse.success(res, `Invitation ${status} successfully`, updatedRequest);
  } catch (error) {
    console.error("Error responding to invitation:", error);
    return ApiResponse.error(res, error.message || "Failed to respond to invitation", 500);
  }
};

/**
 * Get group details with invitation status
 */
export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Get draft details
    const draft = await GroupDraft.getDraftById(groupId);
    if (!draft) {
      return ApiResponse.error(res, "Group not found", 404);
    }

    // Get all requests
    const requests = await GroupRequest.getRequestsByGroup(groupId);

    // Fetch student details for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const { data: student } = await supabase
          .from("pbl_2025")
          .select("enrollement_no, name_of_student, class, contact")
          .eq("enrollement_no", request.enrollment_no)
          .single();

        return {
          ...request,
          student_details: student
            ? {
                enrollment_no: student.enrollement_no,
                student_name: student.name_of_student,
                class: student.class,
                contact: student.contact,
              }
            : null,
        };
      })
    );

    // Get request stats
    const stats = await GroupRequest.getGroupRequestStats(groupId);

    return ApiResponse.success(res, "Group details retrieved", {
      draft,
      requests: requestsWithDetails,
      stats,
    });
  } catch (error) {
    console.error("Error fetching group details:", error);
    return ApiResponse.error(res, error.message || "Failed to fetch group details", 500);
  }
};

/**
 * Generate group ID based on leader's class
 * Format: TYCSF301, TYCC101, SY0101, etc.
 */
const generateClassBasedGroupId = async (leaderEnrollment) => {
  try {
    // Get leader's class from pbl_2025
    const { data: leader, error: leaderError } = await supabase
      .from("pbl_2025")
      .select("class")
      .eq("enrollement_no", leaderEnrollment)
      .single();

    if (leaderError || !leader?.class) {
      throw new Error("Leader class not found");
    }

    // Remove hyphens and spaces from class name (e.g., "TY-CSF-3" → "TYCSF3")
    const classPrefix = leader.class.replace(/[-\s]/g, "");

    // Get all existing group IDs from pbl table with this prefix
    const { data: existingGroups, error: groupError } = await supabase
      .from("pbl")
      .select("group_id")
      .like("group_id", `${classPrefix}%`)
      .order("group_id", { ascending: true });

    if (groupError) {
      throw new Error("Failed to fetch existing groups");
    }

    // Extract sequence numbers and find the next available
    const existingNumbers = existingGroups
      .map(g => {
        const match = g.group_id.match(new RegExp(`^${classPrefix}(\\d+)$`));
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(n => n !== null)
      .sort((a, b) => a - b);

    // Find the first gap in sequence or get next number
    let nextNumber = 1;
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else if (num > nextNumber) {
        break; // Found a gap
      }
    }

    // Format: Pad with leading zeros to make it 2 digits (01, 02, etc.)
    const sequenceStr = nextNumber.toString().padStart(2, "0");
    const generatedGroupId = `${classPrefix}${sequenceStr}`;

    return generatedGroupId;
  } catch (error) {
    console.error("Error generating group ID:", error);
    throw error;
  }
};

/**
 * Confirm and finalize group (Step 3) - with atomic transaction
 */
export const confirmGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Get draft and validate
    const draft = await GroupDraft.getDraftById(groupId);
    if (!draft) {
      return ApiResponse.error(res, "Draft group not found", 404);
    }
    if (draft.status !== "DRAFT") {
      return ApiResponse.error(res, "Group is not in draft status", 400);
    }

    // Get all requests and validate
    const requests = await GroupRequest.getRequestsByGroup(groupId);
    if (requests.length === 0) {
      return ApiResponse.error(res, "No invitations sent yet", 400);
    }

    // Check if at least one member accepted (minimum 2 people: leader + 1 member)
    const acceptedRequests = requests.filter((r) => r.status === "ACCEPTED");
    if (acceptedRequests.length === 0) {
      const pending = requests.filter((r) => r.status === "PENDING").length;
      const rejected = requests.filter((r) => r.status === "REJECTED").length;
      return ApiResponse.error(
        res,
        "Cannot confirm: at least one member must accept the invitation",
        400,
        { accepted: 0, pending, rejected }
      );
    }

    // Generate class-based group ID
    const finalGroupId = await generateClassBasedGroupId(draft.leader_id);

    // Prepare all enrollment numbers (leader + only accepted members)
    const allEnrollments = [
      draft.leader_id,
      ...acceptedRequests.map((r) => r.student_id),
    ];

    // Fetch all student details from pbl_2025
    const { data: students } = await supabase
      .from("pbl_2025")
      .select("enrollement_no, name_of_student, class, contact, email_id")
      .in("enrollement_no", allEnrollments);

    if (!students || students.length < 2) {
      return ApiResponse.error(res, "Minimum 2 members required (leader + 1 member)", 400);
    }

    // Prepare pbl table entries with the new generated group_id
    const pblEntries = students.map((student) => ({
      enrollment_no: student.enrollement_no,
      student_name: student.name_of_student,
      class: student.class,
      contact: student.contact,
      email_id: student.email_id,
      mentor_code: null, // Will be assigned later by admin
      group_id: finalGroupId,
      team_name: draft.group_name,
      is_leader: student.enrollement_no === draft.leader_id,
      ps_id: draft.previous_ps_id || null,
    }));

    // ATOMIC TRANSACTION: Insert into pbl and update draft status
    const { data: insertedData, error: insertError } = await supabase
      .from("pbl")
      .insert(pblEntries)
      .select();

    if (insertError) {
      console.error("Error inserting into pbl:", insertError);
      return ApiResponse.error(res, "Failed to finalize group", 500);
    }

    // Update draft status to CONFIRMED
    await GroupDraft.updateStatus(groupId, "CONFIRMED");

    // Delete all pending and rejected requests (cleanup)
    // Only accepted members are in the finalized group, pending/rejected are no longer needed
    await GroupRequest.deleteRequestsByGroup(groupId);

    return ApiResponse.success(res, "Group confirmed and finalized successfully", {
      group_id: finalGroupId,
      team_name: draft.group_name,
      members_count: allEnrollments.length,
      finalized_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error confirming group:", error);
    return ApiResponse.error(res, error.message || "Failed to confirm group", 500);
  }
};

/**
 * Cancel draft group
 */
export const cancelDraft = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Verify draft exists
    const draft = await GroupDraft.getDraftById(groupId);
    if (!draft) {
      return ApiResponse.error(res, "Draft group not found", 404);
    }

    // Delete all requests first
    await GroupRequest.deleteRequestsByGroup(groupId);

    // Delete the draft group itself
    await GroupDraft.deleteDraft(groupId);

    return ApiResponse.success(res, "Draft group cancelled successfully");
  } catch (error) {
    console.error("Error cancelling draft:", error);
    return ApiResponse.error(res, error.message || "Failed to cancel draft", 500);
  }
};
