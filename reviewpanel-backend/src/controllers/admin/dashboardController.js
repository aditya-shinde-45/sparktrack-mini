import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import { supabase } from '../../config/database.js';
import userModel from '../../models/userModel.js';

/**
 * Controller for dashboard operations
 */
class DashboardController {
  /**
   * Get dashboard statistics
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    const { year, class: classFilter } = req.query;
    
    // Build filter conditions
    const filters = {};
    if (year) filters.year = year;
    if (classFilter) filters.class = classFilter;
    
    // Count total students
    const { count: studentCount, error: studentError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .match(filters);
      
    if (studentError) throw new ApiError(500, `Error counting students: ${studentError.message}`);
    
    // Count distinct groups from pbl1 table (previously was pbl)
    const { data: groupData, error: groupError } = await supabase
      .from('pbl1')
      .select('group_id')
      .not('group_id', 'is', null);
      
    if (groupError) throw new ApiError(500, `Error counting groups: ${groupError.message}`);
    
    // Get distinct group count
    const uniqueGroups = new Set();
    groupData.forEach(item => {
      if (item.group_id) {
        uniqueGroups.add(item.group_id);
      }
    });
    const groupCount = uniqueGroups.size;
    
    // Count mentors (internal guides)
    const { data: mentorData, error: mentorError } = await supabase
      .from('pbl1')
      .select('guide_name')
      .not('guide_name', 'is', null);
      
    if (mentorError) throw new ApiError(500, `Error counting mentors: ${mentorError.message}`);
    
    // Get unique mentors count
    const uniqueMentors = new Set();
    mentorData.forEach(item => {
      if (item.guide_name) {
        uniqueMentors.add(item.guide_name);
      }
    });
    const mentorCount = uniqueMentors.size;
    
    // Count externals (external evaluators)
    const { count: externalCount, error: externalError } = await supabase
      .from('externals')
      .select('*', { count: 'exact', head: true });
      
    if (externalError) throw new ApiError(500, `Error counting externals: ${externalError.message}`);
    
    return ApiResponse.success(res, 'Dashboard statistics retrieved successfully', {
      counts: {
        students: studentCount || 0,
        groups: groupCount || 0,
        mentors: mentorCount || 0,
        externals: externalCount || 0
      }
    });
  });

  /**
   * Get recent activity data
   */
  getRecentActivity = asyncHandler(async (req, res) => {
    // Get recent activities from the user model (this can stay as is)
    const recentActivities = await userModel.getRecentActivities();
    
    return ApiResponse.success(res, 'Recent activity data retrieved successfully', {
      recentActivities
    });
  });

  /**
   * Get projects overview for dashboard
   */
  getProjectsOverview = asyncHandler(async (req, res) => {
    const { year, class: classFilter } = req.query;
    
    // Get approvals data from pbl1 table
    const { data: approvalsData, error: approvalsError } = await supabase
      .from('pbl1')
      .select('group_id, crieya, copyright, patent, aic, tech_transfer')
      .not('group_id', 'is', null);
      
    if (approvalsError) throw new ApiError(500, `Error fetching approvals data: ${approvalsError.message}`);
    
    // Process approvals data for charts - specifically handling "Yes"/"No" values
    const criyaApprovalData = [
      { 
        name: 'Approved', 
        value: approvalsData.filter(group => group.crieya === "Yes").length 
      },
      { 
        name: 'Not Approved', 
        value: approvalsData.filter(group => group.crieya === "No").length 
      },
      { 
        name: 'Pending', 
        value: approvalsData.filter(group => !group.crieya || (group.crieya !== "Yes" && group.crieya !== "No")).length 
      }
    ];
    
    const copyrightApprovalData = [
      { 
        name: 'Approved', 
        value: approvalsData.filter(group => group.copyright === "Yes").length 
      },
      { 
        name: 'Not Approved', 
        value: approvalsData.filter(group => group.copyright === "No").length 
      },
      { 
        name: 'Pending', 
        value: approvalsData.filter(group => !group.copyright || (group.copyright !== "Yes" && group.copyright !== "No")).length 
      }
    ];
    
    const patentApprovalData = [
      { 
        name: 'Approved', 
        value: approvalsData.filter(group => group.patent === "Yes").length 
      },
      { 
        name: 'Not Approved', 
        value: approvalsData.filter(group => group.patent === "No").length 
      },
      { 
        name: 'Pending', 
        value: approvalsData.filter(group => !group.patent || (group.patent !== "Yes" && group.patent !== "No")).length 
      }
    ];

    const aicApprovalData = [
      { 
        name: 'Approved', 
        value: approvalsData.filter(group => group.aic === "Yes").length 
      },
      { 
        name: 'Not Approved', 
        value: approvalsData.filter(group => group.aic === "No").length 
      },
      { 
        name: 'Pending', 
        value: approvalsData.filter(group => !group.aic || (group.aic !== "Yes" && group.aic !== "No")).length 
      }
    ];

    const techTransferData = [
      { 
        name: 'Approved', 
        value: approvalsData.filter(group => group.tech_transfer === "Yes").length 
      },
      { 
        name: 'Not Approved', 
        value: approvalsData.filter(group => group.tech_transfer === "No").length 
      },
      { 
        name: 'Pending', 
        value: approvalsData.filter(group => !group.tech_transfer || (group.tech_transfer !== "Yes" && group.tech_transfer !== "No")).length 
      }
    ];
    
    // Get student distribution by class
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('class');
      
    if (studentsError) throw new ApiError(500, `Error fetching student distribution: ${studentsError.message}`);
    
    // Process class distribution
    const classDistribution = [];
    const classCounts = {};
    
    studentsData.forEach(student => {
      const className = student.class || 'Unassigned';
      classCounts[className] = (classCounts[className] || 0) + 1;
    });
    
    for (const className in classCounts) {
      classDistribution.push({
        name: className,
        value: classCounts[className]
      });
    }
    
    return ApiResponse.success(res, 'Projects overview retrieved successfully', {
      approvals: {
        criya: criyaApprovalData,
        copyright: copyrightApprovalData,
        patent: patentApprovalData,
        aic: aicApprovalData,
        techTransfer: techTransferData
      },
      distribution: {
        byClass: classDistribution
      }
    });
  });

  /**
   * Get evaluations summary for dashboard
   */
  getEvaluationsSummary = asyncHandler(async (req, res) => {
    // Get group attendance data from pbl1 table
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('pbl1')
      .select('group_id, total')
      .not('group_id', 'is', null);
      
    if (attendanceError) throw new ApiError(500, `Error fetching attendance data from pbl1: ${attendanceError.message}`);
    
    // Process attendance data for chart - "AB" indicates absent
    const attendanceChartData = [
      { 
        name: 'Present', 
        value: attendanceData.filter(group => group.total && group.total !== 'AB').length 
      },
      { 
        name: 'Absent', 
        value: attendanceData.filter(group => group.total === 'AB').length 
      },
      { 
        name: 'Not Marked', 
        value: attendanceData.filter(group => !group.total).length 
      }
    ];
    
    // Get groups with/without guides from pbl1 table (previously was pbl)
    const { data: guideData, error: guideError } = await supabase
      .from('pbl1')
      .select('guide_name')
      .not('group_id', 'is', null);
      
    if (guideError) throw new ApiError(500, `Error fetching guide data: ${guideError.message}`);
    
    const guideAssignmentData = [
      { 
        name: 'With Guide', 
        value: guideData.filter(group => group.guide_name).length 
      },
      { 
        name: 'Without Guide', 
        value: guideData.filter(group => !group.guide_name).length 
      }
    ];
    
    return ApiResponse.success(res, 'Evaluations summary retrieved successfully', {
      attendance: attendanceChartData,
      guideAssignment: guideAssignmentData
    });
  });
  
  /**
   * Get dashboard data (comprehensive endpoint combining multiple data sources)
   */
  getDashboardData = asyncHandler(async (req, res) => {
    const { year, class: classFilter, review } = req.query;
    const reviewType = review || 'review1'; // Default to review1
    const tableName = reviewType === 'review2' ? 'pbl2' : 'pbl1';
    
    // Build filter conditions
    const filters = {};
    if (year) filters.year = year;
    if (classFilter) filters.class = classFilter;
    
    // ------------ BASIC COUNTS ------------
    
    // Count total students
    const { count: studentCount, error: studentError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .match(filters);
      
    if (studentError) throw new ApiError(500, `Error counting students: ${studentError.message}`);
    
    // Count distinct groups from selected table
    const { data: groupData, error: groupError } = await supabase
      .from(tableName)
      .select('group_id')
      .not('group_id', 'is', null);
      
    if (groupError) throw new ApiError(500, `Error counting groups: ${groupError.message}`);
    
    // Get distinct group count
    const uniqueGroups = new Set();
    groupData.forEach(item => {
      if (item.group_id) {
        uniqueGroups.add(item.group_id);
      }
    });
    const groupCount = uniqueGroups.size;
    
    // Count mentors (internal guides)
    const { data: mentorData, error: mentorError } = await supabase
      .from(tableName)
      .select('guide_name')
      .not('guide_name', 'is', null);
      
    if (mentorError) throw new ApiError(500, `Error counting mentors: ${mentorError.message}`);
    
    // Get unique mentors count
    const uniqueMentors = new Set();
    mentorData.forEach(item => {
      if (item.guide_name) {
        uniqueMentors.add(item.guide_name);
      }
    });
    const mentorCount = uniqueMentors.size;
    
    // Count externals (external evaluators)
    const { count: externalCount, error: externalError } = await supabase
      .from('externals')
      .select('*', { count: 'exact', head: true });
      
    if (externalError) throw new ApiError(500, `Error counting externals: ${externalError.message}`);
    
    // ------------ ATTENDANCE DATA ------------
    
    // Get group attendance data from selected table
    const { data: attendanceData, error: attendanceError } = await supabase
      .from(tableName)
      .select('group_id, total')
      .not('group_id', 'is', null);
      
    if (attendanceError) throw new ApiError(500, `Error fetching attendance data from ${tableName}: ${attendanceError.message}`);
    
    // Process attendance data for chart - "AB" indicates absent
    const attendanceChartData = [
      { 
        name: 'Present', 
        value: attendanceData.filter(group => group.total && group.total !== 'AB').length 
      },
      { 
        name: 'Absent', 
        value: attendanceData.filter(group => group.total === 'AB').length 
      },
      { 
        name: 'Not Marked', 
        value: attendanceData.filter(group => !group.total).length 
      }
    ];
    
    // ------------ APPROVAL DATA (Only for Review 1) ------------
    
    let criyaApprovalData = [];
    let copyrightApprovalData = [];
    let patentApprovalData = [];
    let aicApprovalData = [];
    let techTransferData = [];
    
    // Approval columns only exist in pbl1 table (Review 1)
    if (reviewType === 'review1') {
      // Get approvals data from pbl1 table
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('pbl1')
        .select('group_id, crieya, copyright, patent, aic, tech_transfer')
        .not('group_id', 'is', null);
        
      if (approvalsError) throw new ApiError(500, `Error fetching approvals data from pbl1: ${approvalsError.message}`);
      
      // Process approvals data for charts - specifically handling "Yes"/"No" values
      criyaApprovalData = [
        { 
          name: 'Approved', 
          value: approvalsData.filter(group => group.crieya === "Yes").length 
        },
        { 
          name: 'Not Approved', 
          value: approvalsData.filter(group => group.crieya === "No").length 
        },
        { 
          name: 'Pending', 
          value: approvalsData.filter(group => !group.crieya || (group.crieya !== "Yes" && group.crieya !== "No")).length 
        }
      ];
      
      copyrightApprovalData = [
        { 
          name: 'Approved', 
          value: approvalsData.filter(group => group.copyright === "Yes").length 
        },
        { 
          name: 'Not Approved', 
          value: approvalsData.filter(group => group.copyright === "No").length 
        },
        { 
          name: 'Pending', 
          value: approvalsData.filter(group => !group.copyright || (group.copyright !== "Yes" && group.copyright !== "No")).length 
        }
      ];
      
      patentApprovalData = [
        { 
          name: 'Approved', 
          value: approvalsData.filter(group => group.patent === "Yes").length 
        },
        { 
          name: 'Not Approved', 
          value: approvalsData.filter(group => group.patent === "No").length 
        },
        { 
          name: 'Pending', 
          value: approvalsData.filter(group => !group.patent || (group.patent !== "Yes" && group.patent !== "No")).length 
        }
      ];

      aicApprovalData = [
        { 
          name: 'Approved', 
          value: approvalsData.filter(group => group.aic === "Yes").length 
        },
        { 
          name: 'Not Approved', 
          value: approvalsData.filter(group => group.aic === "No").length 
        },
        { 
          name: 'Pending', 
          value: approvalsData.filter(group => !group.aic || (group.aic !== "Yes" && group.aic !== "No")).length 
        }
      ];

      techTransferData = [
        { 
          name: 'Approved', 
          value: approvalsData.filter(group => group.tech_transfer === "Yes").length 
        },
        { 
          name: 'Not Approved', 
          value: approvalsData.filter(group => group.tech_transfer === "No").length 
        },
        { 
          name: 'Pending', 
          value: approvalsData.filter(group => !group.tech_transfer || (group.tech_transfer !== "Yes" && group.tech_transfer !== "No")).length 
        }
      ];
    }
    
    // ------------ STUDENT DISTRIBUTION ------------
    
    // Get student distribution by class
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('class')
      .match(filters);
      
    if (studentsError) throw new ApiError(500, `Error fetching student distribution: ${studentsError.message}`);
    
    // Process class distribution
    const classDistribution = [];
    const classCounts = {};
    
    studentsData.forEach(student => {
      const className = student.class || 'Unassigned';
      classCounts[className] = (classCounts[className] || 0) + 1;
    });
    
    for (const className in classCounts) {
      classDistribution.push({
        name: className,
        value: classCounts[className]
      });
    }
    
    // ------------ GROUP ASSIGNMENT STATUS ------------
    
    // Use selected table to get groups with/without students
    const { data: allGroupsData, error: allGroupsError } = await supabase
      .from(tableName)
      .select('group_id')
      .not('group_id', 'is', null);

    if (allGroupsError) throw new ApiError(500, `Error fetching group assignment data from ${tableName}: ${allGroupsError.message}`);

    // For now, let's assume each group in pbl1 is "assigned"
    const assignedGroupCount = allGroupsData.length;
    const unassignedGroupCount = 0;

    const groupAssignmentData = [
      { 
        name: 'Assigned to Group', 
        value: assignedGroupCount
      },
      { 
        name: 'Not Assigned', 
        value: unassignedGroupCount
      }
    ];
    
    // ------------ GUIDE ASSIGNMENT STATUS ------------
    
    // Get groups with/without guides from selected table
    const { data: guideData, error: guideError } = await supabase
      .from(tableName)
      .select('guide_name')
      .not('group_id', 'is', null);
      
    if (guideError) throw new ApiError(500, `Error fetching guide assignment data from ${tableName}: ${guideError.message}`);
    
    const guideAssignmentData = [
      { 
        name: 'With Guide', 
        value: guideData.filter(group => group.guide_name).length 
      },
      { 
        name: 'Without Guide', 
        value: guideData.filter(group => !group.guide_name).length 
      }
    ];
    
    // Return consolidated dashboard data
    return ApiResponse.success(res, 'Dashboard data retrieved successfully', {
      counts: {
        students: studentCount || 0,
        groups: groupCount || 0,
        mentors: mentorCount || 0,
        externals: externalCount || 0
      },
      charts: {
        attendance: attendanceChartData,
        approvals: {
          criya: criyaApprovalData,
          copyright: copyrightApprovalData,
          patent: patentApprovalData,
          aic: aicApprovalData,
          techTransfer: techTransferData
        },
        distribution: {
          byClass: classDistribution
        },
        groupAssignment: groupAssignmentData,
        guideAssignment: guideAssignmentData
      }
    });
  });
  
  /**
   * Get stats for the admin dashboard cards
   */
  getStatCards = asyncHandler(async (req, res) => {
    const { year, class: classFilter } = req.query;
    
    // Build filter conditions
    const filters = {};
    if (year) filters.year = year;
    if (classFilter) filters.class = classFilter;
    
    // Count students
    const { count: studentCount, error: studentError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .match(filters);
      
    if (studentError) throw new ApiError(500, `Error counting students: ${studentError.message}`);
    
    // Count distinct groups from pbl1 table
    const { data: groupData, error: groupError } = await supabase
      .from('pbl1')
      .select('group_id')
      .not('group_id', 'is', null);
      
    if (groupError) throw new ApiError(500, `Error counting groups: ${groupError.message}`);
    
    // Get distinct group count
    const uniqueGroups = new Set();
    groupData.forEach(item => {
      if (item.group_id) {
        uniqueGroups.add(item.group_id);
      }
    });
    const groupCount = uniqueGroups.size;
    
    // Count unique guides from pbl1 table (previously was pbl)
    const { data: guideData, error: guideError } = await supabase
      .from('pbl1')
      .select('guide_name')
      .not('guide_name', 'is', null);
      
    if (guideError) throw new ApiError(500, `Error counting guides: ${guideError.message}`);
    
    // Get unique guide count
    const uniqueGuides = new Set();
    guideData.forEach(group => {
      if (group.guide_name) uniqueGuides.add(group.guide_name);
    });
    
    // Count externals
    const { count: examinerCount, error: examinerError } = await supabase
      .from('externals')
      .select('*', { count: 'exact', head: true });
      
    if (examinerError) throw new ApiError(500, `Error counting examiners: ${examinerError.message}`);
    
    return ApiResponse.success(res, 'Stat cards data retrieved successfully', {
      data: {
        studentCount: studentCount || 0,
        groupCount: groupCount || 0,
        guideCount: uniqueGuides.size || 0,
        examinerCount: examinerCount || 0
      }
    });
  });
}

export default new DashboardController();