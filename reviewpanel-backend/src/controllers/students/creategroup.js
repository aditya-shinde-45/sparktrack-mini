import supabase from '../../config/database.js';

/**
 * Create a new group
 * Fetches student data from pbl_2025 table and creates entries in pbl table
 */
export const createGroup = async (req, res) => {
  try {
    const {
      teamName,
      applicantEnrollment,
      member1Enrollment,
      member2Enrollment,
      member3Enrollment,
      continuePrevious,
      title,
      type,
      technologyBucket,
      domain
    } = req.body;

    // Validate required fields
    if (!teamName || !applicantEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Team name and applicant enrollment are required'
      });
    }

    // Collect all enrollment numbers
    const enrollments = [
      applicantEnrollment,
      member1Enrollment,
      member2Enrollment,
      member3Enrollment
    ].filter(Boolean);

    if (enrollments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one team member is required'
      });
    }

    // Check for duplicate enrollments
    const uniqueEnrollments = new Set(enrollments);
    if (uniqueEnrollments.size !== enrollments.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate enrollment numbers detected'
      });
    }

    // Fetch all student data from pbl_2025 table
    const { data: studentsData, error: fetchError } = await supabase
      .from('pbl_2025')
      .select('*')
      .in('enrollement_no', enrollments);

    if (fetchError) {
      console.error('Error fetching students from pbl_2025:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student data',
        error: fetchError.message
      });
    }

    // Check if all students exist
    if (!studentsData || studentsData.length !== enrollments.length) {
      const foundEnrollments = studentsData?.map(s => s.enrollement_no) || [];
      const missingEnrollments = enrollments.filter(e => !foundEnrollments.includes(e));
      
      return res.status(404).json({
        success: false,
        message: 'Some students not found in pbl_2025 table',
        missingEnrollments
      });
    }

    // Generate a unique group_id
    const groupId = await generateUniqueGroupId(teamName);

    // Check if students are already in a group
    const { data: existingGroups, error: existingError } = await supabase
      .from('pbl')
      .select('enrollment_no, group_id')
      .in('enrollment_no', enrollments);

    if (existingError) {
      console.error('Error checking existing groups:', existingError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing groups',
        error: existingError.message
      });
    }

    if (existingGroups && existingGroups.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some students are already part of a group',
        existingMembers: existingGroups
      });
    }

    // Prepare data for insertion into pbl table
    const pblInsertData = studentsData.map(student => ({
      group_id: groupId,
      enrollment_no: student.enrollement_no,
      student_name: student.name_of_student,
      class: student.class,
      email_id: student.email_id,
      contact: student.contact,
      guide_name: student.guide_name || null,
      guide_contact: student.guide_contact || null,
      guide_email: student.guide_email || null,
      ps_id: null,
      review1: null,
      review2: null,
      final: null
    }));

    // Insert into pbl table
    const { data: insertedData, error: insertError } = await supabase
      .from('pbl')
      .insert(pblInsertData)
      .select();

    if (insertError) {
      console.error('Error inserting into pbl table:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create group',
        error: insertError.message
      });
    }

    // If continuing previous project, handle problem statement creation
    let problemStatementId = null;
    if (continuePrevious && title) {
      const { data: psData, error: psError } = await supabase
        .from('problem_statements')
        .insert({
          title: title,
          type: type || 'Software',
          technology_bucket: technologyBucket || null,
          domain: domain || null,
          group_id: groupId,
          description: 'Continued from previous project'
        })
        .select()
        .single();

      if (!psError && psData) {
        problemStatementId = psData.id;
        
        // Update pbl table with ps_id
        await supabase
          .from('pbl')
          .update({ ps_id: problemStatementId })
          .eq('group_id', groupId);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      groupId: groupId,
      teamName: teamName,
      memberCount: insertedData.length,
      members: insertedData,
      problemStatementId: problemStatementId
    });

  } catch (error) {
    console.error('Error in createGroup:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Generate a unique group ID based on team name
 */
const generateUniqueGroupId = async (teamName) => {
  // Create base group ID from team name
  const baseId = teamName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 20);
  
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  
  let groupId = `${baseId}_${timestamp}_${randomSuffix}`;
  
  // Check if group ID already exists
  const { data, error } = await supabase
    .from('pbl')
    .select('group_id')
    .eq('group_id', groupId)
    .single();

  // If exists, add another random suffix
  if (data && !error) {
    const extraSuffix = Math.random().toString(36).substring(2, 4);
    groupId = `${groupId}_${extraSuffix}`;
  }

  return groupId;
};

/**
 * Get student details by enrollment number from pbl_2025 table
 */
export const getGroupByEnrollment = async (req, res) => {
  try {
    const { enrollmentNo } = req.params;

    if (!enrollmentNo) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment number is required'
      });
    }

    // Fetch student data from pbl_2025 table
    const { data, error } = await supabase
      .from('pbl_2025')
      .select('*')
      .eq('enrollement_no', enrollmentNo)
      .single();

    if (error) {
      console.error('Error fetching student from pbl_2025:', error);
      return res.status(404).json({
        success: false,
        message: 'Student not found in pbl_2025 table',
        error: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Return student data with mapped field names (only needed fields)
    return res.status(200).json({
      success: true,
      student: {
        enrollment_no: data.enrollement_no,
        student_name: data.name_of_student,
        class: data.class,
        contact: data.contact
      }
    });

  } catch (error) {
    console.error('Error in getGroupByEnrollment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get previous group data from pbl_2025 table
 */
export const getPreviousGroup = async (req, res) => {
  try {
    const { enrollmentNo } = req.params;

    if (!enrollmentNo) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment number is required'
      });
    }

    const { data, error } = await supabase
      .from('pbl_2025')
      .select('*')
      .eq('enrollement_no', enrollmentNo)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'No previous group found'
      });
    }

    // Get all members with the same group_id from pbl_2025
    const { data: groupMembers, error: groupError } = await supabase
      .from('pbl_2025')
      .select('*')
      .eq('group_id', data.group_id);

    if (groupError) {
      console.error('Error fetching previous group members:', groupError);
    }

    return res.status(200).json({
      success: true,
      previousGroup: data,
      members: groupMembers || []
    });

  } catch (error) {
    console.error('Error in getPreviousGroup:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export default {
  createGroup,
  getGroupByEnrollment,
  getPreviousGroup
};
