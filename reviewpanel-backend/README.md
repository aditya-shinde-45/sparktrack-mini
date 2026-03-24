# SparkTrack Backend API

## Overview
SparkTrack Backend is built using Express.js and follows the MVC (Model-View-Controller) architecture for better organization, maintainability,and scalability.

## Project Structure

```
reviewpanel-backend/
├── src/
│   ├── config/                  # Configuration files
│   │   ├── database.js          # Database connection (Supabase)
│   │   └── index.js             # Application configuration
│   ├── controllers/             # Controllers for business logic
│   │   ├── authController.js    # Authentication operations
│   │   ├── externalController.js # External evaluators operations
│   │   ├── mentorController.js  # Mentor operations
│   │   └── pblController.js     # PBL groups operations
│   ├── middleware/              # Middleware functions
│   │   └── authMiddleware.js    # Authentication middleware
│   ├── models/                  # Data models
│   │   ├── externalModel.js     # External evaluator model
│   │   ├── mentorModel.js       # Mentor model
│   │   ├── pblModel.js          # PBL group model
│   │   └── userModel.js         # User model
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js        # Authentication routes
│   │   ├── externalRoutes.js    # External evaluator routes
│   │   ├── mentorRoutes.js      # Mentor routes
│   │   └── pblRoutes.js         # PBL group routes
│   ├── services/                # Business logic services
│   ├── utils/                   # Utility functions
│   │   ├── apiResponse.js       # Standardized API responses
│   │   └── errorHandler.js      # Error handling utilities
│   └── server.js                # Express server setup
├── uploads/                     # Uploaded files
├── .env                         # Environment variables
├── .gitignore                   # Git ignore 
├── index.js                     # Application entry point
├── package.json                 # Dependencies and scripts
└── README.md                    # Project documentation
```

## MVC Architecture

### Models (src/models)
- Handle data and business logic
- Interface with the database (Supabase)
- Return data to controllers

### Controllers (src/controllers)
- Handle HTTP requests
- Use models to retrieve data
- Return responses to clients

### Views (Frontend)
- In this architecture, the frontend (reviewpannel-frontend) acts as the view layer

## Key Components

### Middleware
- Authentication and authorization
- Error handling
- Request logging

### Utils
- Standardized API responses
- Error handling utilities
- Async handler for cleaner controller code

## Getting Started

### Installation
```bash
npm install
```

### Configuration
Create a `.env` file in the root directory with the following variables:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
CORS_ALLOWED_ORIGINS=https://your-frontend.example.com,http://localhost:5173

# Administrator credentials (choose one approach)
ADMIN_USERS_JSON=[{"id":1,"username":"admin@example.com","passwordHash":"$2a$12$hashGoesHere","role":"admin"}]
# or
ADMIN_DEFAULT_USERNAME=admin@example.com
ADMIN_DEFAULT_PASSWORD=change_me
ADMIN_DEFAULT_ROLE=admin

# Optional rate-limiter tuning
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300
```

> **Security note:** `JWT_SECRET` and administrator credentials are required at runtime. The server will refuse to boot if they are missing.

### Running the Server
Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get token
- `POST /api/auth/validate` - Validate token
- `GET /api/auth/me` - Get current user

### PBL Groups
- `GET /api/admin/pbl` - Get all PBL groups
- `GET /api/admin/pbl/:group_id` - Get PBL group by ID
- `POST /api/admin/pbl` - Create new PBL group
- `PUT /api/admin/pbl/:group_id` - Update PBL group
- `DELETE /api/admin/pbl/:group_id` - Delete PBL group

### External Evaluators
- `GET /api/admin/externals` - Get all external evaluators
- `POST /api/admin/externals` - Add new external evaluator
- `PUT /api/admin/externals/:external_id` - Update external evaluator
- `DELETE /api/admin/externals/:external_id` - Delete external evaluator

### Mentors
- `GET /api/admin/mentors` - Get all mentors
- `POST /api/admin/mentors` - Add new mentor
- `PUT /api/admin/mentors/:mentor_name` - Update mentor
- `DELETE /api/admin/mentors/:mentor_name` - Delete mentor

### Student Password Setup & Recovery
- Students who have not set a password must request a one-time password (OTP) via `/api/student-auth/forgot-password/send-otp` before calling `/api/student-auth/set-password`.
- The `/set-password` endpoint now requires `enrollment_no`, `newPassword`, `otp`, and `email` to prevent unauthorized password resets.
- OTPs expire after 10 minutes and can only be used once.