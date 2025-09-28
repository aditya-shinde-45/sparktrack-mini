import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js";

const AssignedExternalTable = () => {
  const [externals, setExternals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ password: "", name: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExternal, setNewExternal] = useState({ external_id: "", password: "", name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  // Fetch externals
  const fetchExternals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await apiRequest("/api/external/externals", "GET", null, token);
      // Handle new API response structure: { success, message, data: { externals } }
      setExternals(response.data?.externals || response.externals || []);
    } catch (err) {
      console.error("Error fetching externals:", err);
      alert("Failed to load externals. Please refresh the page.");
    } finally {
      setLoading(false);
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
    // Validate that at least one field is provided and not empty
    const hasValidPassword = editData.password && editData.password.trim();
    const hasValidName = editData.name && editData.name.trim();
    
    if (!hasValidPassword && !hasValidName) {
      alert("Please provide at least password or name to update");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      // Only send non-empty fields
      const updateData = {};
      if (hasValidPassword) updateData.password = editData.password.trim();
      if (hasValidName) updateData.name = editData.name.trim();
      
      const response = await apiRequest(`/api/external/externals/${external_id}`, "PUT", updateData, token);
      
      // Update the local state with the new data
      setExternals((prev) =>
        prev.map((ext) =>
          ext.external_id === external_id ? { ...ext, ...updateData } : ext
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error updating external:", err);
      const errorMessage = err.response?.data?.message || "Failed to update external. Please try again.";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Add external
  const handleAdd = async () => {
    // Validate required fields
    if (!newExternal.external_id.trim()) {
      alert("External ID is required");
      return;
    }
    if (!newExternal.password.trim()) {
      alert("Password is required");
      return;
    }
    if (!newExternal.name.trim()) {
      alert("Name is required");
      return;
    }

    try {
      setAdding(true);
      const token = localStorage.getItem("token");
      const response = await apiRequest("/api/external/externals", "POST", newExternal, token);

      // Handle new API response structure: { success, message, data: { added } }
      const addedData = response.data?.added || response.added;
      if (addedData?.length) {
        setExternals((prev) => [...prev, addedData[0]]);
      }

      setNewExternal({ external_id: "", password: "", name: "" });
      setShowAddForm(false);
    } catch (err) {
      // Handle both old and new error response formats
      const errorMessage = err.response?.data?.message || err.message || "Error adding external. Please try again.";
      alert(errorMessage);
      console.error("Error adding external:", err);
    } finally {
      setAdding(false);
    }
  };

  // Delete external
  const handleDelete = async (external_id) => {
    if (!window.confirm("Are you sure you want to delete this external?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await apiRequest(`/api/external/externals/${external_id}`, "DELETE", null, token);
      
      // If successful, remove from local state
      setExternals((prev) => prev.filter((ext) => ext.external_id !== external_id));
    } catch (err) {
      console.error("Error deleting external:", err);
      const errorMessage = err.response?.data?.message || "Failed to delete external.";
      alert(errorMessage);
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
            <button 
              onClick={handleAdd} 
              disabled={adding}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {adding && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {adding ? 'Adding...' : 'Add'}
            </button>
            <button 
              onClick={() => setShowAddForm(false)} 
              disabled={adding}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
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
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading externals...</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
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
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSave(ext.external_id)} 
                            disabled={saving}
                            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button 
                            onClick={() => setEditingId(null)} 
                            disabled={saving}
                            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="material-icons text-purple-600 cursor-pointer hover:text-purple-800" onClick={() => handleEdit(ext)}>edit</span>
                      )}
                    </td>
                    {/* Delete column */}
                    <td className="px-6 py-4">
                      <span className="material-icons text-red-600 cursor-pointer hover:text-red-800" onClick={() => handleDelete(ext.external_id)}>delete</span>
                    </td>
                  </tr>
                ))}
                {filteredExternals.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                      No externals found
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignedExternalTable;
