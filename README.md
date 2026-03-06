# 🚀 SparkTrack  
### Project-Based Learning (PBL) Management System  
**MIT ADT University, Pune-412201 Loni Kalbhorr**

<div align="center">

A cloud-enabled, role-based academic workflow system built to digitize and automate the complete PBL lifecycle across multiple evaluation cycles.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![Architecture](https://img.shields.io/badge/Architecture-RBAC%20%7C%20JWT%20%7C%20REST-orange.svg)

</div>

---

## 📌 Overview

SparkTrack is a production-grade web application developed for MIT ADT University to streamline Project-Based Learning (PBL) evaluations across Review 1, Review 2, and Review 3.

The system replaces manual evaluation processes with a secure, automated, and scalable cloud-based workflow platform.

---

## 🎯 Core Objectives

- Digitize multi-cycle PBL evaluations
- Implement secure Role-Based Access Control (RBAC)
- Automate external evaluator onboarding
- Enforce deadline-based submission control
- Provide centralized academic reporting
- Improve transparency between students and faculty

---

## 🔥 Key Features

### 👨‍💼 Administrator
- Create and manage users (Students, Mentors, External Evaluators)
- Assign groups and class leads
- Configure evaluation deadlines
- Broadcast system announcements
- Manage role permissions

### 👨‍🏫 Mentor
- View assigned project groups
- Conduct Review 1, 2, 3 evaluations
- Save draft evaluations
- Invite external evaluators via email OTP
- Submit final consolidated marks

### 👨‍🎓 Student
- View group allocation
- Track evaluation progress
- Access mentor feedback
- Monitor review status

### 🌍 External Evaluator
- Secure OTP-based login
- Access assigned group evaluations
- Submit digital assessment forms
- Collaborate with mentors

---

## 🏗️ System Architecture

```
React + Tailwind (Frontend)
        ↓
Express.js REST API
        ↓
JWT Authentication Middleware
        ↓
Supabase (PostgreSQL + Storage)
        ↓
Email + OTP Service
```

---

## 🛡 Security Implementation

- JWT-based authentication
- Role-based route protection (RBAC)
- OTP verification for external evaluators
- Deadline-based submission restrictions
- Environment-based secret management
- Secure API middleware architecture

---

## 🧠 Engineering Concepts Used

- RESTful API Design
- Middleware Pattern
- Modular Backend Structure
- Token-based Authentication
- Role-Based Access Control
- Cloud Deployment Practices
- Draft-based Data Persistence
- Production Environment Configuration

---

## 🚀 Technology Stack

### Frontend
- React 18
- Tailwind CSS
- React Router v6
- Axios
- Vite

### Backend
- Node.js
- Express.js
- JWT
- Nodemailer
- Supabase SDK

### Database & Storage
- Supabase PostgreSQL
- Supabase Storage

### Deployment
- Backend: Render
- Frontend: Vercel
- Database: Supabase Cloud

---

## 📊 Database Schema (Core Tables)

- users
- groups
- group_members
- pbl_review_1
- pbl_review_2
- pbl_review_3
- deadlines
- announcements

---

## 🔄 PBL Evaluation Workflow

### Review 1
- Problem Definition
- Team Formation
- Initial Proposal Validation

### Review 2
- 50 Marks Mid-Term Evaluation
- Technical Progress Review
- Meeting Documentation Verification
- Research/Patent Status

### Review 3
- Final 50 Marks Assessment
- Technical Implementation Review
- Report Evaluation
- Presentation & Communication
- Final Consolidated Score Submission

---

## ⚙️ Installation Guide

### Backend Setup

```bash
git clone https://github.com/ideabliss/sparktrack-mini.git
cd reviewpanel-backend
npm install
npm start
```

Create `.env`:

```
PORT=5000
SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_secret
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password
```

---

### Frontend Setup

```bash
cd reviewpannel-frontend
npm install
npm run dev
```

Create `.env`:

```
VITE_API_BASE_URL=http://localhost:5000
```

---

## 📈 Impact

- Designed for 500+ academic users
- Reduced manual evaluation errors
- Enabled secure multi-role access
- Improved evaluation transparency
- Deployed in cloud production environment

---

## 🏫 About MIT ADT University

MIT ADT University, Pune is a premier institution focused on innovation-driven education. SparkTrack supports its Project-Based Learning model by digitizing academic evaluations and improving operational efficiency.

---

## 📝 License

This project is licensed under the MIT License.

---

<div align="center">

**Developed by StrawHats Team**  
Full Stack Developer | Cloud & DevOps Enthusiast  

© 2025 SparkTrack TEAM

</div>
