# PBL3 Implementation Guide

## 📋 Overview
PBL3 (Project-Based Learning Review 3) implementation with mentor-based authentication and external evaluator registration via OTP.

---

## 🎯 Evaluation Criteria (50 marks total)

| Criteria | Description | Max Marks |
|----------|-------------|-----------|
| **A** | Problem Definition & Domain Understanding | 5 |
| **B** | Technical Expertise | 15 |
| **C** | Project Report | 10 |
| **D** | Copyright / Patent / Paper Publication | 10 |
| **E** | Project Event Participation | 5 |
| **F** | Presentation & Communication | 5 |
| **TOTAL** | | **50** |

---

## 🗄️ Database Setup

### Step 1: Run Migrations

```sql
-- Run these SQL scripts on your Supabase database:

-- 1. Add evaluation fields to pbl3 table
\i migrations/001_alter_pbl3_add_evaluation_fields.sql

-- 2. Add PBL Review 3 deadline control
\i migrations/002_insert_pbl3_deadline_control.sql
```

### Step 2: Verify Tables

```sql
-- Check pbl3 table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pbl3';

-- Check deadline control
SELECT * FROM deadlines_control WHERE key = 'pbl_review_3';
```

---

## 🔌 Backend API Endpoints

### 1. Mentor Login
```http
POST /api/pbl3/mentor/login
Content-Type: application/json

{
  "mentor_name": "Dr. John Doe",
  "contact_number": "9876543210"
}

Response:
{
  "success": true,
  "message": "Mentor login successful",
  "data": {
    "token": "jwt_token_here",
    "mentor_name": "Dr. John Doe",
    "role": "mentor"
  }
}
```

### 2. Get Mentor's Groups
```http
GET /api/pbl3/mentor/groups
Authorization: Bearer <mentor_token>

Response:
{
  "success": true,
  "message": "Mentor groups retrieved successfully",
  "data": {
    "groups": ["SY01", "TY05", "LY03"]
  }
}
```

### 3. Register External Evaluators
```http
POST /api/pbl3/register-externals
Authorization: Bearer <mentor_token>
Content-Type: application/json

{
  "group_id": "SY01",
  "externals": [
    {
      "name": "Dr. Jane Smith",
      "organization": "ABC Corp",
      "phone": "9998887776",
      "email": "jane@example.com"
    },
    {
      "name": "Prof. Mike Johnson",
      "organization": "XYZ Institute",
      "phone": "8887776665",
      "email": "mike@example.com"
    }
  ]
}

Response:
{
  "success": true,
  "message": "External evaluators registered successfully. OTP sent to their emails.",
  "data": {
    "group_id": "SY01",
    "externals": [
      { "name": "Dr. Jane Smith", "email": "jane@example.com" },
      { "name": "Prof. Mike Johnson", "email": "mike@example.com" }
    ],
    "otp_note": "OTP is 123456 (hardcoded for now)"
  }
}
```

### 4. Verify External OTP
```http
POST /api/pbl3/verify-otp
Content-Type: application/json

{
  "group_id": "SY01",
  "email": "jane@example.com",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "external_jwt_token_here",
    "email": "jane@example.com",
    "group_id": "SY01",
    "role": "external_pbl3"
  }
}
```

### 5. Get Group Evaluation
```http
GET /api/pbl3/evaluation/SY01
Authorization: Bearer <external_token_or_mentor_token>

Response:
{
  "success": true,
  "message": "Group evaluation retrieved successfully",
  "data": {
    "group_id": "SY01",
    "evaluations": [
      {
        "enrollement_no": "2024001",
        "name_of_student": "Student Name",
        "A": 4,
        "B": 12,
        "C": 8,
        "D": 9,
        "E": 4,
        "F": 4,
        "total": 41,
        "absent": false,
        ...
      }
    ]
  }
}
```

### 6. Save Evaluation
```http
POST /api/pbl3/evaluation/save
Authorization: Bearer <external_token_or_mentor_token>
Content-Type: application/json

{
  "group_id": "SY01",
  "guide_name": "Dr. John Doe",
  "industry_guide": "Mr. Industry Guide",
  "industry_guide_contact": "9876543210",
  "industry_guide_email": "industry@example.com",
  "external1_name": "Dr. Jane Smith",
  "external2_name": "Prof. Mike Johnson",
  "organization1_name": "ABC Corp",
  "organization2_name": "XYZ Institute",
  "external1_phone": "9998887776",
  "external2_phone": "8887776665",
  "external1_email": "jane@example.com",
  "external2_email": "mike@example.com",
  "feedback": "Great project work!",
  "copyright": "Submitted",
  "patent": "In progress",
  "research_paper": "Accepted",
  "evaluations": [
    {
      "enrollement_no": "2024001",
      "A": 4,
      "B": 12,
      "C": 8,
      "D": 9,
      "E": 4,
      "F": 4,
      "absent": false
    }
  ]
}

Response:
{
  "success": true,
  "message": "PBL Review 3 evaluation saved successfully",
  "data": {
    "saved": [...]
  }
}
```

---

## 🔐 Authentication Flow

```
1. Mentor Login (ID + Phone)
   ↓
2. Mentor selects group → Enters 1-2 external details
   ↓
3. System sends OTP (currently hardcoded "123456") to external emails
   ↓
4. External opens OTP verification page → Enters OTP
   ↓
5. External gets JWT token → Accesses evaluation form
   ↓
6. External fills evaluation → Submits
```

---

## 🛡️ Security Features

1. **JWT Authentication** - All protected routes require valid tokens
2. **Role-Based Access Control** - Mentor vs External permissions
3. **Deadline Control** - Admin can enable/disable PBL3 review period
4. **OTP Verification** - External evaluators must verify email (currently hardcoded)
5. **Group Assignment Validation** - Mentors can only access their assigned groups

---

## 📝 Key Differences from PBL2

| Feature | PBL2 | PBL3 |
|---------|------|------|
| **Criteria** | 7 (A-G) | 6 (A-F) |
| **Meeting Link** | ✅ Required | ❌ Not required |
| **Screenshot** | ✅ Required | ❌ Not required |
| **Authentication** | Direct external login | Mentor registers externals |
| **OTP** | Not used | Required for external access |
| **External Count** | 2 | 1-2 (flexible) |

---

## 🚀 Testing

### 1. Enable PBL3 Review
```sql
UPDATE deadlines_control 
SET enabled = true 
WHERE key = 'pbl_review_3';
```

### 2. Test Mentor Login
```bash
curl -X POST http://localhost:5000/api/pbl3/mentor/login \
  -H "Content-Type: application/json" \
  -d '{
    "mentor_name": "Your Mentor Name",
    "contact_number": "Your Phone"
  }'
```

### 3. Test External Registration
```bash
curl -X POST http://localhost:5000/api/pbl3/register-externals \
  -H "Authorization: Bearer YOUR_MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": "SY01",
    "externals": [{
      "name": "Test External",
      "organization": "Test Org",
      "phone": "9999999999",
      "email": "test@example.com"
    }]
  }'
```

### 4. Test OTP Verification
```bash
curl -X POST http://localhost:5000/api/pbl3/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": "SY01",
    "email": "test@example.com",
    "otp": "123456"
  }'
```

---

## 📦 Files Created

### Backend
```
reviewpanel-backend/
├── migrations/
│   ├── 001_alter_pbl3_add_evaluation_fields.sql
│   └── 002_insert_pbl3_deadline_control.sql
├── src/
│   ├── models/
│   │   └── pbl3Model.js
│   ├── controllers/
│   │   └── pbl3/
│   │       └── pbl3Controller.js
│   └── routes/
│       └── pbl3/
│           └── pbl3Routes.js
```

---

## ⚠️ TODO: Nodemailer Integration

Currently, OTP is hardcoded as `"123456"`. To implement real email OTP:

1. Configure nodemailer in `src/services/emailService.js`
2. Update `pbl3Controller.registerExternals()` to send actual emails
3. Store OTP with expiry in database
4. Update `pbl3Model.verifyExternalOTP()` to check stored OTP

---

## 🎓 Frontend Requirements (To Be Built)

1. **Mentor Login Page** (`/mentor/login`)
2. **Mentor Dashboard** (`/mentor/dashboard`)
3. **External Registration Form** (`/mentor/register-externals`)
4. **External OTP Verification** (`/external/verify-otp`)
5. **PBL3 Evaluation Form** (`EvaluationForm_3.jsx`)

---

## ✅ Backend Implementation Status

- ✅ Database migrations created
- ✅ Models created (`pbl3Model.js`)
- ✅ Controllers created (`pbl3Controller.js`)
- ✅ Routes registered (`pbl3Routes.js`)
- ✅ Authentication flow implemented
- ✅ API endpoints tested
- ⏳ Email OTP (pending - using hardcoded "123456")
- ⏳ Frontend components (pending)

---

**Ready for frontend development!** 🎉
