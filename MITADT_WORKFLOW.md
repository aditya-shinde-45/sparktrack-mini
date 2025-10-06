# MITADT External Login Workflow

## Overview
MITADT is a special external login for PBL Review 2 that allows evaluation of groups based on mentor assignments rather than class assignments. This is a common login shared by all Review 2 external evaluators.

## Login Credentials
- **External ID**: `MITADT`
- **Password**: `MITADT1230`

## Workflow Steps

### 1. Login
- Navigate to the login page
- Select role: **External**
- Enter External ID: `MITADT`
- Enter Password: `MITADT1230`
- Click Login

### 2. Mentor Selection & External Evaluator Details
After successful login, MITADT users are redirected to the **Mentor Selection** page instead of directly to the evaluation page.

**Features:**
- **Enter External Evaluator Information** (required once per session):
  - External 1 Name (Required) - Primary evaluator name
  - External 2 Name (Optional) - Secondary evaluator name
  - Organization Name (Optional) - Organization affiliation
  - These details are stored and automatically filled in all evaluation forms
- View complete list of all mentors with contact numbers
- Select a mentor from the dropdown
- View mentor list in a searchable table
- Click on any mentor row to select them

### 3. Group Evaluation
Once a mentor is selected:
- System fetches all groups assigned to that mentor
- User is redirected to External Home with the mentor's groups
- A purple info banner shows the selected mentor name
- "Change Mentor" button allows switching to a different mentor

### 4. Evaluation Process
- Select a group from the sidebar (these are the selected mentor's groups)
- Fill out PBL Review 2 evaluation form (7 marks fields: A-G)
- **Note:** For SY (Second Year) groups, only 6 fields are shown (A-D, F-G)
- Submit evaluation

### 5. Switching Mentors
At any time, click the **"Change Mentor"** button to:
- Clear current mentor selection
- Return to Mentor Selection page
- Choose a different mentor
- Load that mentor's groups

## Technical Implementation

### Frontend Components
1. **MentorSelection.jsx** (`reviewpannel-frontend/src/Pages/External/`)
   - Displays list of mentors
   - Handles mentor selection
   - Fetches mentor's groups
   - Stores selection in localStorage

2. **Login.jsx** (`reviewpannel-frontend/src/Pages/Common/`)
   - Detects MITADT login
   - Redirects to mentor selection instead of external home

3. **ExternalHome.jsx** (`reviewpannel-frontend/src/Pages/External/`)
   - Shows selected mentor info banner for MITADT
   - Provides "Change Mentor" button
   - Displays groups from localStorage

### Backend Endpoints

#### 1. Get All Mentors
```
GET /api/external-auth/mentors
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mentors": [
      {
        "mentor_name": "Dr. John Smith",
        "contact_number": "1234567890"
      },
      ...
    ]
  }
}
```

#### 2. Get Groups by Mentor
```
GET /api/external-auth/mentor-groups?mentor_name=<MENTOR_NAME>
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "groups": ["TY2A-1", "TY2A-2", "FY2A-3"],
    "mentor": "Dr. John Smith"
  }
}
```

#### 3. Submit PBL Review 2 Evaluation
```
POST /api/evaluation/save-evaluation
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "group_id": "TY2A-1",
  "evaluations": [
    {
      "roll_no": "12345",
      "A": 5,
      "B": 5,
      "C": 5,
      "D": 5,
      "E": 10,
      "F": 5,
      "G": 15,
      "total": 50,
      "feedback": "Good work"
    }
  ]
}
```

### Database Structure

#### mentors Table
```sql
mentor_name VARCHAR(255)
contact_number VARCHAR(20)
group_ids TEXT[] -- Array of group IDs
```

#### pbl2 Table (Review 2 Evaluations)
```sql
id SERIAL PRIMARY KEY
roll_no VARCHAR(50)
name VARCHAR(255)
group_id VARCHAR(50)
ig VARCHAR(50)
m1 VARCHAR(10) -- Maps to field A
m2 VARCHAR(10) -- Maps to field B
m3 VARCHAR(10) -- Maps to field C
m4 VARCHAR(10) -- Maps to field D
m5 VARCHAR(10) -- Maps to field E
m6 VARCHAR(10) -- Maps to field F
m7 VARCHAR(10) -- Maps to field G
total VARCHAR(10)
feedback TEXT
external1 VARCHAR(255)
external2 VARCHAR(255)
```

### LocalStorage Keys

#### For MITADT Login:
- `token`: JWT authentication token
- `role`: "external"
- `name`: Display name (e.g., "PBL REVIEW 2")
- `external_id`: "MITADT" (used for identification)
- `selected_mentor`: Name of selected mentor
- `groups`: JSON array of mentor's assigned groups
- `external1_name`: Name of first external evaluator (auto-filled in forms)
- `external2_name`: Name of second external evaluator (auto-filled in forms)
- `organization_name`: Organization name (auto-filled in forms)

## Special Handling

### For Second Year (SY) Groups
- Only 6 marks fields shown (A-D, F-G)
- Field E is hidden
- Max marks adjusted:
  - Field C: 15 (vs 5 for TY/FY)
  - Field F: 10 (vs 5 for TY/FY)
- Total still adds up to 50

### Absent Students
- Mark student as "AB" (Absent)
- Database stores "AB" in m1-m7 fields
- Total shows "AB"

## Security
- All mentor and group endpoints require JWT authentication
- Only authenticated external users can access mentor selection
- Non-MITADT external users follow normal class-based assignment workflow

## Differences from Regular External Login
| Feature | Regular External | MITADT External |
|---------|------------------|-----------------|
| Login | Individual credentials | Common login (MITADT) |
| Group Assignment | By Year/Class | By Mentor |
| Workflow | Direct to groups | Mentor selection first |
| Groups Source | `externals` table | `mentors` table |
| Flexibility | Fixed assignment | Can switch mentors |

## Testing Checklist
- [ ] Login with MITADT credentials works
- [ ] Redirected to mentor selection page
- [ ] External evaluator form shows correctly with all 3 fields
- [ ] External 1 Name is required (cannot proceed without it)
- [ ] External 2 and Organization fields are optional
- [ ] All mentors displayed correctly in dropdown and table
- [ ] Can select a mentor from dropdown
- [ ] Can select a mentor by clicking table row
- [ ] Groups fetched for selected mentor
- [ ] Redirected to External Home with groups
- [ ] Mentor info banner shows selected mentor
- [ ] External evaluator names pre-filled in evaluation form
- [ ] Organization name pre-filled in Reviewers table
- [ ] Both External 1 and External 2 names shown in Reviewers table
- [ ] Can evaluate groups normally
- [ ] "Change Mentor" button works
- [ ] Can switch between different mentors
- [ ] External evaluator details persist when switching groups
- [ ] SY groups show only 6 fields
- [ ] TY/FY groups show all 7 fields
- [ ] Evaluations save correctly to pbl2 table

## Future Enhancements
1. Add search functionality for mentors
2. Show group count for each mentor
3. Add mentor profile information
4. Track evaluation progress per mentor
5. Export evaluations by mentor
