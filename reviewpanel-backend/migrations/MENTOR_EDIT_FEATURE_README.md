# Mentor Edit Permission Feature

## Overview
This feature allows subadmins to toggle whether mentors can edit marks after submission for specific evaluation forms.

## Database Changes

### Migration File
Run the migration: `add_mentor_edit_enabled_to_evaluation_forms.sql`

This adds a new column to the `evaluation_forms` table:
- `mentor_edit_enabled` (BOOLEAN, default: false)

### How to Run Migration
```bash
cd reviewpanel-backend
node run-migration.js migrations/add_mentor_edit_enabled_to_evaluation_forms.sql
```

## API Endpoints

### Toggle Mentor Edit Permission
**Endpoint:** `PATCH /api/admin/evaluation-forms/:formId/toggle-mentor-edit`

**Access:** Admin/SubAdmin with `evaluation_form_submission` permission

**Request Body:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mentor edit enabled successfully",
  "data": {
    "id": "form-id",
    "name": "Form Name",
    "mentor_edit_enabled": true
  }
}
```

### Mentor Update Marks (When Enabled)
**Endpoint:** `PUT /api/mentors/evaluation-forms/:formId/submissions/:submissionId/students/:enrollmentNo`

**Access:** Mentor/Industry Mentor (only when `mentor_edit_enabled` is true)

**Request Body:**
```json
{
  "marks": {
    "field1": 10,
    "field2": 8,
    "field3": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student marks updated successfully",
  "data": {
    "submission_id": "sub-id",
    "group_id": "GROUP001",
    "enrollment_no": "2021001",
    "student_name": "John Doe",
    "marks": { "field1": 10, "field2": 8, "field3": true },
    "total": 18
  }
}
```

## Frontend Changes

### SubAdminDashboard
- Added toggle button next to "Edit Enabled" badge
- Shows "Mentor Edit: ON/OFF" status
- Click to toggle mentor editing permission
- Confirmation dialog before toggling

### UI Flow
1. Subadmin selects an evaluation form
2. Sees current mentor edit status (ON/OFF)
3. Clicks toggle button
4. Confirms action in dialog
5. Status updates immediately

## How It Works

### For Subadmins:
1. Navigate to SubAdmin Dashboard
2. Select "evaluation_form_submission" table
3. Choose an evaluation form from dropdown
4. Click "Mentor Edit: OFF" button to enable
5. Mentors can now edit marks for that form

### For Mentors:
1. When mentor edit is **DISABLED** (default):
   - Mentors can only view submitted marks
   - Cannot modify marks after submission
   
2. When mentor edit is **ENABLED**:
   - Mentors can edit marks in their evaluation forms
   - Can update individual student marks
   - Changes are validated and saved to database

## Security

- Only admins/subadmins with `evaluation_form_submission` permission can toggle
- Mentors can only edit marks for groups they have access to
- All mark updates are validated against field constraints
- Audit trail maintained through submission timestamps

## Default Behavior

- New evaluation forms have `mentor_edit_enabled = false` by default
- Mentors can submit evaluations but cannot edit after submission
- Subadmins must explicitly enable editing for each form

## Use Cases

1. **Review Period Extension**: Enable editing when mentors need to correct mistakes
2. **Continuous Assessment**: Keep editing enabled for ongoing evaluations
3. **Final Lock**: Disable editing after review period ends
4. **Selective Access**: Enable only for specific forms that need flexibility
