import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import supabase from '../../config/database.js';

/**
 * Controller for Zeroth Review (Final Year) operations
 */
class ZerothReviewController {
  /**
   * Submit Zeroth Review Evaluation
   */
  submitZerothReview = asyncHandler(async (req, res) => {
    const {
      group_id,
      project_id,
      class: className,
      date,
      project_title,
      guide_name,
      scope_redefinition,
      expert_name,
      expert_phone,
      expert_email,
      students,
      internships
    } = req.body;

    // Validate required fields
    if (!group_id || !project_id || !date || !expert_name || !expert_phone || !expert_email) {
      throw ApiError.badRequest('Missing required fields');
    }

    if (!students || students.length === 0) {
      throw ApiError.badRequest('Student data is required');
    }

    // Debug log to check if scope_redefinition is received
    console.log('Received scope_redefinition:', scope_redefinition);

    // Get mentor info from token
    const mentor_id = req.user?.mentor_id;
    const mentor_name = req.user?.mentor_name;

    if (!mentor_id) {
      throw ApiError.unauthorized('Mentor authentication required');
    }

    try {
      // Begin transaction-like operations
      const results = {
        students_processed: [],
        internships_created: [],
        review_record: null
      };

      // Process each student's internship and marks together
      for (const student of students) {
        // Find internship(s) for this student
        const studentInternships = internships.filter(
          int => int.enrollment_no === student.enrollment_no
        );

        // Process each internship for this student
        for (const internship of studentInternships) {
          // Skip completely empty rows
          if (!internship.company_name && !internship.start_date && !internship.profile_task) {
            continue;
          }

          const internshipData = {
            enrollment_no: student.enrollment_no,
            student_name: student.name,
            group_id: group_id,
            guide: guide_name,
            organization_name: internship.company_name || 'Not Specified',
            internship_type: internship.mode || 'Online',
            start_date: internship.start_date || null,
            end_date: internship.end_date || null,
            role: internship.profile_task || null,
            remark: internship.remark || 'Pending',
            // Store marks in existing columns
            m1: student.marks.literature_survey || 0,
            m2: student.marks.status_sem7 || 0,
            m3: student.marks.technical_readiness || 0,
            m4: student.marks.knowledge_problem || 0,
            m5: student.marks.plan_development || 0,
            total: student.marks.total || 0,
            // Use existing 'external' column for expert name
            external: expert_name,
            // Store scope redefinition in scope column
            scope: scope_redefinition || null,
            // Add class and project_title if columns exist
            ...(className && { class: className }),
            ...(project_title && { project_title: project_title })
          };

          // Check if internship exists for this student and group
          const { data: existingInternship } = await supabase
            .from('internship_details')
            .select('id')
            .eq('enrollment_no', student.enrollment_no)
            .eq('group_id', group_id)
            .maybeSingle();

          if (existingInternship) {
            // Update existing record
            const { data: updated, error: updateError } = await supabase
              .from('internship_details')
              .update(internshipData)
              .eq('enrollment_no', student.enrollment_no)
              .eq('group_id', group_id)
              .select()
              .maybeSingle();

            if (updateError) {
              console.error('Error updating internship:', updateError);
              throw updateError;
            }
            results.internships_created.push(updated);
          } else {
            // Insert new record
            const { data: inserted, error: insertError } = await supabase
              .from('internship_details')
              .insert([internshipData])
              .select()
              .maybeSingle();

            if (insertError) {
              console.error('Error inserting internship:', insertError);
              throw insertError;
            }
            results.internships_created.push(inserted);
          }
        }

        // If student has no internship data, still create a record with marks
        if (studentInternships.length === 0 || 
            studentInternships.every(int => !int.company_name && !int.start_date && !int.profile_task)) {
          
          const marksOnlyData = {
            enrollment_no: student.enrollment_no,
            student_name: student.name,
            group_id: group_id,
            guide: guide_name,
            organization_name: 'No Internship',
            internship_type: 'Not Specified',
            remark: 'Pending',
            // Store marks
            m1: student.marks.literature_survey || 0,
            m2: student.marks.status_sem7 || 0,
            m3: student.marks.technical_readiness || 0,
            m4: student.marks.knowledge_problem || 0,
            m5: student.marks.plan_development || 0,
            total: student.marks.total || 0,
            external: expert_name,
            // Store scope redefinition in scope column
            scope: scope_redefinition || null,
            ...(className && { class: className }),
            ...(project_title && { project_title: project_title })
          };

          // Check if record exists
          const { data: existing } = await supabase
            .from('internship_details')
            .select('id')
            .eq('enrollment_no', student.enrollment_no)
            .eq('group_id', group_id)
            .maybeSingle();

          if (existing) {
            const { data: updated, error: updateError } = await supabase
              .from('internship_details')
              .update(marksOnlyData)
              .eq('enrollment_no', student.enrollment_no)
              .eq('group_id', group_id)
              .select()
              .maybeSingle();

            if (updateError) throw updateError;
            results.internships_created.push(updated);
          } else {
            const { data: inserted, error: insertError } = await supabase
              .from('internship_details')
              .insert([marksOnlyData])
              .select()
              .maybeSingle();

            if (insertError) throw insertError;
            results.internships_created.push(inserted);
          }
        }

        results.students_processed.push(student.enrollment_no);
      }

      return ApiResponse.success(
        res,
        'Zeroth Review submitted successfully',
        {
          ...results,
          message: `Evaluated ${students.length} students and recorded ${results.internships_created.length} internship entries`
        },
        201
      );
    } catch (error) {
      console.error('Zeroth Review submission error:', error);
      throw ApiError.internalError(`Failed to submit zeroth review: ${error.message}`);
    }
  });

  /**
   * Get Zeroth Review data for a group
   */
  getZerothReviewByGroup = asyncHandler(async (req, res) => {
    const { group_id } = req.params;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required');
    }

    // Fetch internship details for the group
    const { data: internships, error } = await supabase
      .from('internship_details')
      .select('*')
      .eq('group_id', group_id);

    if (error) throw error;

    return ApiResponse.success(
      res,
      'Zeroth Review data retrieved successfully',
      { 
        group_id,
        internships: internships || [],
        count: internships?.length || 0
      }
    );
  });

  /**
   * Get all Zeroth Reviews (Admin/Mentor view)
   */
  getAllZerothReviews = asyncHandler(async (req, res) => {
    const { data: reviews, error } = await supabase
      .from('internship_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by group_id
    const groupedReviews = {};
    reviews?.forEach(review => {
      if (!groupedReviews[review.group_id]) {
        groupedReviews[review.group_id] = {
          group_id: review.group_id,
          guide: review.guide,
          expert_name: review.external, // Using existing 'external' column
          students: []
        };
      }
      groupedReviews[review.group_id].students.push(review);
    });

    return ApiResponse.success(
      res,
      'All Zeroth Reviews retrieved successfully',
      { 
        reviews: Object.values(groupedReviews),
        total: Object.keys(groupedReviews).length
      }
    );
  });

  /**
   * Update Zeroth Review
   */
  updateZerothReview = asyncHandler(async (req, res) => {
    const { enrollment_no, group_id } = req.params;
    const updateData = req.body;

    if (!enrollment_no || !group_id) {
      throw ApiError.badRequest('Enrollment number and group ID are required');
    }

    const { data: updated, error } = await supabase
      .from('internship_details')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('enrollment_no', enrollment_no)
      .eq('group_id', group_id)
      .select()
      .single();

    if (error) throw error;

    return ApiResponse.success(
      res,
      'Zeroth Review updated successfully',
      { review: updated }
    );
  });

  /**
   * Delete Zeroth Review
   */
  deleteZerothReview = asyncHandler(async (req, res) => {
    const { group_id } = req.params;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required');
    }

    // Delete all records for this group
    const { error } = await supabase
      .from('internship_details')
      .delete()
      .eq('group_id', group_id);

    if (error) throw error;

    return ApiResponse.success(
      res,
      'Zeroth Review deleted successfully'
    );
  });

  /**
   * Verify Missing Member from PBL 2025 table before adding
   */
  verifyMissingMember = asyncHandler(async (req, res) => {
    const { enrollment_no, group_id } = req.body;

    if (!enrollment_no || !group_id) {
      throw ApiError.badRequest('Enrollment number and group ID are required');
    }

    // Search for student in pbl_2025 table
    const { data: student, error: studentError } = await supabase
      .from('pbl_2025')
      .select('*')
      .eq('enrollement_no', enrollment_no)
      .eq('group_id', group_id)
      .maybeSingle();

    if (studentError && studentError.code !== 'PGRST116') {
      console.error('Error fetching student:', studentError);
      throw ApiError.internalError('Error searching for student');
    }

    // Check if student exists in the same group
    const inSameGroup = !!student;

    // Check if student already exists in internship_details (enrollment_no is primary key)
    const { data: existing, error: checkError } = await supabase
      .from('internship_details')
      .select('enrollment_no, group_id')
      .eq('enrollment_no', enrollment_no)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing record:', checkError);
      throw ApiError.internalError('Error checking existing record');
    }

    const alreadyAdded = !!existing;

    // Return verification result
    return ApiResponse.success(
      res,
      inSameGroup ? 'Student verified successfully' : 'Student not found in this group',
      { 
        student: student ? {
          enrollment_no: student.enrollement_no,
          enrollement_no: student.enrollement_no,
          student_name: student.name_of_student,
          name_of_student: student.name_of_student,
          group_id: student.group_id,
          guide_name: student.guide_name
        } : null,
        inSameGroup,
        alreadyAdded
      }
    );
  });

  /**
   * Add Missing Member from PBL 2025 table
   */
  addMissingMember = asyncHandler(async (req, res) => {
    const { enrollment_no, group_id } = req.body;

    if (!enrollment_no || !group_id) {
      throw ApiError.badRequest('Enrollment number and group ID are required');
    }

    // Search for student in pbl_2025 table
    const { data: student, error: studentError } = await supabase
      .from('pbl_2025')
      .select('*')
      .eq('enrollement_no', enrollment_no)
      .eq('group_id', group_id)
      .maybeSingle();

    if (studentError) {
      console.error('Error fetching student:', studentError);
      throw ApiError.internalError('Error searching for student');
    }

    if (!student) {
      throw ApiError.notFound('Student not found in the specified group. Please verify the enrollment number and ensure the student belongs to this group.');
    }

    // Check if student already exists in internship_details (enrollment_no is primary key)
    const { data: existing, error: checkError } = await supabase
      .from('internship_details')
      .select('*')
      .eq('enrollment_no', enrollment_no)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing record:', checkError);
      throw ApiError.internalError('Error checking existing record');
    }

    if (existing) {
      if (existing.group_id === group_id) {
        throw ApiError.badRequest('This student is already added to the internship details for this group');
      } else {
        // Student exists in a different group - update their group_id
        console.log(`Student ${enrollment_no} exists in group ${existing.group_id}, updating to group ${group_id}`);
        
        const { data: updated, error: updateError } = await supabase
          .from('internship_details')
          .update({ 
            group_id: group_id,
            guide: student.guide_name || existing.guide
          })
          .eq('enrollment_no', enrollment_no)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating student group:', updateError);
          throw ApiError.internalError('Failed to update student group');
        }

        return ApiResponse.success(
          res,
          'Student moved to this group successfully',
          { 
            student: {
              enrollment_no: student.enrollement_no,
              student_name: student.name_of_student,
              name_of_student: student.name_of_student,
              group_id: group_id // Include the new group_id
            },
            moved: true,
            previousGroup: existing.group_id
          }
        );
      }
    }

    // Add student to internship_details table with default values
    console.log(`Adding student ${student.enrollement_no} to group ${group_id}`);
    
    const { data: newEntry, error: insertError } = await supabase
      .from('internship_details')
      .insert({
        enrollment_no: student.enrollement_no,
        student_name: student.name_of_student,
        group_id: group_id, // Explicitly set to the target group
        guide: student.guide_name || null,
        organization_name: 'Not Specified',
        internship_type: 'Development Internship',
        internship_duration: '3 Month(s)',
        start_date: null,
        end_date: null,
        role: null,
        remark: 'Pending',
        m1: 0,
        m2: 0,
        m3: 0,
        m4: 0,
        m5: 0,
        total: 0,
        external: null,
        scope: null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting member:', insertError);
      throw ApiError.internalError('Failed to add member to internship details');
    }

    console.log(`Successfully added student ${student.enrollement_no} to group ${group_id}`);

    return ApiResponse.success(
      res,
      'Member added successfully',
      { 
        student: {
          enrollment_no: student.enrollement_no,
          student_name: student.name_of_student,
          name_of_student: student.name_of_student,
          group_id: group_id // Include group_id in response
        }
      }
    );
  });
}

export default new ZerothReviewController();
