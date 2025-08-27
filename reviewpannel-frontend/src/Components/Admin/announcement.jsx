import React, { useState, useEffect } from "react";
import { Megaphone, BadgeCheck, BadgeDollarSign, Trash2 } from "lucide-react";
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
		const [sending, setSending] = useState(false);
		const [feedback, setFeedback] = useState("");
		const [marksToggles, setMarksToggles] = useState({});
		const [announcements, setAnnouncements] = useState([]);
		const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

		// Fetch current deadline toggles from backend on mount
		useEffect(() => {
			const token = localStorage.getItem("token");
			apiRequest("/api/deadlines_control", "GET", null, token).then((res) => {
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
			const res = await apiRequest("/api/announcement", "GET", null, token);
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
				`/api/deadlines_control/${key}`,
				"PUT",
				{ enabled: newStatus },
				token
			);
		};

		const handleSendAnnouncement = async (e) => {
			e.preventDefault();
			setSending(true);
			setFeedback("");
			const token = localStorage.getItem("token");
			const res = await apiRequest(
				"/api/announcement/send",
				"POST",
				{ title, message },
				token
			);
			setSending(false);
			setFeedback(res.message || "Announcement sent!");
			if (!res.error) {
				setTitle("");
				setMessage("");
				fetchAnnouncements();
			}
		};

		const handleDeleteAnnouncement = async (id) => {
			if (!window.confirm("Delete this announcement?")) return;
			const token = localStorage.getItem("token");
			await apiRequest(`/api/announcement/${id}`, "DELETE", null, token);
			fetchAnnouncements();
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
							className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
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
							className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition"
							placeholder="Type your announcement here..."
						/>
					</div>
					{feedback && (
						<div
							className={`p-2 rounded text-center ${
								feedback.toLowerCase().includes("sent")
									? "bg-green-100 text-green-700"
									: "bg-red-100 text-red-700"
							}`}
						>
							{feedback}
						</div>
					)}
					<button
						type="submit"
						disabled={sending}
						className="bg-purple-600 text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-purple-700 hover:scale-105 transition"
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
											Delete
										</th>
									</tr>
								</thead>
								<tbody>
									{announcements.length === 0 ? (
										<tr>
											<td
												colSpan={4}
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
												<td className="py-2 px-4">{a.id}</td>
												<td className="py-2 px-4 font-semibold text-purple-700">
													{a.title}
												</td>
												<td className="py-2 px-4">{a.message}</td>
												<td className="py-2 px-4 text-center">
													<button
														onClick={() => handleDeleteAnnouncement(a.id)}
														className="text-red-600 hover:text-red-800 p-2 rounded-full transition"
														title="Delete"
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