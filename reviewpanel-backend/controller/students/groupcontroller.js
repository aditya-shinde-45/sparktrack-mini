import supabase from "../../Model/supabase";


// 2. Member Responds to Request
const respondToRequest = async (req, res) => {
  const { requestId, response } = req.body;

  if (!requestId || !['accepted', 'rejected'].includes(response)) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  try {
    const request = await prisma.group_requests.findUnique({ where: { request_id: requestId } });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (response === 'accepted') {
      const group = await prisma.pbl.findUnique({ where: { group_id: request.group_id } });

      if (!group) {
        return res.status(404).json({ message: 'Group not found in PBL table' });
      }

      let updateData = {};
      if (!group.member1_enrollment) updateData.member1_enrollment = request.member_enrollment;
      else if (!group.member2_enrollment) updateData.member2_enrollment = request.member_enrollment;
      else if (!group.member3_enrollment) updateData.member3_enrollment = request.member_enrollment;
      else return res.status(400).json({ message: 'Group is already full' });

      await prisma.pbl.update({ where: { group_id: request.group_id }, data: updateData });
    }

    await prisma.group_requests.delete({ where: { request_id: requestId } });

    return res.status(200).json({ message: `Request ${response}` });
  } catch (err) {
    console.error('Respond to request error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 3. Fetch All Pending Requests for a Member
const getPendingRequests = async (req, res) => {
  const { enrollmentNo } = req.params;

  try {
    const result = await prisma.group_requests.findMany({
      where: { member_enrollment: enrollmentNo, status: 'pending' }
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Get pending requests error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 4. Get All Groups
const getAllGroups = async (req, res) => {
  try {
    const result = await prisma.pbl.findMany({
      orderBy: { group_id: 'asc' }
    });
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching groups:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 8. Patch Problem Statement by Admin
const patchProblemStatement = async (req, res) => {
  const { problemStatementId, updates } = req.body;

  if (!problemStatementId || !updates || typeof updates !== 'object') {
    return res.status(400).json({ message: 'problemStatementId and updates object are required.' });
  }

  try {
    await prisma.studentproblemstatement.update({
      where: { problem_id: problemStatementId },
      data: updates
    });
    res.status(200).json({ message: 'Problem statement updated successfully' });
  } catch (err) {
    console.error('PATCH problem statement error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateGroup = async (req, res) => {
  const { group_id } = req.params;
  const {
    teamName,
    leaderEnrollment,
    member1Enrollment,
    member2Enrollment,
    member3Enrollment
  } = req.body;

  const proposedMembers = [member1Enrollment, member2Enrollment, member3Enrollment].filter(Boolean);
  const allEnrollments = [leaderEnrollment, ...proposedMembers];

  if (proposedMembers.length < 1) {
    return res.status(400).json({ message: 'At least two members (leader + one) required.' });
  }

  try {
    // ✅ Step 1: Check if any proposed member is already in another group
    const existingGroups = await prisma.pbl.findMany({
      where: {
        group_id: { not: group_id },
        OR: [
          { leader_enrollment: { in: allEnrollments } },
          { member1_enrollment: { in: allEnrollments } },
          { member2_enrollment: { in: allEnrollments } },
          { member3_enrollment: { in: allEnrollments } },
        ]
      }
    });

    const blocked = new Set();
    existingGroups.forEach(row => {
      [row.leader_enrollment, row.member1_enrollment, row.member2_enrollment, row.member3_enrollment]
        .filter(e => allEnrollments.includes(e))
        .forEach(e => blocked.add(e));
    });

    if (blocked.size > 0) {
      return res.status(400).json({
        message: `These students are already in another group: ${Array.from(blocked).join(', ')}`
      });
    }

    // ✅ Step 2: Get current group and validate class
    const existingGroup = await prisma.pbl.findUnique({ where: { group_id } });
    if (!existingGroup) return res.status(404).json({ message: 'Group not found.' });

    const className = existingGroup.class_name?.trim();
    const isSY = className?.toUpperCase()?.startsWith('SY');

    if (isSY) {
      const students = await prisma.students.findMany({
        where: { enrollment_no: { in: allEnrollments } },
        select: { enrollment_no: true, class: true }
      });

      const invalid = students.filter(s => s.class.trim() !== className);
      if (invalid.length > 0) {
        return res.status(400).json({
          message: `SY teams must be from the same class (${className}). Invalid: ${invalid.map(i => i.enrollment_no).join(', ')}`
        });
      }
    }

    // ✅ Step 3: Find new members not already in the PBL group
    const existingMembers = [
      existingGroup.member1_enrollment,
      existingGroup.member2_enrollment,
      existingGroup.member3_enrollment
    ].filter(Boolean);

    const newMembers = proposedMembers.filter(e => !existingMembers.includes(e));

    // ✅ Step 4: Send group_requests to new members
    const sendRequests = newMembers.map(async (member) => {
      const existingRequest = await prisma.group_requests.findFirst({
        where: {
          group_id,
          member_enrollment: member
        }
      });

      if (!existingRequest) {
        return prisma.group_requests.create({
          data: {
            group_id,
            team_name: teamName,
            class_name: className,
            leader_enrollment: leaderEnrollment,
            member_enrollment: member,
            status: 'pending'
          }
        });
      }
    });

    await Promise.all(sendRequests);

    // ✅ Step 5: Update only teamName and leaderEnrollment in PBL
    const updated = await prisma.pbl.update({
      where: { group_id },
      data: {
        team_name: teamName,
        leader_enrollment: leaderEnrollment,
        // ❌ Do not touch memberX_enrollment here
      }
    });

    return res.status(200).json({
      message: `Group ${group_id} updated successfully. New members have received requests.`,
      group: updated
    });

  } catch (err) {
    console.error('❌ Error updating group:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  respondToRequest,
  getPendingRequests,
  getAllGroups,
  patchProblemStatement,
  updateGroup 
};