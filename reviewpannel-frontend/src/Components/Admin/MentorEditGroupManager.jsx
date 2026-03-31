import React from "react";
import { CheckCircle2, Lock, Unlock, X } from "lucide-react";

const MentorEditGroupManager = ({
  canEdit,
  selectedFormId,
  enabledGroups = [],
  groupOptions = [],
  onToggleGroup,
  togglingGroupId,
}) => {
  const [groupIdInput, setGroupIdInput] = React.useState("");

  const normalizedEnabled = Array.isArray(enabledGroups) ? enabledGroups : [];
  const normalizedOptions = Array.isArray(groupOptions) ? groupOptions : [];
  const trimmedInput = groupIdInput.trim();
  const isEnabled = normalizedEnabled.includes(trimmedInput);

  const handleToggle = () => {
    if (!trimmedInput || !onToggleGroup) return;
    onToggleGroup(trimmedInput);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Allow Group To Edit Marks</h3>
          <p className="text-xs text-gray-500">
            Enable a group so its mentor can update marks for that group only.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            canEdit ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${canEdit ? "bg-emerald-500" : "bg-gray-400"}`}
          />
          {canEdit ? "Editing Controls Ready" : "Read Only"}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={groupIdInput}
            onChange={(e) => setGroupIdInput(e.target.value)}
            placeholder="Enter Group ID"
            list="mentor-edit-group-options"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={!canEdit || !selectedFormId}
          />
          <datalist id="mentor-edit-group-options">
            {normalizedOptions.map((groupId) => (
              <option key={groupId} value={groupId} />
            ))}
          </datalist>
          {groupIdInput && (
            <button
              type="button"
              onClick={() => setGroupIdInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={!canEdit || !selectedFormId || !trimmedInput}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            isEnabled
              ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
              : "bg-blue-600 text-white hover:bg-blue-700"
          } disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed`}
          title={isEnabled ? "Stop mentor editing for this group" : "Enable mentor edit for this group"}
        >
          {isEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          {isEnabled ? "Stop Editing" : "Enable"}
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <CheckCircle2 className="w-4 h-4 text-blue-500" />
          Enabled Groups
        </div>
        {normalizedEnabled.length === 0 ? (
          <p className="text-xs text-gray-500">No groups are currently allowed to edit marks.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {normalizedEnabled.map((groupId) => (
              <button
                key={groupId}
                type="button"
                onClick={() => onToggleGroup?.(groupId)}
                disabled={togglingGroupId === groupId || !canEdit}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Click to disable mentor edit"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {groupId}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorEditGroupManager;
