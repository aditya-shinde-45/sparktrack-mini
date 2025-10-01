import React, { useState, useEffect } from "react";
import { CalendarCheck, FileText, Users, ClipboardList, BadgeCheck, BadgeDollarSign } from "lucide-react";
import { apiRequest } from "../../api";

const DEADLINE_TASKS = [
    {
        key: "group_creation",
        label: "Group Creation",
        icon: <Users className="w-6 h-6 text-purple-600" />,
    },
    {
        key: "problem_statement",
        label: "Problem Statement Submission",
        icon: <ClipboardList className="w-6 h-6 text-pink-500" />,
    },
    {
        key: "report_submission",
        label: "Submit Reports",
        icon: <FileText className="w-6 h-6 text-blue-500" />,
    },
    {
        key: "final_presentation",
        label: "Final Presentation",
        icon: <CalendarCheck className="w-6 h-6 text-green-500" />,
    },
    {
        key: "pbl_review_1",
        label: "PBL Review 1",
        icon: <BadgeCheck className="w-6 h-6 text-orange-500" />,
    },
    {
        key: "pbl_review_2",
        label: "PBL Review 2",
        icon: <BadgeCheck className="w-6 h-6 text-indigo-500" />,
    },
];

const DeadlineAdmin = () => {
    const [activeTasks, setActiveTasks] = useState({});
    const [loading, setLoading] = useState(false);

    // Fetch current deadline toggles from backend on mount
    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        setLoading(true);
        apiRequest("/api/deadlines", "GET", null, token).then((res) => {
            setLoading(false);
            console.log("Deadlines API Response:", res);
            
            // Handle new response structure with data array
            let deadlinesData = [];
            if (res?.data && Array.isArray(res.data)) {
                deadlinesData = res.data;
            } else if (res?.deadlines && Array.isArray(res.deadlines)) {
                deadlinesData = res.deadlines;
            }
            
            if (deadlinesData.length > 0) {
                const toggles = {};
                DEADLINE_TASKS.forEach(task => {
                    const found = deadlinesData.find(d => d.key === task.key);
                    toggles[task.key] = found ? !!found.enabled : false;
                });
                setActiveTasks(toggles);
            }
        }).catch((err) => {
            setLoading(false);
            console.error("Error fetching deadlines:", err);
        });
    }, []);

    const handleToggle = async (key) => {
        const token = localStorage.getItem("admin_token");
        const newStatus = !activeTasks[key];
        
        // Block toggle if trying to enable PBL review when the other is already enabled
        if ((key === "pbl_review_1" || key === "pbl_review_2") && newStatus) {
            const otherReviewKey = key === "pbl_review_1" ? "pbl_review_2" : "pbl_review_1";
            if (activeTasks[otherReviewKey]) {
                return; // Block the toggle
            }
        }
        
        setActiveTasks((prev) => ({
            ...prev,
            [key]: newStatus,
        }));
        // Update deadline toggle in backend
        await apiRequest(
            `/api/deadlines/${key}`,
            "PUT",
            { enabled: newStatus },
            token
        );
    };

    return (
        <div className="w-full">
            {loading ? (
                <div className="text-center text-purple-500 font-semibold text-lg">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {DEADLINE_TASKS.map((task) => (
                        <div
                            key={task.key}
                            className={`flex items-center justify-between bg-white rounded-lg shadow-lg p-6 border border-gray-100 transition-all duration-200
              ${activeTasks[task.key] ? "ring-2 ring-purple-400" : ""}
            `}
                        >
                            <div className="flex items-center gap-4">
                                {task.icon}
                                <span className="text-lg font-semibold text-gray-900">
                                    {task.label}
                                </span>
                            </div>
                            <button
                                onClick={() => handleToggle(task.key)}
                                className={`px-5 py-2 rounded-full font-bold transition
                ${
                                    activeTasks[task.key]
                                        ? "bg-purple-600 text-white shadow"
                                        : "bg-gray-100 text-purple-700 hover:bg-purple-200"
                                }
              `}
                            >
                                {activeTasks[task.key] ? "Enabled" : "Disabled"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeadlineAdmin;