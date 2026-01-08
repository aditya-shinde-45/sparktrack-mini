# Final Year Zeroth Review Evaluation

## Overview
The Zeroth Review feature allows mentors to conduct and record the initial evaluation of final year PBL projects. This evaluation focuses on internship validation, project readiness assessment, and early-stage feedback.

## Features

### For Mentors
- Select assigned groups for evaluation
- Record student evaluation marks (5 categories × 5 marks = 25 total)
- Register industry experts for the review panel
- Document internship details for all group members
- Provide scope redefinition and suggestions for Phase-2
- Multiple internship entries per student (if applicable)

### Evaluation Categories
1. **Literature Survey** (5 marks)
2. **Status of Sem-7 Paper** (5 marks)
3. **Technical Readiness** (5 marks)
4. **In-depth Knowledge of Problem & Solution** (5 marks)
5. **Plan of Development (Tracker)** (5 marks)

**Total: 25 Marks**

## Database Schema

### Table: `internship_details`

#### New Columns Added:
```sql
- is_zeroth_review: BOOLEAN (Flag for zeroth review records)
- review_date: DATE (Date of evaluation)
- expert_name: VARCHAR(255) (Industry expert name)
- expert_phone: VARCHAR(20) (Expert contact number)
- expert_email: VARCHAR(255) (Expert email address)
- zeroth_review_marks: JSONB (Evaluation marks object)
- project_title: TEXT (Project title)
- scope_redefinition: TEXT (Scope and module suggestions)
- class: VARCHAR(50) (Student class, e.g., BE-A)
- location: VARCHAR(255) (Internship location)
- remark: VARCHAR(50) (Approval status)
```

#### Marks JSON Structure:
```json
{
  "literature_survey": 5,
  "status_sem7": 4,
  "technical_readiness": 5,
  "knowledge_problem": 4,
  "plan_development": 5,
  "total": 23
}
```

## API Endpoints

### Submit Zeroth Review
```
POST /api/mentors/zeroth-review/submit
Authorization: Bearer <mentor_token>

Body:
{
  "group_id": "GRP001",
  "project_id": "GRP001",
  "class": "BE-A",
  "date": "2026-01-08",
  "project_title": "AI-Based Healthcare System",
  "guide_name": "Dr. Smith",
  "scope_redefinition": "Focus on ML algorithms...",
  "expert_name": "Mr. John Doe",
  "expert_phone": "9876543210",
  "expert_email": "john@example.com",
  "students": [
    {
      "enrollment_no": "2021001",
      "roll_number": "21",
      "name": "Student Name",
      "marks": {
        "literature_survey": 5,
        "status_sem7": 4,
        "technical_readiness": 5,
        "knowledge_problem": 4,
        "plan_development": 5,
        "total": 23
      }
    }
  ],
  "internships": [
    {
      "enrollment_no": "2021001",
      "student_name": "Student Name",
      "company_name": "Tech Corp, Mumbai",
      "location": "Mumbai",
      "mode": "Online",
      "start_date": "2026-01-15",
      "end_date": "2026-06-15",
      "profile_task": "Full Stack Development",
      "remark": "Approved"
    }
  ]
}
```

### Get Zeroth Review by Group
```
GET /api/mentors/zeroth-review/:group_id
Authorization: Bearer <mentor_token>
```

### Get All Zeroth Reviews
```
GET /api/mentors/zeroth-review
Authorization: Bearer <mentor_token>
```

### Update Zeroth Review
```
PUT /api/mentors/zeroth-review/:group_id/:enrollment_no
Authorization: Bearer <mentor_token>
```

### Delete Zeroth Review
```
DELETE /api/mentors/zeroth-review/:group_id
Authorization: Bearer <mentor_token>
```

## Frontend Routes

- **Zeroth Review Page**: `/mentor/zeroth-review`
- **Sidebar Navigation**: Added "Zeroth Review" button with ClipboardCheck icon

## Implementation Details

### Frontend Component
- **Location**: `reviewpannel-frontend/src/Pages/Mentor/ZerothReview.jsx`
- **Features**:
  - Group selection dropdown
  - Dynamic student table with marks input
  - Industry expert details form
  - Internship details table (multiple entries per student)
  - Scope redefinition textarea
  - Form validation
  - Success/error messaging
  - Responsive design with Tailwind CSS

### Backend Controller
- **Location**: `reviewpanel-backend/src/controllers/mentor/zerothReviewController.js`
- **Features**:
  - Validates all required fields
  - Stores internship and evaluation data
  - Handles multiple internships per student
  - Updates existing records or creates new ones
  - Comprehensive error handling

### Routes
- **Location**: `reviewpanel-backend/src/routes/mentor/mentorRoutes.js`
- **Authentication**: JWT token verification required
- **Authorization**: Mentor role only

## Usage Workflow

1. **Mentor Login**: Mentor logs in with mobile number and password
2. **Navigate to Zeroth Review**: Click "Zeroth Review" in sidebar
3. **Select Group**: Choose a group from the dropdown
4. **Fill Basic Info**: Enter class, date, project title
5. **Evaluate Students**: Assign marks (0-5) for each category
6. **Add Expert Details**: Enter industry expert's name, phone, email
7. **Document Internships**: 
   - Add internship details for each student
   - Can add multiple internships per student
   - Specify company, location, dates, mode (Online/Offline)
   - Set approval status
8. **Scope Redefinition**: Provide suggestions for Phase-2
9. **Submit**: Review and submit the evaluation

## Database Migration

Run the migration script to add necessary columns:

```bash
# Connect to Supabase database
psql $DATABASE_URL

# Run migration
\i reviewpanel-backend/migrations/add_zeroth_review_columns.sql
```

Or execute through Supabase Dashboard SQL Editor.

## Validation Rules

- **Required Fields**:
  - Group selection
  - Class
  - Date
  - Project title
  - Expert name, phone, email
  
- **Marks**: Each category 0-5 (integer), total auto-calculated
- **Internship**: At least one internship per student recommended
- **Remark Options**: Pending, Approved, Not Approved

## UI Components

### Color Scheme
- Primary: Purple gradient (#7B74EF to #5D3FD3)
- Success: Green
- Error: Red
- Background: Light gray (#F9FAFB)

### Icons (Lucide React)
- ClipboardCheck: Page header
- Users: Group selection
- UserPlus: Expert details
- Building: Internships
- Save: Submit button
- Plus/X: Add/remove internship rows

## Security

- JWT authentication required
- Mentor role authorization
- Input validation on frontend and backend
- SQL injection prevention (parameterized queries)
- XSS protection (React auto-escaping)

## Future Enhancements

1. **PDF Export**: Generate evaluation report as PDF
2. **Email Notifications**: Send confirmation to expert
3. **Draft Saving**: Save incomplete evaluations
4. **File Upload**: Attach internship approval letters
5. **Analytics Dashboard**: View zeroth review statistics
6. **Approval Workflow**: Multi-level approval process
7. **Comments Section**: Add review panel comments
8. **Version History**: Track evaluation changes

## Troubleshooting

### Common Issues

1. **Group not loading**
   - Verify mentor has assigned groups
   - Check mentor authentication token
   - Ensure group exists in database

2. **Submission fails**
   - Check all required fields are filled
   - Verify expert email format
   - Check database connection

3. **Marks not calculating**
   - Ensure values are numbers (0-5)
   - Check JavaScript console for errors

## Support

For issues or questions, contact the development team or refer to:
- Main README: `/README.md`
- API Documentation: Backend routes file
- Database Schema: Migration script
