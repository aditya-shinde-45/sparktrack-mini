# 🔧 HOW TO ENABLE MENTOR EDITING FOR GROUP TYCC203

## Current Situation
- Group: **TYCC203**
- Form: **TY Review-2 (Technical)**
- Status: **APPROVED** (is_approved = true)
- Mentor Edit: **DISABLED** (not in mentor_edit_enabled_groups array)
- Message: "✗ Evaluation approved. Editing disabled."

## Why Mentor Cannot Edit
The mentor cannot edit because **the group is not in the `mentor_edit_enabled_groups` array**. Even though we fixed the code to allow editing approved evaluations when mentor edit is enabled, **you must first enable it for this specific group**.

## Step-by-Step Solution

### Step 1: Login as Admin
1. Go to admin dashboard
2. Navigate to **Evaluation Form Submissions** tab

### Step 2: Select the Form
1. In the dropdown, select: **TY Review-2 (Technical)**
2. Wait for submissions to load

### Step 3: Find the Toggle Button
1. Scroll down to the evaluation submissions table
2. Look for group **TYCC203** in the table
3. You should see a toggle button in the **first row** of each group
4. The toggle will be **OFF** (gray/disabled state)

### Step 4: Enable Mentor Edit
1. Click the toggle button for group TYCC203
2. A confirmation dialog will appear:
   - Title: "Enable Mentor Editing"
   - Message: "Enable mentor editing for group TYCC203? The mentor assigned to this group will be able to edit marks."
3. Click **"Enable"**
4. You should see a success message: "Mentor editing enabled for group TYCC203."
5. The toggle should now be **ON** (green/enabled state)

### Step 5: Verify as Mentor
1. Logout from admin
2. Login as the mentor assigned to TYCC203
3. Go to Mentor Evaluation page
4. Select form: **TY Review-2 (Technical)**
5. Select group: **TYCC203**
6. You should now see: **"✓ Mentor edit enabled (overrides approval). You can update marks."**
7. All input fields should be **editable**

### Step 6: Mentor Updates Marks
1. Edit the marks as needed
2. Click **"Update Evaluation"** button
3. You should see: "✓ Evaluation updated. Editing auto-disabled."
4. The toggle will automatically turn **OFF** in admin dashboard
5. Mentor can no longer edit (until admin enables it again)

## Important Notes

### Toggle Location
The toggle button appears in the **Group ID column** of the evaluation submissions table. It's shown only once per group (on the first student row) and spans multiple rows using `rowSpan`.

### Toggle States
- **OFF (Gray)**: Mentor cannot edit
- **ON (Green)**: Mentor can edit (even if approved)
- **Loading**: Shows spinner while toggling

### Auto-Disable Feature
After the mentor successfully updates marks, the system **automatically disables** mentor edit for that group. This prevents multiple edits. If you need the mentor to edit again, you must enable it again from admin dashboard.

### Approval Status
When mentor edit is enabled, the approval status is **ignored**. This means:
- ✅ Mentor can edit approved evaluations
- ✅ Mentor can edit unapproved evaluations
- ✅ Approval status remains unchanged after mentor updates

## Troubleshooting

### "Toggle button not visible"
**Solution**: Make sure you're viewing the correct evaluation form. The toggle only appears for forms where you have `evaluation_form_submission` permission.

### "Toggle is ON but mentor still can't edit"
**Solution**: 
1. Mentor should refresh the page
2. Check if mentor is assigned to that group in PBL table
3. Verify form has "mentor" in `submit_roles` array

### "After clicking toggle, nothing happens"
**Solution**:
1. Check browser console for errors (F12)
2. Verify you have admin permissions
3. Check if database has `mentor_edit_enabled_groups` column

### "Toggle turns OFF immediately after enabling"
**Solution**: This is normal if the mentor has already submitted marks. The system auto-disables after submission.

## Database Check (For Developers)

To verify the toggle worked, run this SQL query:

\`\`\`sql
SELECT 
  id, 
  name, 
  mentor_edit_enabled_groups 
FROM evaluation_forms 
WHERE name = 'TY Review-2 (Technical)';
\`\`\`

After enabling for TYCC203, you should see:
\`\`\`
mentor_edit_enabled_groups: ['TYCC203']
\`\`\`

After mentor updates, it should be:
\`\`\`
mentor_edit_enabled_groups: []
\`\`\`

## API Endpoints Used

### Enable Mentor Edit
\`\`\`
PATCH /api/admin/evaluation-forms/:formId/toggle-mentor-edit
Body: { groupId: "TYCC203", enabled: true }
\`\`\`

### Submit Evaluation (Auto-Disables)
\`\`\`
POST /api/mentors/evaluation-forms/:formId/submit
Body: { group_id: "TYCC203", evaluations: [...] }
\`\`\`

## Summary

The feature is working correctly. You just need to:
1. **Admin**: Enable the toggle for group TYCC203
2. **Mentor**: Refresh and edit marks
3. **System**: Auto-disables after mentor updates

The message "✗ Evaluation approved. Editing disabled." is correct because **mentor edit is not enabled yet**. Once you enable it, the message will change to "✓ Mentor edit enabled (overrides approval)."

---

**Status**: ✅ FEATURE WORKING - JUST NEEDS TO BE ENABLED
**Date**: 2025
**Developer**: Amazon Q
