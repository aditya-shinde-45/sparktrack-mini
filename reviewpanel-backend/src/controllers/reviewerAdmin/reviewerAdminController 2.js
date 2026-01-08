import jwt from 'jsonwebtoken';
import reviewerAdminModel from '../../models/reviewerAdminModel.js';
import ApiResponse from '../../utils/apiResponse.js';
import config from '../../config/index.js';

class ReviewerAdminController {
  // Hardcoded credentials
  static CREDENTIALS = {
    username: 'revieweradmin',
    password: 'MITADT@2024'
  };

  /**
   * Reviewer Admin Login
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validate credentials
      if (username !== ReviewerAdminController.CREDENTIALS.username || 
          password !== ReviewerAdminController.CREDENTIALS.password) {
        return ApiResponse.unauthorized(res, 'Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          username: username,
          role: 'reviewerAdmin'
        },
        config.jwt.secret,
        { expiresIn: '24h' }
      );

      return ApiResponse.success(res, 'Login successful', {
        token,
        user: {
          username: username,
          role: 'reviewerAdmin'
        }
      });
    } catch (err) {
      console.error('Reviewer Admin login error:', err);
      return ApiResponse.error(res, 'Login failed', 500);
    }
  }

  /**
   * Reset all PBL2 marks for a group
   */
  async resetPbl2Marks(req, res) {
    try {
      const { groupId } = req.params;

      if (!groupId) {
        return ApiResponse.badRequest(res, 'Group ID is required');
      }

      const result = await reviewerAdminModel.resetPbl2Marks(groupId);

      return ApiResponse.success(res, `PBL2 marks reset successfully for group ${groupId}`, result);
    } catch (err) {
      console.error('Reset PBL2 marks error:', err);
      console.error('Error details:', err.message, err.stack);
      return ApiResponse.error(res, `Failed to reset PBL2 marks: ${err.message}`, 500);
    }
  }

  /**
   * Reset all PBL3 marks for a group
   */
  async resetPbl3Marks(req, res) {
    try {
      const { groupId } = req.params;

      if (!groupId) {
        return ApiResponse.badRequest(res, 'Group ID is required');
      }

      const result = await reviewerAdminModel.resetPbl3Marks(groupId);

      return ApiResponse.success(res, `PBL3 marks reset successfully for group ${groupId}`, result);
    } catch (err) {
      console.error('Reset PBL3 marks error:', err);
      console.error('Error details:', err.message, err.stack);
      return ApiResponse.error(res, `Failed to reset PBL3 marks: ${err.message}`, 500);
    }
  }

  /**
   * Edit individual student PBL2 marks
   */
  async editPbl2Marks(req, res) {
    try {
      const { groupId, studentId, marks } = req.body;

      if (!groupId || !studentId || !marks) {
        return ApiResponse.badRequest(res, 'Group ID, Student ID, and marks are required');
      }

      const result = await reviewerAdminModel.updatePbl2Marks(groupId, studentId, marks);

      return ApiResponse.success(res, 'PBL2 marks updated successfully', result);
    } catch (err) {
      console.error('Edit PBL2 marks error:', err);
      return ApiResponse.error(res, 'Failed to update PBL2 marks', 500);
    }
  }

  /**
   * Edit individual student PBL3 marks
   */
  async editPbl3Marks(req, res) {
    try {
      const { groupId, studentId, marks } = req.body;

      if (!groupId || !studentId || !marks) {
        return ApiResponse.badRequest(res, 'Group ID, Student ID, and marks are required');
      }

      const result = await reviewerAdminModel.updatePbl3Marks(groupId, studentId, marks);

      return ApiResponse.success(res, 'PBL3 marks updated successfully', result);
    } catch (err) {
      console.error('Edit PBL3 marks error:', err);
      return ApiResponse.error(res, 'Failed to update PBL3 marks', 500);
    }
  }

  /**
   * Get all groups for selection
   */
  async getAllGroups(req, res) {
    try {
      const groups = await reviewerAdminModel.getAllGroups();

      return ApiResponse.success(res, 'Groups fetched successfully', groups);
    } catch (err) {
      console.error('Get groups error:', err);
      return ApiResponse.error(res, 'Failed to fetch groups', 500);
    }
  }

  /**
   * Get PBL2 evaluation data for a group
   */
  async getPbl2Evaluation(req, res) {
    try {
      const { groupId } = req.params;

      if (!groupId) {
        return ApiResponse.badRequest(res, 'Group ID is required');
      }

      const data = await reviewerAdminModel.getPbl2Evaluation(groupId);

      return ApiResponse.success(res, 'PBL2 evaluation data fetched successfully', data);
    } catch (err) {
      console.error('Get PBL2 evaluation error:', err);
      console.error('Error details:', err.message, err.stack);
      return ApiResponse.error(res, `Failed to fetch PBL2 evaluation data: ${err.message}`, 500);
    }
  }

  /**
   * Get PBL3 evaluation data for a group
   */
  async getPbl3Evaluation(req, res) {
    try {
      const { groupId } = req.params;

      if (!groupId) {
        return ApiResponse.badRequest(res, 'Group ID is required');
      }

      const data = await reviewerAdminModel.getPbl3Evaluation(groupId);

      return ApiResponse.success(res, 'PBL3 evaluation data fetched successfully', data);
    } catch (err) {
      console.error('Get PBL3 evaluation error:', err);
      console.error('Error details:', err.message, err.stack);
      return ApiResponse.error(res, `Failed to fetch PBL3 evaluation data: ${err.message}`, 500);
    }
  }
}

export default new ReviewerAdminController();
