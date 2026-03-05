# Mentor Login and Registration Guide

## Overview

This document provides comprehensive information about the mentor authentication system, including login and registration processes for both regular mentors and industrial mentors.

## Table of Contents

- [Mentor Types](#mentor-types)
- [Regular Mentor Authentication](#regular-mentor-authentication)
- [Industrial Mentor Authentication](#industrial-mentor-authentication)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Security Features](#security-features)

---

## Mentor Types

The system supports two types of mentors:

1. **Regular Mentors** - Faculty mentors who guide student groups
2. **Industrial Mentors** - Industry professionals who provide external mentorship

---

## Regular Mentor Authentication

### First-Time Registration (Password Setup)

Regular mentors must complete a secure OTP-based password setup process before their first login.

#### Step 1: Check Mentor Status

Check if a mentor exists and whether they have set up their password.

**Endpoint:** `POST /api/mentors/check-status`

**Request Body:**
```json
{
  "contact_number": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mentor status retrieved",
  "data": {
    "exists": true,
    "hasPassword": false,
    "mentor": {
      "mentor_code": "M001",
      "mentor_name": "John Doe",
      "contact_number": "1234567890",
      "email": "john@example.com"
    }
  }
}
```

#### Step 2: Request OTP

Request an OTP to be sent to the mentor's registered email address.

**Endpoint:** `POST /api/mentors/request-otp`

**Request Body:**
```json
{
  "contact_number": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your registered email address",
  "data": {
    "session_token": "uuid-session-token",
    "email": "jo****@example.com",
    "expires_in_minutes": 10
  }
}
```

#### Step 3: Verify OTP

Verify the OTP received via email.

**Endpoint:** `POST /api/mentors/verify-otp`

**Request Body:**
```json
{
  "session_token": "uuid-session-token",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "session_token": "uuid-session-token",
    "contact_number": "1234567890"
  }
}
```

**Error Response (Invalid OTP):**
```json
{
  "success": false,
  "message": "Invalid OTP",
  "data": {
    "remainingAttempts": 2
  }
}
```

#### Step 4: Set Password

Set a new password after OTP verification.

**Endpoint:** `POST /api/mentors/set-password`

**Request Body:**
```json
{
  "contact_number": "1234567890",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!",
  "session_token": "uuid-session-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password set successfully",
  "data": {
    "contact_number": "1234567890"
  }
}
```

### Regular Mentor Login

Once password is set, mentors can log in using their contact number or email.

**Endpoint:** `POST /api/mentors/login`

**Request Body (Contact Number):**
```json
{
  "username": "1234567890",
  "password": "SecurePassword123!"
}
```

**Request Body (Email):**
```json
{
  "username": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Mentor login successful",
  "data": {
    "token": "jwt-token-here",
    "requirePasswordChange": false,
    "mentor_id": "M001",
    "mentor_name": "John Doe",
    "contact_number": "1234567890",
    "groups": []
  }
}
```

**Response (Password Not Set):**
```json
{
  "success": true,
  "message": "Password setup required",
  "data": {
    "requirePasswordChange": true,
    "mentor_id": "M001",
    "mentor_name": "John Doe",
    "contact_number": "1234567890"
  }
}
```

---

## Industrial Mentor Authentication

Industrial mentors have pre-configured credentials and can log in directly without OTP verification.

### Industrial Mentor Login

**Endpoint:** `POST /api/industrial-mentors/login`

**Request Body:**
```json
{
  "username": "industrial_mentor_username",
  "password": "password"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Industrial mentor login successful",
  "data": {
    "token": "jwt-token-here",
    "industrial_mentor_code": "IM001",
    "mentor_code": "M001",
    "name": "Jane Smith",
    "contact": "9876543210",
    "email": "jane@company.com"
  }
}
```

---

## API Endpoints

### Regular Mentor Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/mentors/check-status` | Check if mentor exists and has password | No |
| POST | `/api/mentors/request-otp` | Request OTP for password setup | No |
| POST | `/api/mentors/verify-otp` | Verify OTP | No |
| POST | `/api/mentors/set-password` | Set new password | No (requires verified session) |
| POST | `/api/mentors/login` | Login with credentials | No |
| GET | `/api/mentors/groups` | Get assigned groups | Yes |

### Industrial Mentor Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/industrial-mentors/login` | Login with credentials | No |
| GET | `/api/industrial-mentors/groups` | Get assigned groups | Yes |

---

## Authentication Flow

### Regular Mentor First-Time Setup Flow

```
1. Mentor enters contact number
   ↓
2. System checks if mentor exists
   ↓
3. If exists and no password → Request OTP
   ↓
4. OTP sent to registered email
   ↓
5. Mentor enters OTP
   ↓
6. System verifies OTP (max 3 attempts)
   ↓
7. Mentor sets password
   ↓
8. Password saved (bcrypt hashed)
   ↓
9. Mentor can now login
```

### Regular Mentor Login Flow

```
1. Mentor enters username (contact/email) and password
   ↓
2. System validates credentials
   ↓
3. If valid → Generate JWT token (7-day expiry)
   ↓
4. Return token and mentor details
```

### Industrial Mentor Login Flow

```
1. Industrial mentor enters username and password
   ↓
2. System validates credentials
   ↓
3. If valid → Generate JWT token (7-day expiry)
   ↓
4. Return token and mentor details
```

---

## Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds of 10
- Passwords are never stored in plain text
- Password confirmation required during setup

### OTP Security
- OTP expires after 10 minutes
- Maximum 3 verification attempts per session
- Session tokens are unique UUIDs
- OTP sessions are invalidated after successful password setup
- Email addresses are masked in responses (e.g., `jo****@example.com`)

### JWT Token Security
- Tokens expire after 7 days
- Tokens include unique JTI (JWT ID) for tracking
- Tokens contain role information for authorization
- Tokens are signed with a secret key

### Authentication Middleware
- Protected routes require valid JWT token
- Token verification on each request
- Role-based access control

### Rate Limiting
- Rate limiting middleware prevents brute force attacks
- Configurable request limits per IP address

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Contact number is required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid mentor credentials"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Mentor not found"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "message": "Maximum OTP verification attempts exceeded",
  "data": {
    "remainingAttempts": 0
  }
}
```

---

## Usage Examples

### Example: Complete First-Time Registration

```javascript
// Step 1: Check status
const statusResponse = await fetch('/api/mentors/check-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contact_number: '1234567890' })
});

// Step 2: Request OTP
const otpResponse = await fetch('/api/mentors/request-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contact_number: '1234567890' })
});
const { session_token } = await otpResponse.json();

// Step 3: Verify OTP
const verifyResponse = await fetch('/api/mentors/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    session_token,
    otp: '123456'
  })
});

// Step 4: Set password
const passwordResponse = await fetch('/api/mentors/set-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contact_number: '1234567890',
    password: 'SecurePassword123!',
    confirm_password: 'SecurePassword123!',
    session_token
  })
});
```

### Example: Login

```javascript
const loginResponse = await fetch('/api/mentors/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: '1234567890',
    password: 'SecurePassword123!'
  })
});

const { token } = await loginResponse.json();

// Use token for authenticated requests
const groupsResponse = await fetch('/api/mentors/groups', {
  headers: { 
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Notes

- Mentors can log in using either their contact number or email address
- Industrial mentors have a separate authentication flow and do not require OTP verification
- All passwords must meet security requirements (implement password validation as needed)
- JWT tokens should be stored securely on the client side (e.g., httpOnly cookies or secure storage)
- Always use HTTPS in production to protect credentials in transit

---

## Support

For issues or questions regarding mentor authentication, please contact the system administrator or refer to the main project documentation.
