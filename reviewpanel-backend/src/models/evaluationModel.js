import supabase from '../config/database.js';

/**
 * Evaluation model for handling PBL evaluations
 */
class EvaluationModel {
  constructor() {
    this.table = 'pbl';
  }

  /**
   * Check if external evaluator has already evaluated a group
   * @param {string} groupId - Group ID
   */
  async checkExternalEvaluation(groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('externalname')
      .eq('group_id', groupId)
      .limit(1);

    if (error) throw error;
    
    return data && data.length > 0 && data[0].externalname;
  }

  /**
   * Save evaluation for a student
   * @param {string} groupId - Group ID
   * @param {string} enrollmentNo - Student enrollment number
   * @param {object} evalData - Evaluation data
   */
  async saveStudentEvaluation(groupId, enrollmentNo, evalData) {
    const {
      A, B, C, D, E,
      feedback,
      externalname,
      crieya,
      patent,
      copyright,
      aic,
      tech_transfer
    } = evalData;

    // Calculate total marks
    const total = 
      Number(A || 0) +
      Number(B || 0) +
      Number(C || 0) +
      Number(D || 0) +
      Number(E || 0);

    const { data, error } = await supabase
      .from(this.table)
      .update({
        A, B, C, D, E,
        total,
        feedback,
        externalname: externalname || null,
        crieya: crieya || null,
        patent: patent || null,
        copyright: copyright || null,
        aic: aic || null,
        tech_transfer: tech_transfer || null
      })
      .eq('group_id', groupId)
      .eq('enrollement_no', enrollmentNo)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Save a batch of evaluations for a group
   */
  async saveEvaluationBatch(groupId, evaluations, metadata = {}) {
    const updates = [];

    for (const evalData of evaluations) {
      const { enrollement_no, A, B, C, D, E } = evalData;

      const payload = {
        A,
        B,
        C,
        D,
        E,
        feedback: metadata.feedback ?? evalData.feedback ?? null,
        externalname: metadata.externalname ?? metadata.external_name ?? evalData.externalname ?? null,
        crieya: metadata.crieya ?? evalData.crieya ?? null,
        patent: metadata.patent ?? evalData.patent ?? null,
        copyright: metadata.copyright ?? evalData.copyright ?? null,
        aic: metadata.aic ?? evalData.aic ?? null,
        tech_transfer: metadata.tech_transfer ?? evalData.tech_transfer ?? null,
      };

      const result = await this.saveStudentEvaluation(groupId, enrollement_no, payload);
      updates.push(...(result || []));
    }

    return updates;
  }

  /**
   * Get students by group ID with evaluation data
   * @param {string} groupId - Group ID
   */
  async getStudentsByGroup(groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        enrollement_no,
        name_of_student,
        guide_name,
        A, B, C, D, E,
        total,
        feedback,
        crieya,
        copyright,
        patent,
        aic,
        tech_transfer
      `)
      .eq('group_id', groupId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Calculate average scores for a group across criteria A-E and total
   */
  async calculateAverageScores(groupId) {
    const students = await this.getStudentsByGroup(groupId);

    if (!students.length) {
      return {
        averages: { A: 0, B: 0, C: 0, D: 0, E: 0 },
        totalAverage: 0,
      };
    }

    const criteria = ['A', 'B', 'C', 'D', 'E'];
    const sums = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
    };
    const counts = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
    };

    let totalSum = 0;
    let totalCount = 0;

    students.forEach(student => {
      criteria.forEach(key => {
        const value = Number(student[key]);
        if (!Number.isNaN(value)) {
          sums[key] += value;
          counts[key] += 1;
        }
      });

      const total = Number(student.total);
      if (!Number.isNaN(total)) {
        totalSum += total;
        totalCount += 1;
      }
    });

    const averages = criteria.reduce((acc, key) => {
      acc[key] = counts[key] ? sums[key] / counts[key] : 0;
      return acc;
    }, {});

    return {
      averages,
      totalAverage: totalCount ? totalSum / totalCount : 0,
    };
  }

  /**
   * Retrieve a lightweight summary of evaluations across all groups
   */
  async getAllEvaluationsSummary() {
    const { data, error } = await supabase
      .from(this.table)
      .select('group_id, total, externalname, updated_at')
      .not('group_id', 'is', null);

    if (error) throw error;

    const groups = new Map();

    (data || []).forEach(row => {
      if (!groups.has(row.group_id)) {
        groups.set(row.group_id, {
          group_id: row.group_id,
          evaluations: 0,
          totalScore: 0,
          external: row.externalname || null,
          lastUpdated: row.updated_at || null,
        });
      }

      const group = groups.get(row.group_id);
      const score = Number(row.total);
      if (!Number.isNaN(score)) {
        group.totalScore += score;
        group.evaluations += 1;
      }

      if (row.updated_at && (!group.lastUpdated || new Date(row.updated_at) > new Date(group.lastUpdated))) {
        group.lastUpdated = row.updated_at;
      }

      if (!group.external && row.externalname) {
        group.external = row.externalname;
      }
    });

    return Array.from(groups.values()).map(group => ({
      ...group,
      averageScore: group.evaluations ? group.totalScore / group.evaluations : 0,
    }));
  }
}

export default new EvaluationModel();