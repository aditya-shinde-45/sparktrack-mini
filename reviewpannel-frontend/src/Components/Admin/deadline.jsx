import React, { useState, useEffect } from "react";
import { CalendarCheck, FileText, Users, ClipboardList } from "lucide-react";
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
];

const DeadlineAdmin = () => {
    const [activeTasks, setActiveTasks] = useState({});
    const [evaluationTasks, setEvaluationTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch current deadline toggles from backend on mount
    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        setLoading(true);
        Promise.all([
            apiRequest("/api/deadlines", "GET", null, token),
            apiRequest("/api/admin/evaluation-forms", "GET", null, token)
        ]).then(([deadlineRes, formsRes]) => {
            setLoading(false);
            
            let deadlinesData = [];
            if (deadlineRes?.data && Array.isArray(deadlineRes.data)) {
                deadlinesData = deadlineRes.data;
            } else if (deadlineRes?.deadlines && Array.isArray(deadlineRes.deadlines)) {
                deadlinesData = deadlineRes.deadlines;
            }

            const forms = formsRes?.data || [];
            const evalTasks = forms.map((form) => ({
                key: `evaluation_form_${form.id}`,
                label: form.name,
                icon: <FileText className="w-6 h-6 text-indigo-500" />
            }));
            setEvaluationTasks(evalTasks);

            const toggles = {};
            [...DEADLINE_TASKS, ...evalTasks].forEach(task => {
                const found = deadlinesData.find(d => d.key === task.key);
                toggles[task.key] = found ? !!found.enabled : true;
            });
            setActiveTasks(toggles);
        }).catch((err) => {
            setLoading(false);
            console.error("Error fetching deadlines:", err);
        });
    }, []);

    const handleToggle = async (key) => {
        const token = localStorage.getItem("admin_token");
        const newStatus = !activeTasks[key];
        
        setActiveTasks((prev) => ({
            ...prev,
            [key]: newStatus,
        }));
        // Update deadline toggle in backend
        await apiRequest(
            `/api/deadlines/${key}`,
            "PUT",
            { enabled: newStatus, label: [...DEADLINE_TASKS, ...evaluationTasks].find(task => task.key === key)?.label },
            token
        );
    };

    return (
        <div className="w-full">
            {loading ? (
                <div className="text-center text-purple-500 font-semibold text-lg">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...DEADLINE_TASKS, ...evaluationTasks].map((task) => (
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