import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
/* LEGACY EVALUATION CONTROLLER REMOVED
import pblReviewModel from '../../models/pblReviewModel.js';
import supabase from '../../config/database.js';

/**
 * Controller for PBL Evaluation operations
 */
class PblEvaluationController {
  /**
   * Get PBL evaluations for a group based on the review type
   */
  getGroupEvaluations = asyncHandler(async (req, res) => {
    const { groupId, reviewType } = req.params;
    
    if (!groupId) {
      throw ApiError.badRequest('Group ID is required');
    }
    
    // Determine which review to use
    const reviewNumber = reviewType === 'pbl1' ? 1 : 2;
    
    // Check if this review type is currently enabled
    const isEnabled = await pblReviewModel.isReviewEnabled(reviewNumber);
    if (!isEnabled) {
      throw ApiError.forbidden(`PBL Review ${reviewNumber} is currently disabled by admin`);
    }
    
    const evaluations = await pblReviewModel.getGroupEvaluations(groupId, reviewNumber);
    
    return ApiResponse.success(res, 'Group evaluations retrieved successfully', evaluations);
  });

  /**
   * Save evaluation for a group based on the review type
   */
  saveEvaluation = asyncHandler(async (req, res) => {
    const { reviewType } = req.params;
    const evaluation = req.body;
    
    // Validate required fields
    if (!evaluation.group_id || !evaluation.evaluations) {
      throw ApiError.badRequest('Group ID and evaluations are required');
    }
    
    // Determine which review to use
    const reviewNumber = reviewType === 'pbl1' ? 1 : 2;
    
    // Check if this review type is currently enabled
    const isEnabled = await pblReviewModel.isReviewEnabled(reviewNumber);
    if (!isEnabled) {
      throw ApiError.forbidden(`PBL Review ${reviewNumber} is currently disabled by admin`);
    }
    
    // Save evaluation
    const saved = await pblReviewModel.saveEvaluation(evaluation, reviewNumber);
    
    return ApiResponse.success(res, `PBL Review ${reviewNumber} saved successfully`, { saved });
  });

  /**
   * Get Zero Review data from internship_details table
   */
  getZeroReviewData = asyncHandler(async (req, res) => {
    const { classFilter, page = 1, limit = 50, search = '', status = 'all' } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('internship_details')
      .select('enrollment_no, student_name, organization_name, group_id, m1, m2, m3, m4, m5, total, guide, external, file_url, remark', { count: 'exact' });
    
    // Apply search filter
    if (search) {
      query = query.or(`enrollment_no.ilike.%${search}%,student_name.ilike.%${search}%`);
    }
    
    // Apply status filter based on total column
    if (status === 'done') {
      query = query.not('total', 'is', null);
    } else if (status === 'notdone') {
      query = query.is('total', null);
    }
    
    // Apply class filter (for final year - LY and LYIT)
    // Assuming enrollment numbers have year patterns
    // Adjust this logic based on your actual enrollment number format
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('group_id', { ascending: true });
    
    const { data, error, count } = await query;
    
    if (error) {
      throw ApiError.internalError('Failed to fetch zero review data: ' + error.message);
    }
    
    return ApiResponse.success(res, 'Zero review data retrieved successfully', {
      data: data || [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / limit),
        totalRecords: count || 0,
        recordsPerPage: parseInt(limit)
      }
    });
  });

  /**
   * Download Zero Review data as CSV (all records)
   */
  downloadZeroReviewCSV = asyncHandler(async (req, res) => {
    const { search = '', status = 'all' } = req.query;
    
    // Build query to fetch all data
    let query = supabase
      .from('internship_details')
      .select('enrollment_no, student_name, organization_name, group_id, m1, m2, m3, m4, m5, total, guide, external, remark');
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`enrollment_no.ilike.%${search}%,student_name.ilike.%${search}%`);
    }
    
    // Apply status filter based on total column
    if (status === 'done') {
      query = query.not('total', 'is', null);
    } else if (status === 'notdone') {
      query = query.is('total', null);
    }
    
    query = query.order('group_id', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      throw ApiError.internalError('Failed to fetch zero review data: ' + error.message);
    }
    
    // Convert to CSV format
    const csvHeaders = [
      'Group ID',
      'Enrollment No',
      'Student Name',
      'Organization Name',
      'M1',
      'M2',
      'M3',
      'M4',
      'M5',
      'Total',
      'Guide',
      'External',
      'Remark'
    ];
    
    const csvRows = data.map(row => [
      row.group_id || '',
      row.enrollment_no || '',
      row.student_name || '',
      row.organization_name || '',
      row.m1 ?? '',
      row.m2 ?? '',
      row.m3 ?? '',
      row.m4 ?? '',
      row.m5 ?? '',
      row.total || '',
      row.guide || '',
      row.external || '',
      row.remark ? 'Yes' : 'No'
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="zero_review_data_${new Date().toISOString().split('T')[0]}.csv"`);
    
    return res.send(csvContent);
  });
}

export default new PblEvaluationController();
*/

export default {};