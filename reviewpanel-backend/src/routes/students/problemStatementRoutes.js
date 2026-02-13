import express from 'express';
import problemStatementController from '../../controllers/students/problemStatementController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import supabase from '../../config/database.js';
import ApiResponse from '../../utils/apiResponse.js';
import { deadlineBlocker } from '../../middleware/deadlineMiddleware.js';

const router = express.Router();

// Get group details by enrollment number
router.get(
  '/student/group-details/:enrollment_no',
  authMiddleware.authenticateUser,
  async (req, res, next) => {
    try {
      const { enrollment_no } = req.params;
      
      const { data, error } = await supabase
        .from('pbl')
        .select('group_id, team_name, ps_id, mentor_code')
        .eq('enrollment_no', enrollment_no)
        .single();

      if (error || !data) {
        return ApiResponse.error(res, 'Group not found', 404);
      }

      return ApiResponse.success(res, 'Group details retrieved', { group: data });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/student/group-details/:group_id/team-name',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('student'),
  async (req, res, next) => {
    try {
      const { group_id } = req.params;
      const { team_name } = req.body || {};
      const enrollmentNo = req.user?.enrollment_no || req.user?.student_id;

      if (!group_id || !team_name || !team_name.trim()) {
        return ApiResponse.error(res, 'Group ID and team name are required', 400);
      }

      if (!enrollmentNo) {
        return ApiResponse.error(res, 'Enrollment number missing in token', 400);
      }

      const { data: memberRow, error: memberError } = await supabase
        .from('pbl')
        .select('group_id')
        .eq('enrollment_no', enrollmentNo)
        .maybeSingle();

      if (memberError) {
        return ApiResponse.error(res, memberError.message || 'Failed to validate group membership', 500);
      }

      if (!memberRow?.group_id) {
        return ApiResponse.error(res, 'Group not found for the student', 404);
      }

      if (memberRow.group_id !== group_id) {
        return ApiResponse.error(res, 'You are not allowed to update this group', 403);
      }

      const { data: updatedRows, error: updateError } = await supabase
        .from('pbl')
        .update({ team_name: team_name.trim() })
        .eq('group_id', group_id)
        .select('group_id, team_name');

      if (updateError) {
        return ApiResponse.error(res, updateError.message || 'Failed to update team name', 500);
      }

      return ApiResponse.success(res, 'Team name updated successfully', {
        group_id,
        team_name: updatedRows?.[0]?.team_name || team_name.trim()
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/student/problem-statement',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('student', 'admin', 'mentor'),
  deadlineBlocker('problem_statement'),
  problemStatementController.submitProblemStatement,
);

router.get(
  '/student/problem-statement/:group_id',
  authMiddleware.authenticateUser,
  problemStatementController.getProblemStatement,
);

router.put(
  '/student/problem-statement/:group_id',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('student', 'admin', 'mentor'),
  deadlineBlocker('problem_statement'),
  problemStatementController.editProblemStatement,
);

router.delete(
  '/student/problem-statement/:group_id',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('student', 'admin'),
  deadlineBlocker('problem_statement'),
  problemStatementController.deleteProblemStatement,
);

export default router;
