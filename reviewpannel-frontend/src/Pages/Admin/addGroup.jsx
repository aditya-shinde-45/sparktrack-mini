import React, { useState } from "react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import { apiRequest } from "../../api.js";
import {
  Users,
  IdCard,
  User,
  GraduationCap,
  Mail,
  Phone,
} from "lucide-react";

const InputField = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon
      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600"
      size={18}
    />
    <input
      {...props}
      className="pl-10 p-3 border border-purple-300 rounded-lg 
                 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full
                 bg-purple-50 text-gray-900 font-medium
                 placeholder-gray-500"
    />
  </div>
);

const emptyStudent = () => ({
  enrollement_no: "",
  name_of_student: "",
  class: "",
  email_id: "",
  contact: "",
});

const AddGroup = () => {
  const [groupDetails, setGroupDetails] = useState({
    group_id: "",
    guide_name: "",
    guide_contact: "",
  });

  const [studentCount, setStudentCount] = useState(4);
  const [students, setStudents] = useState(
    Array.from({ length: 4 }, () => emptyStudent())
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Handle group details change
  const handleGroupChange = (e) => {
    setGroupDetails({ ...groupDetails, [e.target.name]: e.target.value });
  };

  // Handle student field change
  const handleStudentChange = (index, e) => {
    const { name, value } = e.target;
    setStudents((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return updated;
    });
  };

  // Handle student count change
  const handleStudentCountChange = (e) => {
    const count = parseInt(e.target.value);
    setStudentCount(count);
    setStudents((prev) => {
      let updated = [...prev];
      if (updated.length < count) {
        updated = [...updated, ...Array.from({ length: count - updated.length }, () => emptyStudent())];
      }
      return updated.slice(0, count);
    });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      ...groupDetails,
      students: students.slice(0, studentCount),
    };

    try {
      const token = localStorage.getItem("token");
      await apiRequest("/api/pbl/groups", "POST", payload, token);
      setMessage("✅ Group added successfully!");
      setGroupDetails({
        group_id: "",
        guide_name: "",
        guide_contact: "",
      });
      setStudentCount(4);
      setStudents(Array.from({ length: 4 }, () => emptyStudent()));
    } catch (err) {
      setMessage(`❌ Error: ${err.message || "Failed to add group."}`);
    }

    setLoading(false);
  };

  return (
    <div className="font-sans bg-gray-50">
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
          <Sidebar />
          <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 mb-16 lg:mb-0 space-y-6 mt-16">
            <h1 className="text-2xl font-bold text-purple-700">
              Add New Group
            </h1>

            {message && (
              <div
                className={`p-3 rounded-lg ${
                  message.startsWith("✅")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-lg rounded-lg p-6 space-y-6 border border-gray-100"
            >
              {/* Group Details */}
              <div>
                <h2 className="text-lg font-semibold text-purple-600 mb-4">
                  Group Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    icon={Users}
                    type="text"
                    name="group_id"
                    placeholder="Group ID"
                    value={groupDetails.group_id}
                    onChange={handleGroupChange}
                    required
                  />
                  <InputField
                    icon={User}
                    type="text"
                    name="guide_name"
                    placeholder="Guide Name"
                    value={groupDetails.guide_name}
                    onChange={handleGroupChange}
                    required
                  />
                  <InputField
                    icon={Phone}
                    type="text"
                    name="guide_contact"
                    placeholder="Guide Contact"
                    value={groupDetails.guide_contact}
                    onChange={handleGroupChange}
                    required
                  />
                </div>
              </div>

              {/* Student Count Selector */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Number of Students
                </label>
                <select
                  value={studentCount}
                  onChange={handleStudentCountChange}
                  className="p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50 text-gray-900 font-medium"
                >
                  {[2, 3, 4].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </div>

              {/* Students Section */}
              <div>
                <h2 className="text-lg font-semibold text-purple-600 mb-4">
                  Students
                </h2>
                {students.slice(0, studentCount).map((student, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center mb-4"
                  >
                    <InputField
                      icon={IdCard}
                      type="text"
                      name="enrollement_no"
                      placeholder="Enrollment No"
                      value={student.enrollement_no}
                      onChange={(e) => handleStudentChange(index, e)}
                      required
                    />
                    <InputField
                      icon={User}
                      type="text"
                      name="name_of_student"
                      placeholder="Student Name"
                      value={student.name_of_student}
                      onChange={(e) => handleStudentChange(index, e)}
                      required
                    />
                    <InputField
                      icon={GraduationCap}
                      type="text"
                      name="class"
                      placeholder="Class"
                      value={student.class}
                      onChange={(e) => handleStudentChange(index, e)}
                      required
                    />
                    <InputField
                      icon={Mail}
                      type="email"
                      name="email_id"
                      placeholder="Email"
                      value={student.email_id}
                      onChange={(e) => handleStudentChange(index, e)}
                      required
                    />
                    <InputField
                      icon={Phone}
                      type="text"
                      name="contact"
                      placeholder="Contact"
                      value={student.contact}
                      onChange={(e) => handleStudentChange(index, e)}
                      required
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-6 py-3 rounded-lg shadow hover:from-purple-600 hover:to-purple-800 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Group"}
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AddGroup;
