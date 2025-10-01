# SparkTrack Mini - PBL Management System

<div align="center">
  <p>
    A modern web application for managing Project-Based Learning (PBL) in educational institutions. Features role-based authentication, group management, and project tracking.
  </p>
</div>

---

## 🚀 Features

### Authentication & User Management
- **Multi-role JWT authentication** (Admin, Mentor, Student, External)
- **Admin Dashboard** - User management with editable tables
- **Mentor Panel** - View assigned groups and manage students
- **Project Tracking** - Monitor project progress and milestones
- **External User Access** - Secure login with limited group access

### Core Functionality
- **Group Management** - Create, join, and manage PBL groups
- **Project Management** - Track project phases, deadlines, and deliverables
- **Student Directory** - Searchable directory with advanced filtering
- **File Management** - Resume uploads and profile picture support
- **Request System** - Group join requests with approval workflow

---

## 🛠 Tech Stack

- **Frontend:** React 18, Tailwind CSS, React Router v6
- **Backend:** Node.js, Express.js, JWT Authentication
- **Database:** Supabase (PostgreSQL) with file storage
- **Deployment:** Render (Backend), Vercel (Frontend)

---

## 🏗 Project Structure

```
sparktrack-mini/
├── reviewpannel-frontend/     # React application
│   ├── src/Components/        # Reusable components
│   ├── src/Pages/            # Page components
│   └── src/api.js            # API configuration
├── reviewpanel-backend/      # Node.js API
│   ├── controller/           # Route controllers
│   ├── routes/              # API routes
│   └── middleware/          # Auth & validation
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- Supabase account

### Installation

1. **Clone & setup backend**
   ```bash
   git clone https://github.com/ideabliss/sparktrack-mini.git
   cd sparktrack-mini/reviewpanel-backend
   npm install
   ```

2. **Environment variables** (`.env`)
   ```bash
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   JWT_SECRET=your_jwt_secret
   ```

3. **Start backend**
   ```bash
   npm start
   ```

4. **Setup frontend**
   ```bash
   cd ../reviewpannel-frontend
   npm install
   npm run dev
   ```

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/{role}/login` - Login (admin/mentor/student/external)
- `POST /api/auth/logout` - Logout

### Core Features
- `GET /api/students` - Get all students
- `GET /api/pbl/gp/:enrollment` - Get group details
- `POST /api/student/upload/resume` - Upload resume
- `GET /api/admin/external-users` - Manage external users

---

## 🎨 Key Components

- **ProjectTracking** - Monitor project progress and milestone tracking
- **ProjectManagement** - Manage project timelines, tasks, and deliverables
- **GroupDetails** - Group member display with profile modals
- **StudentDirectory** - Searchable student listing
- **UserManagement** - Admin dashboard for user operations
- **ExternalUserTable** - Editable table for external user management

---

## 🚀 Deployment

### Backend (Render)
```bash
# Build: npm install
# Start: npm start
# Environment variables: Set in Render dashboard
```

### Frontend (Vercel)
```bash
# Build: npm run build
# Environment: VITE_API_BASE_URL_PROD=your_backend_url
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for educational institutions</p>
  
  [![GitHub Issues](https://img.shields.io/github/issues/ideabliss/sparktrack-mini)](https://github.com/ideabliss/sparktrack-mini/issues)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>
