import React, { useEffect, useState } from 'react';
import Sidebar from '../../Components/Student/sidebar';
import Header from '../../Components/Student/Header';
import axios from 'axios';
import { Users, UserPlus, Mail, Phone, Building, Award, AlertCircle, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

const CreateGroup = () => {
  const [memberCount, setMemberCount] = useState(1);
  const [leaderData, setLeaderData] = useState({});
  const [memberData, setMemberData] = useState({});
  const [memberEnrollments, setMemberEnrollments] = useState({});
  const [teamName, setTeamName] = useState('');
  const [message, setMessage] = useState('');
  const [continuePrevious, setContinuePrevious] = useState(false);
  const [groupId, setGroupId] = useState('');
  const [guideId, setGuideId] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [guideName, setGuideName] = useState('');
  const [guideContact, setGuideContact] = useState('');
  const [guideEmail, setGuideEmail] = useState('');
  const [deadlinePassed, setDeadlinePassed] = useState(false);

  const [problemTitle, setProblemTitle] = useState('');
  const [problemType, setProblemType] = useState('');
  const [technologyBucket, setTechnologyBucket] = useState('');
  const [domain, setDomain] = useState('');


  useEffect(() => {
    const storedStudent = JSON.parse(localStorage.getItem('student') || '{}');
    if (storedStudent?.enrollment_no) {
      fetchLeaderData(storedStudent.enrollment_no);
    }
  }, []);

  const fetchLeaderData = async (enrollmentNo) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/groups/${enrollmentNo}`);
      const studentData = res.data.student;
      setLeaderData({
        enrollment_no: studentData.enrollment_no,
        name_of_students: studentData.student_name,
        class: studentData.class,
        contact: studentData.contact
      });
    } catch (err) {
      console.error('Error fetching leader data:', err);
      // Check if error is due to deadline
      if (err?.response?.status === 403) {
        setDeadlinePassed(true);
        setMessage('⚠️ Group creation deadline has passed. This feature is currently disabled.');
      }
      // Fallback to localStorage if API fails
      const storedStudent = JSON.parse(localStorage.getItem('student') || '{}');
      setLeaderData(storedStudent);
    }
  };

  const handleMemberChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setMemberCount('');
      return;
    }
    const intValue = parseInt(value);
    if (!isNaN(intValue) && intValue >= 1 && intValue <= 3) {
      setMemberCount(intValue);
    }
  };

  const fetchMemberData = async (enrollmentNo, index) => {
    setMemberEnrollments(prev => ({ ...prev, [index]: enrollmentNo }));
    try {
      const res = await axios.get(`http://localhost:5000/api/groups/${enrollmentNo}`);
      const studentData = res.data.student;
      const updatedData = { 
        ...memberData, 
        [index]: {
          enrollment_no: studentData.enrollment_no,
          name_of_students: studentData.student_name,
          class: studentData.class,
          contact: studentData.contact
        }
      };
      setMemberData(updatedData);
    } catch (err) {
      console.error(`Error fetching member ${index}:`, err);
      const updatedData = { ...memberData, [index]: null };
      setMemberData(updatedData);
    }
  };

  const fetchPreviousMembers = async (enrollmentNo) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/groups/previous/${enrollmentNo}`);
      const group = res.data.previousGroup;
      const allMembers = res.data.members || [];

      setGroupId(group.group_id || '');
      setGuideId(group.guide_id || '');
      setGuideName(group.guide_name || 'N/A');
      setProblemStatement(group.problem_statement || '');

      // Filter out the current leader from the members list
      const otherMembers = allMembers.filter(m => m.enrollement_no !== enrollmentNo);

      const initialMemberData = {};
      const initialEnrollments = {};
      let count = 0;

      for (let i = 0; i < otherMembers.length && count < 3; i++) {
        const member = otherMembers[i];
        try {
          const res = await axios.get(`http://localhost:5000/api/groups/${member.enrollement_no}`);
          const studentData = res.data.student;
          initialMemberData[count + 1] = {
            enrollment_no: studentData.enrollment_no,
            name_of_students: studentData.student_name,
            class: studentData.class,
            contact: studentData.contact
          };
          initialEnrollments[count + 1] = member.enrollement_no;
          count++;
        } catch (err) {
          console.error(`Failed to fetch previous member ${member.enrollement_no}`, err);
        }
      }

      setMemberCount(count);
      setMemberEnrollments(initialEnrollments);
      setMemberData(initialMemberData);
    } catch (err) {
      console.error('Failed to fetch previous group:', err);
      setMessage('❌ Failed to fetch previous group details');
    }
  };

  const handleSubmit = async () => {
    const applicantEnrollment = leaderData?.enrollment_no;

    if (!teamName || !applicantEnrollment) {
      return setMessage('❌ Team name and applicant enrollment number are required.');
    }

    const members = [];
    for (let i = 1; i <= memberCount; i++) {
      const enrollment = memberEnrollments[i];
      if (!enrollment || !memberData[i]) {
        return setMessage(`❌ Member ${i} enrollment not valid or missing.`);
      }
      members.push(enrollment);
    }

    try {
      // Step 1: Create draft group
      const draftBody = {
        leader_enrollment: applicantEnrollment,
        team_name: teamName,
        previous_ps_id: continuePrevious ? groupId : null,
        guide_name: null,
        guide_contact: null,
        guide_email: null,
        problem_title: continuePrevious ? problemTitle : null,
        problem_type: continuePrevious ? problemType : null,
        technology_bucket: continuePrevious ? technologyBucket : null,
        domain: continuePrevious ? domain : null
      };

      const draftRes = await axios.post('http://localhost:5000/api/groups-draft/draft', draftBody);
      const createdGroupId = draftRes.data.data.group_id;

      // Step 2: Send invitations to members
      const inviteBody = {
        group_id: createdGroupId,
        enrollments: members
      };

      await axios.post('http://localhost:5000/api/groups-draft/invite', inviteBody);
      
      setMessage(`✅ Group draft created! Invitations sent to ${members.length} member(s). Check Group Details for status.`);
      
      // Clear form after successful submission
      setTimeout(() => {
        window.location.href = '/studentdashboard';
      }, 2000);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 403) {
        setDeadlinePassed(true);
        setMessage('⚠️ Group creation deadline has passed. This feature is currently disabled.');
      } else {
        setMessage(`❌ ${err.response?.data?.message || err.response?.data?.error || 'Submission failed'}`);
      }
    }
  };

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header
        name={leaderData?.name_of_students || "Student"}
        id={leaderData?.enrollment_no || "----"}
      />
      
      <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
        <Sidebar />
        
        <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 space-y-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Group Formation</h1>
            </div>
            <p className="text-gray-600">Create and manage your project team</p>
          </div>

          {/* Deadline Warning Banner */}
          {deadlinePassed && (
            <div className="p-5 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-amber-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-900 mb-1">
                    Group Creation Deadline Expired
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    The deadline for creating new groups has passed. This feature has been disabled by the administrator. 
                    All form submissions will be blocked until the deadline is reopened.
                  </p>
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-xs text-amber-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      For assistance, please contact your course coordinator or administrator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${
              message.includes('✅') 
                ? 'bg-green-50 border-green-200' 
                : message.includes('⚠️')
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {message.includes('✅') ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : message.includes('⚠️') ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm font-medium ${
                message.includes('✅') ? 'text-green-800' : message.includes('⚠️') ? 'text-amber-800' : 'text-red-800'
              }`}>
                {message}
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Team Leader Section */}
            <section className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-800">Team Leader</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <ReadOnlyInput label="Enrollment No" value={leaderData.enrollment_no} icon={<UserPlus className="w-4 h-4" />} />
                <ReadOnlyInput label="Name" value={leaderData.name_of_students} icon={<Users className="w-4 h-4" />} />
                <ReadOnlyInput label="Class" value={leaderData.class} icon={<Building className="w-4 h-4" />} />
                <ReadOnlyInput label="Contact" value={leaderData.contact} icon={<Phone className="w-4 h-4" />} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No of Group Members
                  </label>
                  <input
                    type="number"
                    value={memberCount}
                    min={1}
                    max={3}
                    onChange={handleMemberChange}
                    disabled={continuePrevious}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Continue Previous Project?
                  </label>
                  <div className="flex gap-6 items-center h-[42px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="continuePrevious"
                        value="yes"
                        checked={continuePrevious}
                        onChange={() => {
                          setContinuePrevious(true);
                          fetchPreviousMembers(leaderData.enrollment_no);
                        }}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="continuePrevious"
                        value="no"
                        checked={!continuePrevious}
                        onChange={() => {
                          setContinuePrevious(false);
                          setMemberEnrollments({});
                          setMemberData({});
                          setGroupId('');
                          setGuideId('');
                          setProblemStatement('');
                          setGuideName('');
                        }}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>
              </div>

              {continuePrevious && (
                <div className="mt-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
                  <h3 className="text-base font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Previous Project Details
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Group ID:</strong> {groupId || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Guide Name:</strong> {guideName || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Members Section */}
            <section className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-800">Team Members</h2>
              </div>
              
              <div className="space-y-4">
                {[...Array(memberCount)].map((_, index) => (
                  <MemberForm
                    key={index}
                    id={index + 1}
                    member={memberData[index + 1]}
                    initialValue={memberEnrollments[index + 1] || ''}
                    onBlur={(enrollment) => fetchMemberData(enrollment, index + 1)}
                    onChange={(id, value) => {
                      setMemberEnrollments(prev => ({ ...prev, [id]: value }));
                      setMemberData(prev => ({ ...prev, [id]: null }));
                    }}
                    disabled={continuePrevious}
                  />
                ))}
              </div>
            </section>

            {/* Submit Button */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={deadlinePassed}
                className={`px-8 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md ${
                  deadlinePassed 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg'
                }`}
              >
                {deadlinePassed ? (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    Deadline Passed
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Group
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const ReadOnlyInput = ({ label, value = '', icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        type="text"
        value={value || ''}
        readOnly
        className={`w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 font-medium ${icon ? 'pl-10' : ''}`}
      />
    </div>
  </div>
);

const MemberForm = ({ id, member, initialValue, onBlur, onChange, disabled }) => {
  const [enrollment, setEnrollment] = useState(initialValue);

  useEffect(() => {
    setEnrollment(initialValue);
  }, [initialValue]);

  const handleChange = (e) => {
    const val = e.target.value;
    setEnrollment(val);
    onChange(id, val);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-800">Member {id}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor={`member${id}Enrollment`} className="block text-sm font-medium text-gray-700 mb-2">
            Enrollment No
          </label>
          <input
            type="text"
            id={`member${id}Enrollment`}
            value={enrollment}
            onChange={handleChange}
            onBlur={() => onBlur(enrollment)}
            placeholder="Enter Enrollment No"
            disabled={disabled}
            className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={member?.name_of_students || ''}
              readOnly
              placeholder="Auto-filled"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-gray-900 font-medium placeholder:text-gray-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={member?.class || ''}
              readOnly
              placeholder="Auto-filled"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-gray-900 font-medium placeholder:text-gray-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={member?.contact || ''}
              readOnly
              placeholder="Auto-filled"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-gray-900 font-medium placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;
