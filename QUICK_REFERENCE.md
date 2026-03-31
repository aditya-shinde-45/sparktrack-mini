# 🎯 Quick Reference - Mentor Edit Feature

## How It Works (Simple Version)

### For Sub-Admin:
1. Go to Sub-Admin Dashboard
2. Select evaluation form
3. Click toggle button for a group (OFF → ON)
4. Mentor can now edit that group
5. After mentor updates, toggle automatically goes back to OFF

### For Mentor:
1. Go to Mentor Evaluation page
2. Select form and group
3. If admin enabled edit: You can modify marks
4. Click "Update Evaluation"
5. Form becomes locked again automatically

---

## Current State Indicators

### Sub-Admin Dashboard:
- **OFF (Gray):** Mentor cannot edit
- **ON (Blue):** Mentor can edit
- **Badge:** Shows how many groups can edit

### Mentor Evaluation Page:
- **"Mentor edit is enabled"** → You can edit
- **"Editing is disabled"** → You cannot edit
- **"Editing has been automatically disabled"** → You just updated, now locked

---

## Button States

### Sub-Admin:
- **OFF** → Click to enable
- **ON** → Click to disable
- **Loading...** → Processing

### Mentor:
- **"Submit Evaluation"** → First time submission
- **"Update Evaluation"** → Can update (edit enabled)
- **"Evaluation Submitted (Locked)"** → Cannot edit

---

## Auto-Disable Feature

**When does it happen?**
- Automatically after mentor clicks "Update Evaluation"
- Only for mentors (not for admins)
- Only when mentor edit was enabled

**Why?**
- Prevents accidental multiple edits
- Admin has full control over when editing is allowed
- Clean workflow: Enable → Edit → Auto-disable → Re-enable if needed

---

## Security

✅ Mentors can only edit their assigned groups
✅ Mentors can only edit when admin enables it
✅ Edit permission auto-disables after update
✅ Approved evaluations cannot be edited
✅ All actions are logged in backend

---

## Troubleshooting

**Problem:** Toggle button not visible
- **Solution:** Refresh page, check if form is selected

**Problem:** Mentor cannot edit even when enabled
- **Solution:** Check if mentor is assigned to that group

**Problem:** Toggle doesn't change
- **Solution:** Check browser console for errors, verify backend is running

**Problem:** Auto-disable not working
- **Solution:** Check backend logs, verify database migration is applied

---

## Database Column

**Table:** `evaluation_forms`
**Column:** `mentor_edit_enabled_groups`
**Type:** `TEXT[]` (Array of group IDs)
**Example:** `['GROUP001', 'GROUP003', 'GROUP005']`

---

## API Endpoints

### Toggle Edit Permission:
```
PATCH /api/admin/evaluation-forms/:formId/toggle-mentor-edit
Body: { groupId: "GROUP001", enabled: true }
```

### Submit/Update Evaluation:
```
POST /api/mentors/evaluation-forms/:formId/submit
Body: { group_id, evaluations, ... }
```

---

## Quick Commands

### Check if group can edit:
```sql
SELECT mentor_edit_enabled_groups 
FROM evaluation_forms 
WHERE id = 'form-id';
```

### Manually enable a group:
```sql
UPDATE evaluation_forms 
SET mentor_edit_enabled_groups = 
    array_append(mentor_edit_enabled_groups, 'GROUP001')
WHERE id = 'form-id';
```

### Manually disable a group:
```sql
UPDATE evaluation_forms 
SET mentor_edit_enabled_groups = 
    array_remove(mentor_edit_enabled_groups, 'GROUP001')
WHERE id = 'form-id';
```

---

## Status: ✅ Production Ready

All features working as expected!
