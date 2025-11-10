# SparkTrack - Project Based Learning Management System

<div align="center">
  <h3>MIT ADT University, Pune</h3>
  <p>A comprehensive web-based platform for managing Project-Based Learning (PBL) evaluations, student groups, and academic assessments.</p>
  
  [![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
</div>

---

## 📋 Overview

SparkTrack is designed specifically for MIT ADT University to streamline the Project-Based Learning evaluation process. The system facilitates:

- **Multi-tier evaluations** across three PBL review cycles
- **Role-based access control** for administrators, mentors, students, and external evaluators
- **Automated group management** and student allocation
- **Digital evaluation forms** with real-time validation
- **External evaluator registration** with email verification
- **Draft saving functionality** for incomplete evaluations
- **Comprehensive reporting** and analytics

---

## 🎯 Key Features

### For Administrators
- User management (students, mentors, external evaluators)
- Deadline configuration for PBL reviews
- Group allocation and editing
- Class lead assignment
- System-wide announcements
- Role and permission management

### For Mentors
- View assigned student groups
- Conduct PBL evaluations (Review 1, 2, 3)
- Register external evaluators
- Save evaluation drafts
- Track student progress
- Submit consolidated assessments

### For External Evaluators
- Secure access to assigned groups
- Digital evaluation forms
- Real-time collaboration with mentors
- Automated email notifications

### For Students
- View project details
- Track evaluation status
- Access mentor feedback
- Group management

---

## 🏗️ Architecture

```
Frontend (React + Tailwind CSS)
         ↓
   API Gateway (Express.js)
         ↓
   Authentication (JWT)
         ↓
   Supabase (PostgreSQL + Storage)
```

---

## 🚀 Technology Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **React Router v6** - Navigation
- **Lucide Icons** - Icon library
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **JWT** - Authentication
- **Nodemailer** - Email service

### Database & Storage
- **Supabase** - PostgreSQL database
- **Supabase Storage** - File management

---

## 📁 Project Structure

```
sparktrack-mini/
├── reviewpannel-frontend/           # React application
│   ├── src/
│   │   ├── Components/
│   │   │   ├── Admin/              # Admin components
│   │   │   ├── Common/             # Shared components
│   │   │   ├── External/           # External evaluator forms
│   │   │   ├── Mentor/             # Mentor components
│   │   │   └── Student/            # Student components
│   │   ├── Pages/                  # Page components
│   │   ├── api.js                  # API configuration
│   │   └── App.jsx                 # Root component
│   └── package.json
│
├── reviewpanel-backend/            # Node.js API
│   ├── controller/                 # Business logic
│   ├── routes/                     # API routes
│   ├── middleware/                 # Auth & validation
│   ├── config/                     # Configuration
│   └── server.js                   # Entry point
│
└── README.md
```

---

## ⚡ Installation & Setup

### Prerequisites
- Node.js v18 or higher
- npm or yarn package manager
- Supabase account (for database)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ideabliss/sparktrack-mini.git
   cd sparktrack-mini/reviewpanel-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env` file:
   ```env
   PORT=5000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   JWT_SECRET=your_secure_jwt_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../reviewpannel-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Create `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   Application will run on `http://localhost:5173`

---

## 📊 Database Schema

### Core Tables
- `students` - Student information and profiles
- `mentors` - Mentor/faculty details
- `groups` - Project groups and team allocation
- `pbl_review_1` - First evaluation records
- `pbl_review_2` - Second evaluation records
- `pbl_review_3` - Third evaluation records
- `external_evaluators` - External reviewer information
- `admin_users` - System administrators

---

## 🔐 Authentication Flow

```
User Login → JWT Token Generation → Role-Based Access
                                    ↓
                     ┌──────────────┼──────────────┐
                     ↓              ↓              ↓
                  Admin          Mentor        External
```

**Supported Roles:**
- Administrator
- Mentor/Faculty
- External Evaluator
- Student

---

## 🎓 PBL Evaluation Workflow

### Review 1 (Initial Evaluation)
- Problem definition assessment
- Team formation review
- Initial proposal evaluation

### Review 2 (Mid-term Progress)
- Progress tracking (50 marks)
- Technical implementation review
- Meeting documentation (Google Meet/Zoom)
- Screenshot verification
- Copyright/Patent/Research paper status

### Review 3 (Final Assessment)
- Final project evaluation (50 marks)
- Technical expertise assessment
- Project report review
- Presentation and communication
- Overall project completion

---

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/admin/login
POST   /api/auth/mentor/login
POST   /api/auth/student/login
POST   /api/auth/external/login
POST   /api/auth/logout
```

### PBL Evaluations
```
GET    /api/pbl3/mentor/groups
GET    /api/pbl3/evaluation/:groupId
POST   /api/pbl3/evaluation/save
POST   /api/pbl3/send-external-otp
POST   /api/pbl3/verify-external-otp
```

### Administration
```
GET    /api/students
POST   /api/admin/create-user
PUT    /api/admin/edit-user/:id
DELETE /api/admin/delete-user/:id
GET    /api/deadlines
PUT    /api/deadlines/update
```

---

## 🚀 Deployment

### Production Backend (Render)
```bash
Build Command: npm install
Start Command: npm start
Environment Variables: Configure in Render dashboard
```

### Production Frontend (Vercel)
```bash
Build Command: npm run build
Output Directory: dist
Environment Variables: VITE_API_BASE_URL=your_production_backend_url
```

---

## 🔧 Configuration

### Deadline Management
Administrators can control evaluation periods:
- PBL Review 1 deadline
- PBL Review 2 deadline
- PBL Review 3 deadline
- Standard evaluation deadline

### Email Notifications
Automatic email notifications for:
- External evaluator registration
- OTP verification
- Evaluation submissions
- Deadline reminders

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For issues, questions, or suggestions:
- **Email:** support@mituniversity.edu.in
- **GitHub Issues:** [Create an issue](https://github.com/ideabliss/sparktrack-mini/issues)

---

## 🏫 About MIT ADT University

MIT ADT University, Pune is a leading educational institution committed to academic excellence and innovation. The SparkTrack system supports the university's Project-Based Learning initiatives, promoting hands-on learning and industry collaboration.

---

<div align="center">
  <p><strong>Developed for MIT ADT University, Pune</strong></p>
  <p>Version 1.0 | © 2024-2025 MIT ADT University</p>
</div>
