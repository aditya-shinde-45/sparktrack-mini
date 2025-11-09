import supabase from '../config/database.js';

/**
 * PBL3 Review model for PBL Review 3 operations
 */
class Pbl3Model {
  constructor() {
    this.table = 'pbl3';
  }

  /**
   * Get all groups with optional filtering
   * @param {string} classFilter - Optional class filter
   * @param {number} limit - Records per page
   * @param {number} offset - Offset for pagination
   * @param {string} searchQuery - Search term
   */
  async getAll(classFilter = null, limit = 50, offset = 0, searchQuery = '') {
    let countQuery = supabase
      .from(this.table)
      .select('*', { count: 'exact', head: true });

    if (classFilter) {
      countQuery = countQuery.or(`class.eq.${classFilter},class.ilike.${classFilter}-%`);
    }

    if (searchQuery) {
      countQuery = countQuery.or(`group_id.ilike.%${searchQuery}%,enrollement_no.ilike.%${searchQuery}%`);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    let dataQuery = supabase
      .from(this.table)
      .select('*')
      .order('group_id', { ascending: true });

    if (classFilter) {
      dataQuery = dataQuery.or(`class.eq.${classFilter},class.ilike.${classFilter}-%`);
    }

    if (searchQuery) {
      dataQuery = dataQuery.or(`group_id.ilike.%${searchQuery}%,enrollement_no.ilike.%${searchQuery}%`);
    }

    dataQuery = dataQuery.range(offset, offset + limit - 1);

    const { data, error: dataError } = await dataQuery;
    if (dataError) throw dataError;

    return {
      data: data || [],
      totalRecords: count || 0,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Get students by group ID with evaluation data
   * @param {string} groupId - Group ID
   */
  async getStudentsByGroup(groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId);

    if (error) throw error;
    
    return data || [];
  }

  /**
   * Get group evaluation data
   * @param {string} groupId - Group ID
   */
  async getGroupEvaluation(groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Save evaluation for a student in PBL Review 3
   * @param {string} groupId - Group ID
   * @param {string} enrollmentNo - Student enrollment number
   * @param {object} evalData - Evaluation data
   */
  async saveStudentEvaluation(groupId, enrollmentNo, evalData) {
    const {
      m1, m2, m3, m4, m5, m6,
      absent,
      feedback,
      guide_name,
      industry_guide,
      industry_guide_contact,
      industry_guide_email,
      external1_name,
      external2_name,
      organization1_name,
      organization2_name,
      external1_phone,
      external2_phone,
      external1_email,
      external2_email,
      copyright,
      patent,
      research_paper,
      submission_date
    } = evalData;

    // Calculate total marks
    let total;
    if (absent) {
      total = "AB";
    } else {
      total = 
        (Number(m1) || 0) +
        (Number(m2) || 0) +
        (Number(m3) || 0) +
        (Number(m4) || 0) +
        (Number(m5) || 0) +
        (Number(m6) || 0);
    }

    // Build update payload - only include fields that are explicitly provided
    const updatePayload = {
      m1: absent ? null : (m1 !== undefined ? m1 : null),
      m2: absent ? null : (m2 !== undefined ? m2 : null),
      m3: absent ? null : (m3 !== undefined ? m3 : null),
      m4: absent ? null : (m4 !== undefined ? m4 : null),
      m5: absent ? null : (m5 !== undefined ? m5 : null),
      m6: absent ? null : (m6 !== undefined ? m6 : null),
      total,
      absent: absent || false,
      submission_date: submission_date || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    };

    // Only add optional fields if they are provided (to avoid overwriting existing data)
    if (feedback !== undefined) updatePayload.feedback = feedback;
    if (guide_name !== undefined) updatePayload.guide_name = guide_name;
    if (industry_guide !== undefined) updatePayload.industry_guide = industry_guide;
    if (industry_guide_contact !== undefined) updatePayload.industry_guide_contact = industry_guide_contact;
    if (industry_guide_email !== undefined) updatePayload.industry_guide_email = industry_guide_email;
    if (external1_name !== undefined) updatePayload.external1_name = external1_name;
    if (external2_name !== undefined) updatePayload.external2_name = external2_name;
    if (organization1_name !== undefined) updatePayload.external1_org = organization1_name;
    if (organization2_name !== undefined) updatePayload.external2_org = organization2_name;
    if (external1_phone !== undefined) updatePayload.external1_phone = external1_phone;
    if (external2_phone !== undefined) updatePayload.external2_phone = external2_phone;
    if (external1_email !== undefined) updatePayload.external1_email = external1_email;
    if (external2_email !== undefined) updatePayload.external2_email = external2_email;
    if (copyright !== undefined) updatePayload.copyright = copyright;
    if (patent !== undefined) updatePayload.patent = patent;
    if (research_paper !== undefined) updatePayload.research_paper = research_paper;

    const { data, error } = await supabase
      .from(this.table)
      .update(updatePayload)
      .eq('group_id', groupId)
      .eq('enrollement_no', enrollmentNo)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Save a batch of evaluations for PBL Review 3
   * @param {string} groupId - Group ID
   * @param {array} evaluations - Array of evaluation data
   * @param {object} metadata - Common metadata for all students
   */
  async saveEvaluationBatch(groupId, evaluations, metadata = {}) {
    const updates = [];
    const submissionDate = new Date().toISOString().split('T')[0];

    for (const evalData of evaluations) {
      const { enrollement_no, m1, m2, m3, m4, m5, m6, absent } = evalData;

      const payload = {
        m1,
        m2,
        m3,
        m4,
        m5,
        m6,
        absent: absent || false,
        feedback: metadata.feedback ?? evalData.feedback ?? null,
        guide_name: metadata.guide_name ?? evalData.guide_name ?? null,
        industry_guide: metadata.industry_guide ?? evalData.industry_guide ?? null,
        industry_guide_contact: metadata.industry_guide_contact ?? evalData.industry_guide_contact ?? null,
        industry_guide_email: metadata.industry_guide_email ?? evalData.industry_guide_email ?? null,
        external1_name: metadata.external1_name ?? evalData.external1_name ?? null,
        external2_name: metadata.external2_name ?? evalData.external2_name ?? null,
        organization1_name: metadata.organization1_name ?? evalData.organization1_name ?? null,
        organization2_name: metadata.organization2_name ?? evalData.organization2_name ?? null,
        external1_phone: metadata.external1_phone ?? evalData.external1_phone ?? null,
        external2_phone: metadata.external2_phone ?? evalData.external2_phone ?? null,
        external1_email: metadata.external1_email ?? evalData.external1_email ?? null,
        external2_email: metadata.external2_email ?? evalData.external2_email ?? null,
        copyright: metadata.copyright ?? evalData.copyright ?? null,
        patent: metadata.patent ?? evalData.patent ?? null,
        research_paper: metadata.research_paper ?? evalData.research_paper ?? null,
        submission_date: submissionDate,
      };

      const result = await this.saveStudentEvaluation(groupId, enrollement_no, payload);
      updates.push(...(result || []));
    }

    return updates;
  }

  /**
   * Register external evaluators for a group (called by mentor)
   * @param {string} groupId - Group ID
   * @param {array} externals - Array of external evaluator details
   */
  async registerExternals(groupId, externals) {
    const updates = [];

    // Validate: minimum 1, maximum 2 externals
    if (!externals || externals.length < 1 || externals.length > 2) {
      throw new Error('Must provide 1 or 2 external evaluators');
    }

    const external1 = externals[0];
    const external2 = externals.length > 1 ? externals[1] : null;

    // Update all students in the group with external evaluator details
    const updatePayload = {
      external1_name: external1.name,
      external1_org: external1.organization,
      external1_phone: external1.phone,
      external1_email: external1.email,
      external1_otp_verified: false, // Will be verified later
    };

    if (external2) {
      updatePayload.external2_name = external2.name;
      updatePayload.external2_org = external2.organization;
      updatePayload.external2_phone = external2.phone;
      updatePayload.external2_email = external2.email;
      updatePayload.external2_otp_verified = false;
    }

    const { data, error } = await supabase
      .from(this.table)
      .update(updatePayload)
      .eq('group_id', groupId)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Verify external evaluator OTP
   * @param {string} groupId - Group ID
   * @param {string} email - External email
   * @param {string} otp - OTP to verify
   */
  async verifyExternalOTP(groupId, email, otp) {
    // For now, OTP is hardcoded as "123456"
    if (otp !== '123456') {
      return { verified: false, message: 'Invalid OTP' };
    }

    // Check which external this is (external1 or external2)
    const { data: students, error: fetchError } = await supabase
      .from(this.table)
      .select('external1_email, external2_email')
      .eq('group_id', groupId)
      .limit(1);

    if (fetchError || !students || students.length === 0) {
      throw new Error('Group not found');
    }

    const student = students[0];
    let updateField = null;

    if (student.external1_email === email) {
      updateField = 'external1_otp_verified';
    } else if (student.external2_email === email) {
      updateField = 'external2_otp_verified';
    } else {
      return { verified: false, message: 'Email not registered for this group' };
    }

    // Update OTP verified status for all students in the group
    const updatePayload = {};
    updatePayload[updateField] = true;

    const { data, error } = await supabase
      .from(this.table)
      .update(updatePayload)
      .eq('group_id', groupId)
      .select();

    if (error) throw error;

    return { verified: true, message: 'OTP verified successfully', data };
  }

  /**
   * Check if a group exists
   * @param {string} groupId - Group ID
   */
  async groupExists(groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('group_id')
      .eq('group_id', groupId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  }

  /**
   * Create new group with students
   * @param {array} rows - Array of student records
   */
  async createGroup(rows) {
    const { data, error } = await supabase
      .from(this.table)
      .insert(rows)
      .select();

    if (error) throw error;
    return data;
  }
}

export default new Pbl3Model();
