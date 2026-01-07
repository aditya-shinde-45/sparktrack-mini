import express from 'express';
import problemStatementController from '../../controllers/students/problemStatementController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import supabase from '../../config/database.js';
import ApiResponse from '../../utils/apiResponse.js';

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
        .select('group_id, team_name, guide_name')
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

router.post(
  '/student/problem-statement',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('student', 'admin', 'mentor'),
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
  problemStatementController.editProblemStatement,
);

router.delete(
  '/student/problem-statement/:group_id',
  authMiddleware.authenticateUser,
  authMiddleware.restrictTo('student', 'admin'),
  problemStatementController.deleteProblemStatement,
);

export default router;
