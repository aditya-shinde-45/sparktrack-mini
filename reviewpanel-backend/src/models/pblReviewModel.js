import supabase from '../config/database.js';
import deadlineModel from './deadlineModel.js';

/**
 * PBL Review model
 */
class PblReviewModel {
  constructor() {
    this.tables = {
      review1: 'pbl1',
      review2: 'pbl2'
    };
  }

  /**
   * Get Review 1 marks for a student
   * @param {string} enrollmentNo - Student enrollment number
   */
  async getReview1Marks(enrollmentNo) {
    const { data, error } = await supabase
      .from(this.tables.review1)
      .select('enrollement_no, total, feedback, A, B, C, D, E')
      .eq('enrollement_no', enrollmentNo)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get Review 2 marks for a student
   * @param {string} enrollmentNo - Student enrollment number
   */
  async getReview2Marks(enrollmentNo) {
    const { data, error } = await supabase
      .from(this.tables.review2)
      .select('enrollement_no, total, feedback, A, B, C, D, E')
      .eq('enrollement_no', enrollmentNo)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update Review 1 marks for a student
   * @param {string} enrollmentNo - Student enrollment number
   * @param {object} marks - Marks data
   */
  async updateReview1Marks(enrollmentNo, marks) {
    const { data, error } = await supabase
      .from(this.tables.review1)
      .update(marks)
      .eq('enrollement_no', enrollmentNo)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Update Review 2 marks for a student
   * @param {string} enrollmentNo - Student enrollment number
   * @param {object} marks - Marks data
   */
  async updateReview2Marks(enrollmentNo, marks) {
    const { data, error } = await supabase
      .from(this.tables.review2)
      .update(marks)
      .eq('enrollement_no', enrollmentNo)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Get group evaluations for the currently active review
   * @param {string} groupId - Group ID
   */
  async getGroupEvaluationsByActiveReview(groupId) {
    // First check if pbl_review_2 is enabled
    const review2 = await deadlineModel.getByKey('pbl_review_2');
    
    if (review2 && review2.enabled) {
      return this.getGroupEvaluations(groupId, 2);
    }
    
    // If review 2 is not enabled, check if review 1 is enabled
    const review1 = await deadlineModel.getByKey('pbl_review_1');
    
    if (review1 && review1.enabled) {
      return this.getGroupEvaluations(groupId, 1);
    }
    
    // If neither is enabled, return empty array
    return [];
  }

  /**
   * Get group evaluations for a specific review
   * @param {string} groupId - Group ID
   * @param {number} reviewNumber - Review number (1 or 2)
   */
  async getGroupEvaluations(groupId, reviewNumber) {
    const tableName = reviewNumber === 1 ? this.tables.review1 : this.tables.review2;
    
    const { data, error } = await supabase
      .from(tableName)
      .select('enrollement_no, student_name, total, feedback, A, B, C, D, E, guide_name, external_name')
      .eq('group_id', groupId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Save evaluation for a group
   * @param {object} evaluation - Evaluation data
   * @param {number} reviewNumber - Review number (1 or 2)
   */
  async saveEvaluation(evaluation, reviewNumber) {
    const tableName = reviewNumber === 1 ? this.tables.review1 : this.tables.review2;
    
    // Delete existing evaluations for this group to avoid duplicates
    await supabase
      .from(tableName)
      .delete()
      .eq('group_id', evaluation.group_id);
    
    // Insert new evaluations
    const evaluationsToInsert = evaluation.evaluations.map(student => ({
      group_id: evaluation.group_id,
      enrollement_no: student.enrollement_no,
      student_name: student.student_name,
      guide_name: evaluation.faculty_guide,
      external_name: evaluation.external_name,
      feedback: evaluation.feedback,
      A: student.A,
      B: student.B,
      C: student.C,
      D: student.D,
      E: student.E,
      total: student.total
    }));
    
    const { data, error } = await supabase
      .from(tableName)
      .insert(evaluationsToInsert)
      .select();
    
    if (error) throw error;
    return data;
  }

  /**
   * Check if a specific PBL review is currently enabled
   * @param {number} reviewNumber - Review number (1 or 2)
   */
  async isReviewEnabled(reviewNumber) {
    const key = reviewNumber === 1 ? 'pbl_review_1' : 'pbl_review_2';
    const deadline = await deadlineModel.getByKey(key);
    return deadline && deadline.enabled;
  }
}

export default new PblReviewModel();