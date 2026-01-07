# Student "Remember Me" Feature - Backend Implementation

## Overview
This implementation adds a "Remember Me" feature to the student login system, allowing students to stay logged in for extended periods (up to 30 days) using refresh tokens.

## Database Changes

### Migration File
Run the migration file to add refresh token support:
```bash
# File: migrations/add_refresh_token_to_student_auth.sql
```

This adds:
- `refresh_token` (TEXT) - Stores the JWT refresh token
- `refresh_token_expiry` (TIMESTAMP) - Stores token expiration date
- Index on `refresh_token` for fast lookups

## API Endpoints

### 1. Login with Remember Me
**POST** `/api/students/login`

**Request Body:**
```json
{
  "enrollment_no": "STUDENT123",
  "password": "password123",
  "rememberMe": true
}
```

**Response (with rememberMe=true):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "student": {
      "enrollment_no": "STUDENT123",
      "email": "student@example.com",
      "role": "student"
    }
  }
}
```

**Response (with rememberMe=false or omitted):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "student": {
      "enrollment_no": "STUDENT123",
      "email": "student@example.com",
      "role": "student"
    }
  }
}
```

### 2. Refresh Access Token
**POST** `/api/students/refresh-token`

Use this endpoint when the access token expires but the refresh token is still valid.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "student": {
      "enrollment_no": "STUDENT123",
      "email": "student@example.com",
      "role": "student"
    }
  }
}
```

### 3. Logout (Invalidate Refresh Token)
**POST** `/api/students/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Token Lifetimes

- **Access Token**: 24 hours (1 day)
- **Refresh Token**: 30 days (when "Remember Me" is checked)

## Security Features

1. **JWT Signature Verification**: All tokens are signed and verified using JWT
2. **Database Validation**: Refresh tokens are validated against the database
3. **Expiry Checking**: Both JWT expiry and database expiry are checked
4. **Token Type Validation**: Refresh tokens must have `type: 'refresh'` in payload
5. **Single Session**: Only one refresh token per student (new login invalidates old token)
6. **Secure Logout**: Refresh tokens are properly invalidated on logout

## Implementation Details

### Model Methods (studentAuthModel.js)
- `generateToken(student, expiresIn)` - Generate access token
- `generateRefreshToken(student, expiresIn)` - Generate refresh token
- `saveRefreshToken(enrollmentNo, refreshToken, expiryDays)` - Save token to database
- `verifyRefreshToken(refreshToken)` - Verify and retrieve student from refresh token
- `invalidateRefreshToken(enrollmentNo)` - Remove refresh token (logout)

### Controller Methods (studentAuthController.js)
- `studentLogin` - Enhanced with rememberMe support
- `refreshAccessToken` - Generate new access token from refresh token
- `logout` - Invalidate refresh token

## Frontend Integration Guide

### 1. Login Form
Add a "Remember Me" checkbox to your login form:

```jsx
const [rememberMe, setRememberMe] = useState(false);

// In login form
<label>
  <input 
    type="checkbox" 
    checked={rememberMe}
    onChange={(e) => setRememberMe(e.target.checked)}
  />
  Remember Me
</label>
```

### 2. Login Request
Send rememberMe flag in login request:

```javascript
const response = await apiRequest('/api/students/login', 'POST', {
  enrollment_no: enrollmentNo,
  password: password,
  rememberMe: rememberMe
});

if (response.success) {
  // Store access token
  localStorage.setItem('token', response.data.token);
  
  // Store refresh token if provided (remember me was checked)
  if (response.data.refreshToken) {
    localStorage.setItem('refreshToken', response.data.refreshToken);
  }
  
  // Store student info
  localStorage.setItem('student', JSON.stringify(response.data.student));
}
```

### 3. Token Refresh Logic
Implement automatic token refresh when access token expires:

```javascript
// Add to your API request handler
async function apiRequest(url, method, data, token) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    // If 401 and refresh token exists, try to refresh
    if (response.status === 401 && localStorage.getItem('refreshToken')) {
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        // Retry original request with new token
        return apiRequest(url, method, data, newToken);
      }
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) return null;

  try {
    const response = await fetch('/api/students/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (data.success) {
      // Update access token
      localStorage.setItem('token', data.data.token);
      return data.data.token;
    } else {
      // Refresh token expired or invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return null;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}
```

### 4. Logout Implementation
Clear both tokens on logout:

```javascript
async function logout() {
  try {
    const token = localStorage.getItem('token');
    
    // Call logout endpoint to invalidate refresh token
    await fetch('/api/students/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Clear local storage regardless of API call result
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('student');
    window.location.href = '/login';
  }
}
```

## Testing

### Test Remember Me Login
```bash
curl -X POST http://localhost:5000/api/students/login \
  -H "Content-Type: application/json" \
  -d '{
    "enrollment_no": "STUDENT123",
    "password": "password123",
    "rememberMe": true
  }'
```

### Test Token Refresh
```bash
curl -X POST http://localhost:5000/api/students/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

### Test Logout
```bash
curl -X POST http://localhost:5000/api/students/logout \
  -H "Authorization: Bearer your_access_token_here"
```

## Error Handling

### Common Error Responses

**Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid enrollment number or password."
}
```

**Invalid/Expired Refresh Token:**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token."
}
```

**Missing Token:**
```json
{
  "success": false,
  "message": "Refresh token is required."
}
```

## Best Practices

1. **Always use HTTPS** in production to prevent token interception
2. **Store refresh tokens securely** (localStorage for web, secure storage for mobile)
3. **Implement token rotation** for enhanced security (regenerate refresh token periodically)
4. **Log refresh token usage** for security monitoring
5. **Implement rate limiting** on token refresh endpoint
6. **Clear tokens on logout** from all storage locations
7. **Handle token expiry gracefully** with automatic refresh

## Future Enhancements

1. **Multiple Device Support**: Store device info with refresh tokens
2. **Token Rotation**: Generate new refresh token on each use
3. **Activity Tracking**: Log when and where refresh tokens are used
4. **Revocation API**: Allow users to revoke tokens from specific devices
5. **Sliding Expiration**: Extend refresh token expiry on each use
