import React, { useState } from "react";
import { apiRequest } from "../../api.js";
import { Users, IdCard, User, GraduationCap, Mail, Phone, X } from "lucide-react";

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

const AddGroupModal = ({ isOpen, onClose, onSuccess }) => {
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

  const handleGroupChange = (e) => {
    setGroupDetails({ ...groupDetails, [e.target.name]: e.target.value });
  };

  const handleStudentChange = (index, e) => {
    const { name, value } = e.target;
    setStudents((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return updated;
    });
  };

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
      await apiRequest("/api/admin/add-group-pbl", "POST", payload, token);
      setMessage("✅ Group added successfully!");
      onSuccess && onSuccess();
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (err) {
      setMessage(`❌ Error: ${err.message || "Failed to add group."}`);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setGroupDetails({
      group_id: "",
      guide_name: "",
      guide_contact: "",
    });
    setStudentCount(4);
    setStudents(Array.from({ length: 4 }, () => emptyStudent()));
    setMessage("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-purple-700">Add New Group</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {message && (
            <div
              className={`p-3 rounded-lg mb-4 ${
                message.startsWith("✅")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Details */}
            <div>
              <h3 className="text-lg font-semibold text-purple-600 mb-4">
                Group Details
              </h3>
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
              <h3 className="text-lg font-semibold text-purple-600 mb-4">
                Students
              </h3>
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

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-6 py-3 rounded-lg shadow hover:from-purple-600 hover:to-purple-800 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Group"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg shadow hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddGroupModal;