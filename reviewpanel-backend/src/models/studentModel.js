import supabase from '../config/database.js';

/**
 * Student data model for working with core student information
 */
class StudentModel {
  constructor() {
    this.studentsTable = 'students';
    this.profileTable = 'student_profiles';
    this.pblTable = 'pbl';
    this.announcementsTable = 'announcements';
  }

  /**
   * Fetch all students along with their profile information (if available)
   */
  async getAllWithProfiles() {
    const { data: students, error: studentsError } = await supabase
      .from(this.studentsTable)
      .select('*')
      .order('name', { ascending: true });

    if (studentsError) throw studentsError;

    const { data: profiles, error: profilesError } = await supabase
      .from(this.profileTable)
      .select('*');

    if (profilesError) throw profilesError;

    const profileMap = new Map();
    (profiles || []).forEach(profile => {
      profileMap.set(profile.enrollment_no, profile);
    });

    return (students || []).map(student => {
      const profile = profileMap.get(student.enrollment_no) || {};

      return {
        ...student,
        name_of_students: student.name,
        bio: profile.bio ?? null,
        skills: profile.skills ?? null,
        github_url: profile.github_url ?? null,
        linkedin_url: profile.linkedin_url ?? null,
        portfolio_url: profile.portfolio_url ?? null,
        profile_picture_url: profile.profile_picture_url ?? null,
        resume_url: profile.resume_url ?? null,
        phone: profile.phone ?? null,
      };
    });
  }

  /**
   * Fetch a single student with profile and group information
   * @param {string} enrollmentNo
   */
  async getByEnrollmentNo(enrollmentNo) {
    const { data: student, error: studentError } = await supabase
      .from(this.studentsTable)
      .select('*')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (studentError) throw studentError;

    const { data: profile, error: profileError } = await supabase
      .from(this.profileTable)
      .select('*')
      .eq('enrollment_no', enrollmentNo)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const { data: groupEntry, error: groupError } = await supabase
      .from(this.pblTable)
      .select('group_id')
      .eq('enrollement_no', enrollmentNo)
      .maybeSingle();

    if (groupError && groupError.code !== 'PGRST116') {
      throw groupError;
    }

    return {
      ...student,
      name_of_students: student.name,
      group_id: groupEntry?.group_id || null,
      bio: profile?.bio ?? null,
      skills: profile?.skills ?? null,
      github_url: profile?.github_url ?? null,
      linkedin_url: profile?.linkedin_url ?? null,
      portfolio_url: profile?.portfolio_url ?? null,
      profile_picture_url: profile?.profile_picture_url ?? null,
      resume_url: profile?.resume_url ?? null,
      phone: profile?.phone ?? null,
    };
  }

  /**
   * Fetch full profile details for a student by enrollment
   */
  async getProfileByEnrollment(enrollmentNo) {
    return this.getByEnrollmentNo(enrollmentNo);
  }

  /**
   * Fetch group details and members for a student's enrollment number
   */
  async getGroupDetails(enrollmentNo) {
    const { data: groupEntry, error: groupEntryError } = await supabase
      .from(this.pblTable)
      .select('group_id')
      .eq('enrollement_no', enrollmentNo)
      .maybeSingle();

    if (groupEntryError && groupEntryError.code !== 'PGRST116') {
      throw groupEntryError;
    }

    if (!groupEntry?.group_id) {
      return null;
    }

    const groupId = groupEntry.group_id;

    const { data: members, error: membersError } = await supabase
      .from(this.pblTable)
      .select('enrollement_no, name_of_student, guide_name')
      .eq('group_id', groupId)
      .order('enrollement_no', { ascending: true });

    if (membersError) throw membersError;

    const enrollmentNumbers = members.map(member => member.enrollement_no);

    let profiles = [];
    if (enrollmentNumbers.length) {
      const { data: profileRows, error: profilesError } = await supabase
        .from(this.profileTable)
        .select('enrollment_no, profile_picture_url')
        .in('enrollment_no', enrollmentNumbers);

      if (profilesError) throw profilesError;
      profiles = profileRows || [];
    }

    const profileMap = new Map();
    profiles.forEach(profile => {
      profileMap.set(profile.enrollment_no, profile.profile_picture_url);
    });

    return {
      group_id: groupId,
      guide_name: members[0]?.guide_name || null,
      members: members.map(member => ({
        ...member,
        profile_picture_url: profileMap.get(member.enrollement_no) || null,
      })),
    };
  }

  /**
   * Fetch announcements filtered by class prefix
   */
  async getAnnouncementsByClassPrefix(classPrefix) {
    const { data, error } = await supabase
      .from(this.announcementsTable)
      .select('*')
      .ilike('class', `${classPrefix}%`);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get students filtered by class name
   */
  async getStudentsByClass(className) {
    const { data, error } = await supabase
      .from(this.studentsTable)
      .select(`*, ${this.profileTable}!left(bio, skills, phone, github_url, linkedin_url, portfolio_url, resume_url, profile_picture_url)`)
      .eq('class', className)
      .order('name', { ascending: true });

    if (error) throw error;
    return this.#flattenStudentProfileRows(data || []);
  }

  /**
   * Get students filtered by specialization
   */
  async getStudentsBySpecialization(specialization) {
    const { data, error } = await supabase
      .from(this.studentsTable)
      .select(`*, ${this.profileTable}!left(bio, skills, phone, github_url, linkedin_url, portfolio_url, resume_url, profile_picture_url)`)
      .ilike('specialization', `%${specialization}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return this.#flattenStudentProfileRows(data || []);
  }

  /**
   * Get students who belong to a particular group (from PBL table)
   */
  async getStudentsByGroup(groupId) {
    const { data, error } = await supabase
      .from(this.pblTable)
      .select('enrollement_no, name_of_student, class, email_id, contact')
      .eq('group_id', groupId)
      .order('enrollement_no', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update core student information in the students table
   */
  async updateStudent(enrollmentNo, updates) {
    const payload = {
      name: updates.name,
      email_id: updates.email,
      contact: updates.phone,
      department: updates.department,
      skills: updates.skills,
      interests: updates.interests,
    };

    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    if (!Object.keys(payload).length) {
      return null;
    }

    const { data, error } = await supabase
      .from(this.studentsTable)
      .update(payload)
      .eq('enrollment_no', enrollmentNo)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Helper to flatten nested student & profile rows from Supabase
   */
  #flattenStudentProfileRows(rows) {
    return rows.map(row => {
      const profile = row[this.profileTable]?.[0] || {};
      const { [this.profileTable]: _, ...studentData } = row;

      return {
        ...studentData,
        name_of_students: studentData.name,
        bio: profile.bio ?? null,
        skills: profile.skills ?? null,
        github_url: profile.github_url ?? null,
        linkedin_url: profile.linkedin_url ?? null,
        portfolio_url: profile.portfolio_url ?? null,
        profile_picture_url: profile.profile_picture_url ?? null,
        resume_url: profile.resume_url ?? null,
        phone: profile.phone ?? null,
      };
    });
  }
}

export default new StudentModel();
