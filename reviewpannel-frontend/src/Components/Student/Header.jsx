import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js";

const Header = ({ welcomeText = "Welcome to Project Planning", student: propStudent }) => {
  const [student, setStudent] = useState(propStudent);

  useEffect(() => {
    if (!propStudent) {
      const fetchStudent = async () => {
        try {
          const token = localStorage.getItem("student_token");
          if (!token) return;
          const res = await apiRequest("/api/student/profile", "GET", null, token);
          if (res && res.profile) {
            setStudent(res.profile);
            localStorage.setItem("student", JSON.stringify(res.profile));
          }
        } catch (err) {
          console.error("Error fetching student data:", err);
        }
      };
      fetchStudent();
    }
  }, [propStudent]);

  const firstName =
    student?.name_of_students?.split(" ")[0] ||
    student?.name?.split(" ")[0] ||
    "Student";

  return (
    <header className="sticky top-0 z-30 flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Left side: Greeting */}
      <div>
        <h1 className="font-bold text-2xl text-gray-900">
          Hey <span className="text-purple-700">{firstName.toUpperCase()}</span>
        </h1>
        <p className="text-gray-500 text-base">{welcomeText}</p>
      </div>

      {/* Right side: User Info */}
      <div className="flex items-center space-x-5">
        <img
          alt="User avatar"
          className="h-12 w-12 rounded-full border-2 border-purple-500 shadow"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2E1x3YJCs_Hl8PfKhOJmqV5qXcH0JOxqcXwqcPNCrl2ZUZ8YKxI1l6mr-XS0ZRYdxgkX3Vqky0YkTGsHFyh0Z3CNFGozWtPLyHH3ZlTXXYaiwmp4hVDM55N2RghoTh1nKNeqh8NIWrssFHbcXym6K-RtL9U5vdIz5sGVOUjkA9G8im59NH2FvjI03Qjl7N8XAn4A1UEb_ykYAdIL_Zoq2HDgcyctbE65GcFLY4xZeubtdQ1uWEGfH9CueXb2ZVnZSz7bb2Xsj8PA"
        />
        <div className="ml-2 text-base">
          <p className="font-semibold text-gray-900 truncate max-w-xs">
            {student?.name_of_students || student?.name || "Loading..."}
          </p>
          <p className="text-gray-600 text-sm flex items-center gap-2">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{student?.enrollment_no || "----"}</span>
            <span className="ml-2">{student?.class || "----"}</span>
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;