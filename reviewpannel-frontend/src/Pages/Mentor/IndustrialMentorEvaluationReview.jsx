import React, { useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import { apiRequest } from "../../api";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import IndustryMentorSidebar from "../../Components/Mentor/IndustryMentorSidebar";
import MarksTable from "../../Components/Admin/MarksTable";
import Pagination from "../../Components/Admin/Pagination";

const rowsPerPage = 50;

const normalizeFieldType = (field) => {
	return field?.type || (Number(field?.max_marks) === 0 ? "boolean" : "number");
};

const IndustryMentorEvaluationReview = () => {
	const [mentor, setMentor] = useState({ name: "Industry Mentor", id: "----" });
	const [forms, setForms] = useState([]);
	const [selectedFormId, setSelectedFormId] = useState("");
	const [formFields, setFormFields] = useState([]);
	const [formTotalMarks, setFormTotalMarks] = useState(0);

	const [groups, setGroups] = useState([]);
	const [selectedGroupId, setSelectedGroupId] = useState("");

	const [students, setStudents] = useState([]);
	const [allStudentsForCSV, setAllStudentsForCSV] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("group_id");
	const [sortOrder, setSortOrder] = useState("asc");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalRecords, setTotalRecords] = useState(0);
	const [loading, setLoading] = useState(false);
	const [exportingCSV, setExportingCSV] = useState(false);
	const [error, setError] = useState("");

	const token = localStorage.getItem("industry_mentor_token");
	const csvLinkRef = React.useRef(null);

	const computedTotal = useMemo(() => {
		return formFields.reduce((sum, field) => sum + (Number(field.max_marks) || 0), 0);
	}, [formFields]);

	const sortedStudents = useMemo(() => {
		const dataToSort = [...students];
		return dataToSort.sort((a, b) => {
			let aVal = a[sortBy];
			let bVal = b[sortBy];

			if (sortBy === "total") {
				aVal = Number(aVal) || 0;
				bVal = Number(bVal) || 0;
			} else {
				aVal = String(aVal || "").toLowerCase();
				bVal = String(bVal || "").toLowerCase();
			}

			if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
			if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
			return 0;
		});
	}, [students, sortBy, sortOrder]);

	const csvHeaders = useMemo(() => {
		const baseHeaders = [
			{ label: "GROUP ID", key: "group_id" },
			{ label: "ENROLLMENT NO", key: "enrollment_no" },
			{ label: "STUDENT NAME", key: "student_name" }
		];

		const fieldHeaders = formFields.map((field) => ({
			label: field.label?.toUpperCase() || field.key,
			key: field.key
		}));

		return [
			...baseHeaders,
			...fieldHeaders,
			{ label: "TOTAL", key: "total" },
			{ label: "EXTERNAL", key: "external_name" },
			{ label: "FEEDBACK", key: "feedback" }
		];
	}, [formFields]);

	const csvData = useMemo(() => {
		const dataToUse = allStudentsForCSV.length > 0 ? allStudentsForCSV : students;
		return dataToUse.map((student) => {
			const flattened = {
				group_id: student.group_id,
				enrollment_no: student.enrollment_no,
				student_name: student.student_name,
				total: student.total,
				external_name: student.external_name,
				feedback: student.feedback
			};

			formFields.forEach((field) => {
				const value = student.marks?.[field.key];
				if (normalizeFieldType(field) === "boolean") {
					flattened[field.key] = value ? "Yes" : "No";
				} else {
					flattened[field.key] = value ?? "";
				}
			});

			return flattened;
		});
	}, [students, allStudentsForCSV, formFields]);

	const fetchForms = async () => {
		const response = await apiRequest("/api/industrial-mentors/evaluation-forms", "GET", null, token);
		if (response?.success) {
			const availableForms = response.data || [];
			setForms(availableForms);
			if (!selectedFormId && availableForms.length > 0) {
				setSelectedFormId(availableForms[0].id);
			}
		}
	};

	const fetchGroups = async () => {
		const response = await apiRequest("/api/industrial-mentors/groups", "GET", null, token);
		if (response?.success) {
			setGroups(response?.data?.groups || []);
		}
	};

	const fetchFormDetails = async (formId) => {
		if (!formId) return;

		const response = await apiRequest(
			`/api/industrial-mentors/evaluation-forms/${formId}`,
			"GET",
			null,
			token
		);

		if (response?.success) {
			const form = response.data;
			const incomingFields = Array.isArray(form?.fields) ? form.fields : [];
			const sortedFields = [...incomingFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
			setFormFields(sortedFields);
			setFormTotalMarks(form?.total_marks || 0);
			return;
		}

		setFormFields([]);
		setFormTotalMarks(0);
	};

	const fetchStudents = async (formId, page, search = "", groupId = "") => {
		if (!formId) return;
		setLoading(true);
		setError("");

		try {
			let url = `/api/industrial-mentors/evaluation-forms/${formId}/submissions?page=${page}&limit=${rowsPerPage}`;
			if (search) {
				url += `&search=${encodeURIComponent(search)}`;
			}
			if (groupId) {
				url += `&groupId=${encodeURIComponent(groupId)}`;
			}

			const response = await apiRequest(url, "GET", null, token);

			if (response?.success && response.data) {
				setStudents(Array.isArray(response.data.data) ? response.data.data : []);
				const pagination = response.data.pagination || {};
				setTotalPages(pagination.totalPages || 1);
				setTotalRecords(pagination.totalRecords || 0);
				return;
			}

			setStudents([]);
			setTotalPages(1);
			setTotalRecords(0);
		} catch (err) {
			setError(err.message || "Failed to load marks.");
			setStudents([]);
			setTotalPages(1);
			setTotalRecords(0);
		} finally {
			setLoading(false);
		}
	};

	const fetchAllStudentsForCSV = async (formId, search = "", groupId = "") => {
		if (!formId) return false;
		setExportingCSV(true);

		try {
			let url = `/api/industrial-mentors/evaluation-forms/${formId}/submissions?page=1&limit=10000`;
			if (search) {
				url += `&search=${encodeURIComponent(search)}`;
			}
			if (groupId) {
				url += `&groupId=${encodeURIComponent(groupId)}`;
			}

			const response = await apiRequest(url, "GET", null, token);
			if (response?.success && response.data) {
				setAllStudentsForCSV(Array.isArray(response.data.data) ? response.data.data : []);
				return true;
			}

			return false;
		} finally {
			setExportingCSV(false);
		}
	};

	useEffect(() => {
		if (!token) return;

		try {
			const tokenData = JSON.parse(atob(token.split(".")[1]));
			setMentor({
				name: tokenData?.name || "Industry Mentor",
				id: tokenData?.industrial_mentor_code || tokenData?.mentor_code || "----"
			});
		} catch {
			setMentor({ name: "Industry Mentor", id: "----" });
		}

		fetchForms();
		fetchGroups();
	}, [token]);

	useEffect(() => {
		if (!selectedFormId) {
			setStudents([]);
			setTotalPages(1);
			setTotalRecords(0);
			return;
		}

		fetchFormDetails(selectedFormId);
		fetchStudents(selectedFormId, currentPage, searchQuery, selectedGroupId);
	}, [selectedFormId, currentPage, searchQuery, selectedGroupId]);

	return (
		<div className="font-[Poppins] bg-gray-50 min-h-screen">
			<MentorHeader name={mentor.name} id={mentor.id} />
			<div className="flex flex-1 flex-col lg:flex-row mt-[72px]">
				<IndustryMentorSidebar />
				<main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 mb-16 lg:mb-0 space-y-6">
					<div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-lg shadow-lg p-6">
						<h1 className="text-3xl font-bold text-white mb-4">View Marks</h1>
						<div className="flex flex-wrap gap-4 items-center">
							<select
								value={selectedFormId}
								onChange={(e) => {
									setSelectedFormId(e.target.value);
									setCurrentPage(1);
								}}
								className="px-4 py-2 rounded-lg font-semibold bg-white text-indigo-700 shadow-lg"
							>
								<option value="">Select Evaluation Form</option>
								{forms.map((form) => (
									<option key={form.id} value={form.id}>{form.name}</option>
								))}
							</select>

							<select
								value={selectedGroupId}
								onChange={(e) => {
									setSelectedGroupId(e.target.value);
									setCurrentPage(1);
								}}
								className="px-4 py-2 rounded-lg font-semibold bg-white text-indigo-700 shadow-lg"
							>
								<option value="">All Assigned Groups</option>
								{groups.map((groupId) => (
									<option key={groupId} value={groupId}>{groupId}</option>
								))}
							</select>

							<div className="text-white text-sm">
								<span className="font-semibold">Total Records:</span> {totalRecords}
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-md p-4 space-y-4">
						<div className="flex flex-col sm:flex-row gap-4">
							<div className="flex-1">
								<label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
								<input
									type="text"
									placeholder="Search by Group ID, Enrollment No or Student Name..."
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setCurrentPage(1);
									}}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
								/>
							</div>

							<div className="flex-1">
								<label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
								<div className="flex gap-2">
									<select
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value)}
										className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
									>
										<option value="group_id">Group ID</option>
										<option value="enrollment_no">Enrollment No</option>
										<option value="student_name">Student Name</option>
										<option value="total">Total Marks</option>
										<option value="external_name">External Name</option>
									</select>
									<button
										onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
										className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold"
										title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
									>
										{sortOrder === "asc" ? "↑ ASC" : "↓ DESC"}
									</button>
								</div>
							</div>

							<div className="flex items-end">
								<CSVLink
									data={csvData}
									headers={csvHeaders}
									filename={`IndustryMentor_Evaluation_${selectedFormId || "marks"}.csv`}
									ref={csvLinkRef}
									className="hidden"
								/>
								<button
									onClick={async () => {
										if (!selectedFormId) return;
										const success = await fetchAllStudentsForCSV(selectedFormId, searchQuery, selectedGroupId);
										if (success) {
											setTimeout(() => {
												csvLinkRef.current?.link.click();
											}, 100);
										}
									}}
									disabled={exportingCSV || !selectedFormId}
									className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
								>
									{exportingCSV ? "Exporting..." : "Export CSV"}
								</button>
							</div>
						</div>
					</div>

					{loading && (
						<div className="flex justify-center items-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
							<span className="ml-3 text-gray-600 font-semibold">Loading data...</span>
						</div>
					)}

					{error && !loading && (
						<div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
							<p className="text-red-700 font-semibold">{error}</p>
						</div>
					)}

					{!loading && !error && (
						<div className="bg-white rounded-lg shadow-md overflow-hidden">
							<div className="overflow-x-auto">
								<MarksTable
									students={sortedStudents}
									loading={loading}
									error={error}
									reviewType="form"
									formFields={formFields}
									totalMarks={formTotalMarks || computedTotal}
								/>
							</div>
						</div>
					)}

					{!loading && !error && totalRecords > 0 && (
						<div className="bg-white rounded-lg shadow-md p-4">
							<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
								<div className="text-sm text-gray-600">
									Showing <span className="font-semibold text-indigo-600">{((currentPage - 1) * rowsPerPage) + 1}</span> to{" "}
									<span className="font-semibold text-indigo-600">{Math.min(currentPage * rowsPerPage, totalRecords)}</span> of{" "}
									<span className="font-semibold text-indigo-600">{totalRecords}</span> entries
								</div>
								<Pagination
									currentPage={currentPage}
									totalPages={totalPages}
									setCurrentPage={setCurrentPage}
									totalItems={totalRecords}
									rowsPerPage={rowsPerPage}
								/>
							</div>
						</div>
					)}

					{!loading && !error && totalRecords === 0 && (
						<div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
							<h3 className="text-xl font-semibold text-gray-600 mb-2">No Records Found</h3>
							<p className="text-gray-500">Try changing the form, group filter, or search query.</p>
						</div>
					)}
				</main>
			</div>
		</div>
	);
};

export default IndustryMentorEvaluationReview;
