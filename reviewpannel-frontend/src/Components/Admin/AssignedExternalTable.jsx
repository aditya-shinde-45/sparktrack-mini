import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js";

const AssignedExternalTable = () => {
  const [externals, setExternals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ password: "", name: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExternal, setNewExternal] = useState({ external_id: "", password: "", name: "" });

  // Fetch externals
  const fetchExternals = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await apiRequest("/api/admin/externals", "GET", null, token);
      setExternals(data.externals);
    } catch (err) {
      console.error("Error fetching externals:", err);
    }
  };

  useEffect(() => {
    fetchExternals();
  }, []);

  // Edit external
  const handleEdit = (external) => {
    setEditingId(external.external_id);
    setEditData({ password: external.password, name: external.name || "" });
  };

  // Save external
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

  // Add external
  const handleAdd = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiRequest("/api/admin/add-externals", "POST", newExternal, token);

      if (response?.added?.length) {
        setExternals((prev) => [...prev, response.added[0]]);
      }

      setNewExternal({ external_id: "", password: "", name: "" });
      setShowAddForm(false);
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        console.error("Error adding external:", err);
        alert("Error adding external. Please try again.");
      }
    }
  };

  // Delete external
  const handleDelete = async (external_id) => {
    if (!window.confirm("Are you sure you want to delete this external?")) return;
    try {
      const token = localStorage.getItem("token");
      await apiRequest(`/api/admin/del-externals/${external_id}`, "DELETE", null, token);
      setExternals((prev) => prev.filter((ext) => ext.external_id !== external_id));
    } catch (err) {
      console.error("Error deleting external:", err);
      alert("Failed to delete external.");
    }
  };

  const filteredExternals = externals.filter((ext) =>
    ext.external_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ext.name && ext.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      {/* Search & Add */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <span className="material-icons">add</span>
          Add External
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Add New External</h3>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="External ID"
              value={newExternal.external_id}
              onChange={(e) => setNewExternal(prev => ({ ...prev, external_id: e.target.value }))}
              className="border px-3 py-2 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Password"
              value={newExternal.password}
              onChange={(e) => setNewExternal(prev => ({ ...prev, password: e.target.value }))}
              className="border px-3 py-2 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Name"
              value={newExternal.name}
              onChange={(e) => setNewExternal(prev => ({ ...prev, name: e.target.value }))}
              className="border px-3 py-2 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add</button>
            <button onClick={() => setShowAddForm(false)} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">External ID</th>
              <th className="px-6 py-3">Password</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Update</th>
              <th className="px-6 py-3">Delete</th>
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
                      onChange={(e) => setEditData((prev) => ({ ...prev, password: e.target.value }))}
                      className="border px-2 py-1 rounded w-full bg-white text-gray-900"
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
                      onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                      className="border px-2 py-1 rounded w-full bg-white text-gray-900"
                      placeholder="Enter name"
                    />
                  ) : (
                    ext.name || "-"
                  )}
                </td>
                {/* Update column */}
                <td className="px-6 py-4">
                  {editingId === ext.external_id ? (
                    <button onClick={() => handleSave(ext.external_id)} className="bg-purple-600 text-white px-3 py-1 rounded">
                      Save
                    </button>
                  ) : (
                    <span className="material-icons text-purple-600 cursor-pointer" onClick={() => handleEdit(ext)}>edit</span>
                  )}
                </td>
                {/* Delete column */}
                <td className="px-6 py-4">
                  <span className="material-icons text-red-600 cursor-pointer" onClick={() => handleDelete(ext.external_id)}>delete</span>
                </td>
              </tr>
            ))}
            {filteredExternals.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
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
