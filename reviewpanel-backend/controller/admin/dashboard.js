import supabase from '../../Model/supabase.js';

export const getDashboardData = async (req, res) => {
  try {
    const { year, class: classFilter } = req.query;
    
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
      
    if (studentError) throw studentError;
    
    // Count distinct groups from pbl table
    const { data: groupData, error: groupError } = await supabase
      .from('pbl')
      .select('group_id')
      .not('group_id', 'is', null);
      
    if (groupError) throw groupError;
    
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
      .from('pbl')
      .select('guide_name')
      .not('guide_name', 'is', null);
      
    if (mentorError) throw mentorError;
    
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
      
    if (externalError) throw externalError;
    
    // ------------ ATTENDANCE DATA ------------
    
    // Get group attendance data from pbl table
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('pbl')
      .select('group_id, total')
      .not('group_id', 'is', null);
      
    if (attendanceError) throw attendanceError;
    
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
    
    // ------------ APPROVAL DATA ------------
    
    // Get approvals data from pbl table
    const { data: approvalsData, error: approvalsError } = await supabase
      .from('pbl')
      .select('group_id, crieya, copyright, patent, aic, tech_transfer')
      .not('group_id', 'is', null);
      
    if (approvalsError) throw approvalsError;
    
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

    // Additional approvals from PBL table
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
    
    // ------------ STUDENT DISTRIBUTION ------------
    
    // Get student distribution by class
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('class')
      .match(filters);
      
    if (studentsError) throw studentsError;
    
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
    
    // Use pbl table to get groups with/without students
    // Count total groups
    const { data: allGroupsData, error: allGroupsError } = await supabase
      .from('pbl')
      .select('group_id')
      .not('group_id', 'is', null);

    if (allGroupsError) throw allGroupsError;

    // Count groups with at least one student assigned
    // Assuming pbl table has a students or members field (array or count)
    // If not, you may need to join or aggregate differently
    // For now, let's assume each group in pbl is "assigned"
    const assignedGroupCount = allGroupsData.length;

    // To get unassigned groups, you need a way to identify them in pbl
    // If all groups in pbl are assigned, then unassigned = 0
    // If you have a status field, use it. Otherwise, set unassigned to 0
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
    
    // Get groups with/without guides from pbl table
    const { data: guideData, error: guideError } = await supabase
      .from('pbl')
      .select('guide_name')
      .not('group_id', 'is', null);
      
    if (guideError) throw guideError;
    
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
    res.json({
      success: true,
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
    
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: error.message
    });
  }
};

// Get stats for the admin dashboard cards
export const getStatCards = async (req, res) => {
  try {
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
      
    if (studentError) throw studentError;
    
    // Count distinct groups from pbl table
    const { data: groupData, error: groupError } = await supabase
      .from('pbl')
      .select('group_id')
      .not('group_id', 'is', null);
      
    if (groupError) throw groupError;
    
    // Get distinct group count
    const uniqueGroups = new Set();
    groupData.forEach(item => {
      if (item.group_id) {
        uniqueGroups.add(item.group_id);
      }
    });
    const groupCount = uniqueGroups.size;
    
    // Count unique guides from pbl table
    const { data: guideData, error: guideError } = await supabase
      .from('pbl')
      .select('guide_name')
      .not('guide_name', 'is', null);
      
    if (guideError) throw guideError;
    
    // Get unique guide count
    const uniqueGuides = new Set();
    guideData.forEach(group => {
      if (group.guide_name) uniqueGuides.add(group.guide_name);
    });
    
    // Count externals
    const { count: examinerCount, error: examinerError } = await supabase
      .from('externals')
      .select('*', { count: 'exact', head: true });
      
    if (examinerError) throw examinerError;
    
    res.json({
      success: true,
      data: {
        studentCount: studentCount || 0,
        groupCount: groupCount || 0,
        guideCount: uniqueGuides.size || 0,
        examinerCount: examinerCount || 0
      }
    });
    
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching stats",
      error: error.message
    });
  }
};