import React, { useState, useEffect } from "react";
import { Megaphone, BadgeCheck, BadgeDollarSign, Trash2, Upload, File, Download, X } from "lucide-react";
import { apiRequest } from "../../api";

const MARKS_OPTIONS = [
    {
        key: "show_pbl_review1_marks",
        label: "Show PBL Review 1 Marks",
        icon: <BadgeCheck className="w-6 h-6 text-yellow-500" />,
    },
    {
        key: "show_pbl_review2_marks",
        label: "Show PBL Review 2 Marks",
        icon: <BadgeDollarSign className="w-6 h-6 text-emerald-500" />,
    },
];

const AnnouncementAdmin = () => {
    const [message, setMessage] = useState("");
    const [title, setTitle] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [marksToggles, setMarksToggles] = useState({});
    const [announcements, setAnnouncements] = useState([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

    // Fetch current deadline toggles from backend on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        apiRequest("/api/deadlines", "GET", null, token).then((res) => {
            if (res && res.deadlines) {
                const toggles = {};
                MARKS_OPTIONS.forEach((opt) => {
                    const found = res.deadlines.find((d) => d.key === opt.key);
                    toggles[opt.key] = found ? !!found.enabled : false;
                });
                setMarksToggles(toggles);
            }
        });
        fetchAnnouncements();
        // eslint-disable-next-line
    }, []);

    const fetchAnnouncements = async () => {
        setLoadingAnnouncements(true);
        const token = localStorage.getItem("token");
        const res = await apiRequest("/api/announcements", "GET", null, token);
        setLoadingAnnouncements(false);
        if (res && res.announcements) setAnnouncements(res.announcements);
        else setAnnouncements([]);
    };

    const handleToggle = async (key) => {
        const token = localStorage.getItem("token");
        const newStatus = !marksToggles[key];
        setMarksToggles((prev) => ({
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                setFeedback("Only images (JPEG, PNG, GIF, WEBP) and PDF files are allowed.");
                return;
            }
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setFeedback("File size must be less than 10MB.");
                return;
            }
            setSelectedFile(file);
            setFeedback("");
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        // Reset the file input
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleSendAnnouncement = async (e) => {
        e.preventDefault();
        setSending(true);
        setFeedback("");
        
        const token = localStorage.getItem("token");
        
        try {
            // We can't use the standard apiRequest for file uploads since it doesn't support FormData
            // Instead we'll use fetch directly but match the response handling pattern
            const formData = new FormData();
            formData.append('title', title);
            formData.append('message', message);
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            const API_BASE_URL = import.meta.env.MODE === "development"
                ? import.meta.env.VITE_API_BASE_URL
                : import.meta.env.VITE_API_BASE_URL_PROD;

            const response = await fetch(`${API_BASE_URL}/api/announcements/announcement/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            let data = {};
            try {
                data = await response.json();
            } catch (error) {
                console.error("Failed to parse response", error);
            }

            setSending(false);
            
            if (response.ok) {
                setFeedback(data.message || "Announcement sent successfully!");
                setTitle("");
                setMessage("");
                setSelectedFile(null);
                // Reset file input
                const fileInput = document.getElementById('file-upload');
                if (fileInput) fileInput.value = '';
                fetchAnnouncements();
            } else {
                setFeedback(data.message || "Failed to send announcement");
            }
        } catch (error) {
            console.error("Error sending announcement:", error);
            setSending(false);
            setFeedback("Failed to send announcement. Please try again.");
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm("Delete this announcement?")) return;
        const token = localStorage.getItem("token");
        const res = await apiRequest(`/api/announcements/announcement/${id}`, "DELETE", null, token);
        if (res && !res.success === false) {
            fetchAnnouncements();
        } else {
            setFeedback("Failed to delete announcement");
        }
    };

    const handleDownloadFile = async (id, fileName) => {
        const token = localStorage.getItem("token");
        
        try {
            // We need to use fetch directly for file downloads
            const API_BASE_URL = import.meta.env.MODE === "development"
                ? import.meta.env.VITE_API_BASE_URL
                : import.meta.env.VITE_API_BASE_URL_PROD;

            const response = await fetch(`${API_BASE_URL}/api/announcement/${id}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                let data = {};
                try {
                    data = await response.json();
                } catch (error) {
                    console.error("Failed to parse response", error);
                }
                setFeedback(data.message || "Failed to download file");
            }
        } catch (error) {
            console.error('Download failed:', error);
            setFeedback("Failed to download file. Please try again.");
        }
    };

    const getFileIcon = (fileType) => {
        if (fileType?.startsWith('image/')) {
            return <File className="w-4 h-4 text-blue-500" />;
        } else if (fileType === 'application/pdf') {
            return <File className="w-4 h-4 text-red-500" />;
        }
        return <File className="w-4 h-4 text-gray-500" />;
    };

    return (
        <div className="w-full ">
            <form
                onSubmit={handleSendAnnouncement}
                className="bg-white rounded-xl shadow-lg p-8 w-full space-y-6 border border-purple-100 mb-10"
            >
                <h2 className="text-xl font-bold text-purple-700 mb-2">
                    Send Announcement to All Students
                </h2>
                
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                        Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white"
                        placeholder="Announcement Title"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                        Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition text-gray-800 bg-white resize-vertical"
                        placeholder="Type your announcement here..."
                    />
                </div>

                {/* File Upload Section */}
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                        Attachment (Optional)
                    </label>
                    <div className="space-y-3">
                        {!selectedFile ? (
                            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 transition">
                                <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <p className="text-gray-600 mb-2">Upload an image or PDF file</p>
                                <p className="text-sm text-gray-500 mb-4">Supported: JPEG, PNG, GIF, WEBP, PDF (Max: 10MB)</p>
                                <label className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-purple-200 transition">
                                    <span>Choose File</span>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf"
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    {getFileIcon(selectedFile.type)}
                                    <div>
                                        <p className="font-medium text-purple-700">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {feedback && (
                    <div
                        className={`p-3 rounded-lg text-center ${
                            feedback.toLowerCase().includes("success") || feedback.toLowerCase().includes("sent")
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                    >
                        {feedback}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={sending}
                    className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold shadow hover:bg-purple-700 hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {sending ? "Sending..." : "Send Announcement"}
                </button>
            </form>

            <div className="w-full px-0 md:px-8 mb-10">
                <hr className="my-8 border-purple-200" />
                <h2 className="text-xl font-bold text-purple-700 mb-4 text-center">
                    Marks Controls
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {MARKS_OPTIONS.map((option) => (
                        <div
                            key={option.key}
                            className={`flex items-center justify-between bg-white rounded-lg shadow-lg p-6 border border-gray-100 transition-all duration-200
                ${marksToggles[option.key] ? "ring-2 ring-purple-400" : ""}
              `}
                        >
                            <div className="flex items-center gap-4">
                                {option.icon}
                                <span className="text-lg font-semibold text-gray-900">
                                    {option.label}
                                </span>
                            </div>
                            <button
                                onClick={() => handleToggle(option.key)}
                                className={`px-5 py-2 rounded-full font-bold transition
                  ${
                    marksToggles[option.key]
                      ? "bg-purple-600 text-white shadow"
                      : "bg-gray-100 text-purple-700 hover:bg-purple-200"
                  }
                `}
                            >
                                {marksToggles[option.key] ? "Enabled" : "Disabled"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full px-0 md:px-8 mb-10">
                <hr className="my-8 border-purple-200" />
                <h2 className="text-xl font-bold text-purple-700 mb-4 text-center">
                    All Announcements
                </h2>
                {loadingAnnouncements ? (
                    <div className="text-center text-purple-500 font-semibold text-lg">
                        Loading...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-xl shadow border border-purple-100">
                            <thead>
                                <tr className="bg-purple-50">
                                    <th className="py-3 px-4 text-left font-semibold text-purple-700">
                                        ID
                                    </th>
                                    <th className="py-3 px-4 text-left font-semibold text-purple-700">
                                        Title
                                    </th>
                                    <th className="py-3 px-4 text-left font-semibold text-purple-700">
                                        Message
                                    </th>
                                    <th className="py-3 px-4 text-center font-semibold text-purple-700">
                                        Attachment
                                    </th>
                                    <th className="py-3 px-4 text-center font-semibold text-purple-700">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-6 text-gray-500"
                                        >
                                            No announcements found.
                                        </td>
                                    </tr>
                                ) : (
                                    announcements.map((a) => (
                                        <tr
                                            key={a.id}
                                            className="border-t border-purple-100 hover:bg-purple-50 transition"
                                        >
                                            <td className="py-3 px-4 text-gray-800">{a.id}</td>
                                            <td className="py-3 px-4 font-semibold text-purple-700">
                                                {a.title}
                                            </td>
                                            <td className="py-3 px-4 max-w-xs truncate text-gray-700">
                                                {a.message}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {a.file_url ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        {getFileIcon(a.file_type)}
                                                        <button
                                                            onClick={() => handleDownloadFile(a.id, a.file_name)}
                                                            className="text-blue-600 hover:text-blue-800 transition"
                                                            title={`Download ${a.file_name}`}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">No file</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteAnnouncement(a.id)}
                                                    className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition"
                                                    title="Delete announcement"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementAdmin;