import supabase from '../config/database.js';

/**
 * PBL Group model for handling PBL groups and students data
 */
class PblModel {
  constructor() {
  this.table = 'pbl';
  this.evaluationTables = ['pbl1'];
  }

  /**
   * Get all PBL data with optional class filtering, review type, search, and pagination
   * @param {string} classFilter - Optional class filter
   * @param {string} reviewType - 'review1' or 'review2'
   * @param {number} limit - Number of records per page
   * @param {number} offset - Offset for pagination
   * @param {string} searchQuery - Search term for group_id or enrollment_no
   */
  async getAll(classFilter = null, reviewType = 'review1', limit = 50, offset = 0, searchQuery = '') {
    // Determine which table to query based on review type
    const tableName = reviewType === 'review2' ? 'pbl2' : 'pbl1';
    
    // First, get the total count
    let countQuery = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (classFilter) {
      countQuery = countQuery.or(`class.eq.${classFilter},class.ilike.${classFilter}-%`);
    }

    // Add search filter
    if (searchQuery) {
      countQuery = countQuery.or(`group_id.ilike.%${searchQuery}%,enrollement_no.ilike.%${searchQuery}%`);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    // Now get the paginated data
    let dataQuery = supabase
      .from(tableName)
      .select('*')
      .order('group_id', { ascending: true });

    if (classFilter) {
      dataQuery = dataQuery.or(`class.eq.${classFilter},class.ilike.${classFilter}-%`);
    }

    // Add search filter
    if (searchQuery) {
      dataQuery = dataQuery.or(`group_id.ilike.%${searchQuery}%,enrollement_no.ilike.%${searchQuery}%`);
    }

    // Apply range AFTER all filters
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    const { data, error: dataError } = await dataQuery;
    if (dataError) throw dataError;

    const totalPages = Math.ceil(count / limit);

    return {
      data: data || [],
      totalRecords: count || 0,
      totalPages: totalPages
    };
  }

  /**
   * Get a PBL group by group ID
   * @param {string} groupId - Group ID
   */
  async getByGroupId(groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Find a group by ID
   */
  async findGroupById(groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('group_id')
      .eq('group_id', groupId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  }

  /**
   * Create a new PBL group with multiple students
   * @param {array} rows - Array of student records for the group
   */
  async create(rows) {
    const { data, error } = await supabase
      .from(this.table)
      .insert(rows)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Update guide information for all students in a group
   * @param {string} groupId - Group ID
   * @param {object} guideInfo - Guide information to update
   */
  async updateGuideInfo(groupId, guideInfo) {
    const { error } = await supabase
      .from(this.table)
      .update(guideInfo)
      .eq('group_id', groupId);

    if (error) throw error;
    return true;
  }

  /**
   * Update a specific student in a PBL group
   * @param {string} groupId - Group ID
   * @param {string} enrollmentNo - Student enrollment number
   * @param {object} studentData - Student data to update
   */
  async updateStudent(groupId, enrollmentNo, studentData) {
    const { error } = await supabase
      .from(this.table)
      .update(studentData)
      .eq('group_id', groupId)
      .eq('enrollement_no', enrollmentNo);

    if (error) throw error;
    return true;
  }

  /**
   * Assign a list of students to a group by updating their PBL entries
   */
  async assignStudentsToGroup(studentIds, groupId) {
    const updates = [];

    for (const studentId of studentIds) {
      const { data, error } = await supabase
        .from(this.table)
        .update({ group_id: groupId })
        .eq('enrollement_no', studentId)
        .select();

      if (error) throw error;
      updates.push(...(data || []));
    }

    return updates;
  }

  /**
   * Check if a student belongs to a group
   */
  async isStudentInGroup(studentId, groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('enrollement_no')
      .eq('group_id', groupId)
      .eq('enrollement_no', studentId)
      .limit(1);

    if (error) throw error;
    return Boolean(data && data.length);
  }

  /**
   * Rough check if an external evaluator is associated with a group
   */
  async isExternalAssignedToGroup(externalId, groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('group_id')
      .eq('group_id', groupId)
      .like('group_id', `${externalId}%`)
      .limit(1);

    if (error) throw error;
    return Boolean(data && data.length);
  }
  /**
   * Delete all students in a group
   * @param {string} groupId - Group ID
   */
  async deleteGroup(groupId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('group_id', groupId);

    if (error) throw error;
    return true;
  }

  /**
   * Get count of distinct groups
   * @returns {number} Count of groups
   */
  async getGroupCount() {
    const { count, error } = await supabase
      .from(this.table)
      .select('group_id', { count: 'exact', head: true })
      .not('group_id', 'is', null);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get count of active projects
   * @returns {number} Count of active projects
   */
  async getActiveProjectsCount() {
    const evaluationData = await this.fetchEvaluationData('group_id, total');

    const groups = new Map();
    evaluationData.forEach(row => {
      if (!groups.has(row.group_id)) {
        groups.set(row.group_id, { entries: 0, completed: 0 });
      }
      const stats = groups.get(row.group_id);
      stats.entries += 1;
      if (row.total !== null && row.total !== undefined && row.total !== 'AB') {
        stats.completed += 1;
      }
    });

    let active = 0;
    groups.forEach(stats => {
      if (stats.completed > 0) {
        active += 1;
      }
    });

    return active;
  }

  /**
   * Get projects grouped by status
   * @returns {Object} Projects by status
   */
  async getProjectsByStatus() {
    const evaluationData = await this.fetchEvaluationData('group_id, total');

    const statusMap = {
      active: 0,
      pending: 0,
      completed: 0,
    };

    const groupStatus = new Map();

    evaluationData.forEach(row => {
      if (!groupStatus.has(row.group_id)) {
        groupStatus.set(row.group_id, { totalMarked: 0, entries: 0 });
      }
      const stats = groupStatus.get(row.group_id);
      stats.entries += 1;
      if (row.total !== null && row.total !== undefined && row.total !== 'AB') {
        stats.totalMarked += 1;
      }
    });

    groupStatus.forEach(stats => {
      if (stats.totalMarked === 0) {
        statusMap.pending += 1;
      } else if (stats.totalMarked === stats.entries) {
        statusMap.completed += 1;
      } else {
        statusMap.active += 1;
      }
    });

    return statusMap;
  }

  /**
   * Get projects grouped by department
   * @returns {Object} Projects by department
   */
  async getProjectsByDepartment() {
    const { data, error } = await supabase
      .from(this.table)
      .select('group_id, class');

    if (error) throw error;

    const departmentCounts = {};
    (data || []).forEach(row => {
      const department = row.class || 'Unknown';
      departmentCounts[department] = (departmentCounts[department] || 0) + 1;
    });

    return departmentCounts;
  }

  /**
   * Get top performing projects
   * @returns {Array} Top projects
   */
  async getTopPerformingProjects() {
  const evaluationData = await this.fetchEvaluationData('group_id, total');

    const filteredData = evaluationData.filter(row => row.total !== null && row.total !== undefined && row.total !== 'AB');

    const aggregated = new Map();
    filteredData.forEach(row => {
      if (!aggregated.has(row.group_id)) {
        aggregated.set(row.group_id, { group_id: row.group_id, total: 0, entries: 0 });
      }
      const stats = aggregated.get(row.group_id);
      const score = Number(row.total) || 0;
      stats.total += score;
      stats.entries += 1;
    });

    const averages = Array.from(aggregated.values()).map(item => ({
      group_id: item.group_id,
      score: item.entries ? item.total / item.entries : 0,
    }));

    averages.sort((a, b) => b.score - a.score);
    return averages.slice(0, 5);
  }

  /**
   * Get recent submissions
   * @returns {Array} Recent submissions
   */
  async getRecentSubmissions() {
    const evaluationData = await this.fetchEvaluationData('group_id, updated_at');

    const latestByGroup = new Map();

    evaluationData.forEach(row => {
      if (!row.updated_at) return;
      const existing = latestByGroup.get(row.group_id);
      if (!existing || new Date(row.updated_at) > new Date(existing.updated_at)) {
        latestByGroup.set(row.group_id, {
          group_id: row.group_id,
          updated_at: row.updated_at,
        });
      }
    });

    return Array.from(latestByGroup.values())
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 10);
  }

  /**
   * Fetch evaluation records from enabled review tables
   * @param {string} columns - Column selection string for Supabase
   * @returns {Promise<Array<object>>}
   */
  async fetchEvaluationData(columns) {
    const responses = await Promise.all(
      this.evaluationTables.map(tableName => supabase.from(tableName).select(columns))
    );

    const aggregated = [];

    responses.forEach(({ data, error }) => {
      if (error) {
        throw error;
      }
      if (data && data.length) {
        aggregated.push(...data);
      }
    });

    return aggregated;
  }
}

export default new PblModel();