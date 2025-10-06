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
        contact
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

  /**
   * Check if external evaluator has already evaluated a group for Review 2
   * @param {string} groupId - Group ID
   */
  async checkExternalEvaluationReview2(groupId) {
    const { data, error } = await supabase
      .from('pbl2')
      .select('external1, external2')
      .eq('group_id', groupId)
      .limit(1);

    if (error) throw error;
    
    // Check if either external1 or external2 has a value
    return data && data.length > 0 && (data[0].external1 || data[0].external2);
  }

  /**
   * Save evaluation for a student in PBL Review 2
   * @param {string} groupId - Group ID
   * @param {string} enrollmentNo - Student enrollment number
   * @param {object} evalData - Evaluation data with m1-m7 fields
   */
  async saveStudentEvaluationReview2(groupId, enrollmentNo, evalData) {
    const {
      A, B, C, D, E, F, G,
      absent,
      feedback,
      faculty_guide,
      industry_guide,
      external1_name,
      external2_name,
      organization1_name,
      organization2_name,
      google_meet_link,
      submission_date
    } = evalData;

    // Calculate total marks, handle "AB" for absent students
    let total;
    if (absent) {
      total = "AB";
    } else {
      total = 
        (Number(A) || 0) +
        (Number(B) || 0) +
        (Number(C) || 0) +
        (Number(D) || 0) +
        (Number(E) || 0) +
        (Number(F) || 0) +
        (Number(G) || 0);
    }

    const updatePayload = {
      m1: absent ? null : (A || null),
      m2: absent ? null : (B || null),
      m3: absent ? null : (C || null),
      m4: absent ? null : (D || null),
      m5: absent ? null : (E || null),
      m6: absent ? null : (F || null),
      m7: absent ? null : (G || null),
      total,
      feedback: feedback || null,
      guide_name: faculty_guide || null,
      ig: industry_guide || null,
      external1: external1_name || null,
      external2: external2_name || null,
      ext1_org: organization1_name || null,
      ext2_org: organization2_name || null,
      ext1_contact: evalData.ext1_contact || null,
      ext2_contact: evalData.ext2_contact || null,
      ext1_email: evalData.ext1_email || null,
      ext2_email: evalData.ext2_email || null,
      gm_link: google_meet_link || null,
      copyright: evalData.copyright || null,
      patent: evalData.patent || null,
      research_paper: evalData.research_paper || null,
      screenshot: evalData.screenshot || null,
      date: submission_date || new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase
      .from('pbl2')
      .update(updatePayload)
      .eq('group_id', groupId)
      .eq('enrollement_no', enrollmentNo)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Save a batch of evaluations for PBL Review 2
   */
  async saveEvaluationReview2Batch(groupId, evaluations, metadata = {}) {
    const updates = [];
    
    // Get current date in YYYY-MM-DD format for submission date
    const submissionDate = new Date().toISOString().split('T')[0];

    for (const evalData of evaluations) {
      const { enrollement_no, A, B, C, D, E, F, G, absent } = evalData;

      const payload = {
        A,
        B,
        C,
        D,
        E,
        F,
        G,
        absent: absent || false,
        feedback: metadata.feedback ?? evalData.feedback ?? null,
        faculty_guide: metadata.faculty_guide ?? evalData.faculty_guide ?? null,
        industry_guide: metadata.industry_guide ?? evalData.industry_guide ?? null,
        external1_name: metadata.external1_name ?? evalData.external1_name ?? null,
        external2_name: metadata.external2_name ?? evalData.external2_name ?? null,
        organization1_name: metadata.organization1_name ?? evalData.organization1_name ?? null,
        organization2_name: metadata.organization2_name ?? evalData.organization2_name ?? null,
        ext1_contact: metadata.ext1_contact ?? evalData.ext1_contact ?? null,
        ext2_contact: metadata.ext2_contact ?? evalData.ext2_contact ?? null,
        ext1_email: metadata.ext1_email ?? evalData.ext1_email ?? null,
        ext2_email: metadata.ext2_email ?? evalData.ext2_email ?? null,
        google_meet_link: metadata.google_meet_link ?? evalData.google_meet_link ?? null,
        copyright: metadata.copyright ?? evalData.copyright ?? null,
        patent: metadata.patent ?? evalData.patent ?? null,
        research_paper: metadata.research_paper ?? evalData.research_paper ?? null,
        screenshot: metadata.screenshot ?? evalData.screenshot ?? null,
        submission_date: submissionDate,
      };

      const result = await this.saveStudentEvaluationReview2(groupId, enrollement_no, payload);
      updates.push(...(result || []));
    }

    return updates;
  }

  /**
   * Get students by group ID with PBL Review 2 evaluation data
   * @param {string} groupId - Group ID
   */
  async getStudentsByGroupReview2(groupId) {
    const { data, error } = await supabase
      .from('pbl2')
      .select(`
        enrollement_no,
        name_of_student,
        guide_name,
        ig,
        contact,
        m1,
        m2,
        m3,
        m4,
        m5,
        m6,
        m7,
        total,
        feedback,
        external1,
        external2,
        ext1_org,
        ext2_org,
        ext1_contact,
        ext2_contact,
        ext1_email,
        ext2_email,
        gm_link,
        copyright,
        patent,
        research_paper,
        screenshot
      `)
      .eq('group_id', groupId);

    if (error) throw error;
    
    // Map m1-m7 to A-G and database columns to frontend-expected names
    return (data || []).map(student => ({
      ...student,
      A: student.m1,
      B: student.m2,
      C: student.m3,
      D: student.m4,
      E: student.m5,
      F: student.m6,
      G: student.m7,
      industry_guide: student.ig,
      external1_name: student.external1,
      external2_name: student.external2,
      organization1_name: student.ext1_org,
      organization2_name: student.ext2_org,
      externalname: student.external1 || student.external2,
    }));
  }
}

export default new EvaluationModel();