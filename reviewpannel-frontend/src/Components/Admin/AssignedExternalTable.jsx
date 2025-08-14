import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js"; // Your helper to make API calls

const AssignedExternalTable = () => {
  const [externals, setExternals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ password: "", name: "" });
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all externals on component mount
  useEffect(() => {
    const fetchExternals = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await apiRequest("/api/admin/externals", "GET", null, token);
        setExternals(data.externals);
      } catch (err) {
        console.error("Error fetching externals:", err);
      }
    };
    fetchExternals();
  }, []);

  const handleEdit = (external) => {
    setEditingId(external.external_id);
    setEditData({ password: external.password, name: external.name || "" });
  };

  const handleSave = async (external_id) => {
    try {
      const token = localStorage.getItem("token");
      await apiRequest(`/api/admin/externals/${external_id}`, "PUT", editData, token);
      setExternals((prev) =>
        prev.map((ext) =>
          ext.external_id === external_id ? { ...ext, ...editData } : ext
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error updating external:", err);
    }
  };

  const filteredExternals = externals.filter((ext) =>
    ext.external_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ext.name && ext.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      {/* Search Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">External ID</th>
              <th className="px-6 py-3">Password</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExternals.map((ext) => (
              <tr key={ext.external_id} className="bg-white border-b">
                <td className="px-6 py-4">{ext.external_id}</td>
                <td className="px-6 py-4">
                  {editingId === ext.external_id ? (
                    <input
                      type="text"
                      value={editData.password}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      className="border px-2 py-1 rounded w-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter password"
                    />
                  ) : (
                    ext.password
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === ext.external_id ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="border px-2 py-1 rounded w-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter name"
                    />
                  ) : (
                    ext.name || "-"
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === ext.external_id ? (
                    <button
                      onClick={() => handleSave(ext.external_id)}
                      className="bg-purple-600 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                  ) : (
                    <span
                      className="material-icons text-purple-600 cursor-pointer"
                      onClick={() => handleEdit(ext)}
                    >
                      edit
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filteredExternals.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                  No externals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignedExternalTable;
