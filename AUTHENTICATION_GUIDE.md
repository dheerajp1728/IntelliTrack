# IntelliTrack Authentication & User Roles Implementation Guide

## Overview
This document describes the authentication and user role-based access control system implemented for IntelliTrack.

## Backend Implementation

### 1. New Dependencies Added
- `python-jose[cryptography]==3.3.0` - JWT token management
- `passlib[bcrypt]==1.7.4` - Password hashing
- `python-multipart==0.0.6` - Form data parsing

Install with:
```bash
pip install -r requirements.txt
```

### 2. Database Model Changes

#### User Model
The User model now includes:
- `email` (String, unique, indexed) - User's email address
- `password_hash` (String) - Securely hashed password using bcrypt

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Developer")
```

### 3. Authentication Module (`app/auth.py`)

Core authentication utilities:
- `hash_password()` - Securely hash passwords using bcrypt
- `verify_password()` - Verify plain password against hash
- `create_access_token()` - Generate JWT tokens with expiration (30 min default)
- `verify_token()` - Validate and decode JWT tokens
- `get_current_user_from_request()` - Extract authenticated user from request
- `check_user_role()` - Role-based access control decorator

**Configuration:**
- `SECRET_KEY` - Update in production!
- `ALGORITHM` - HS256
- `ACCESS_TOKEN_EXPIRE_MINUTES` - 30

### 4. New API Endpoints

#### POST `/auth/register`
Register a new user
- Request: `{ name, email, password, role }`
- Response: `{ access_token, token_type, user_id, user_name, user_role }`
- Validates: Unique email, no duplicate accounts

#### POST `/auth/login`
Authenticate user and get access token
- Request: `{ email, password }`
- Response: `{ access_token, token_type, user_id, user_name, user_role }`
- Validates: Correct credentials

#### GET `/auth/me`
Get current authenticated user
- Headers: `Authorization: Bearer {token}`
- Response: `{ id, name, email, role }`

### 5. Updated Endpoints

#### POST `/users` (Create User)
Now requires:
- `name` (string)
- `email` (string, unique)
- `password` (string)
- `role` (Developer | Scrum Master | Admin)

### 6. Seed Data
Updated seed data comes with test users:
- **alice@example.com** - Developer
- **bob@example.com** - Developer
- **charlie@example.com** - Scrum Master

All with password: `password123`

## Frontend Implementation

### 1. Authentication Context (`AuthContext.jsx`)

Global state management for authentication:
- Stores user info and JWT token
- Validates token on app load
- Provides `useAuth()` hook for components

**Available methods:**
```javascript
const { user, token, loading, login, register, logout, isAuthenticated } = useAuth();
```

### 2. Login Page (`LoginPage.jsx`)

Features:
- Email and password input
- Error handling and validation
- Demo credentials display
- Switch to registration

**Custom Styling:**
- Gradient background
- Card-based layout
- Responsive design

### 3. Registration Page (`RegisterPage.jsx`)

Features:
- Name, email, password, confirm password inputs
- Role selection (Developer, Scrum Master, Admin)
- Password validation (min 6 chars, match confirmation)
- Error handling
- Switch to login

### 4. App Integration

Updated `App.jsx`:
- Wrapped with `AuthProvider`
- Shows login/register pages when not authenticated
- Shows dashboard when authenticated
- User info in sidebar with logout button
- All API calls include Authorization header
- Uses authenticated user's role

**Flow:**
1. User not authenticated → Show Login/Register
2. Upon successful login → Navigate to Dashboard
3. Token stored in localStorage
4. Token included in all API requests
5. Dashboard shows user name and role
6. Logout clears token and returns to login

### 5. UI Styling Updates

Added to `index.css`:
- `.user-info` - User profile display in sidebar
- `.user-name` - User display name styling
- `.user-role` - Role badge styling
- `.logout-btn` - Logout button with hover effects

## How to Test

### Test 1: Register New User
1. Start the app
2. Click "Register here" on login page
3. Fill in details:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Role: Developer
4. Click Register
5. Should navigate to dashboard

### Test 2: Login with Demo Account
1. Stay on login page
2. Use demo credentials:
   - Email: alice@example.com
   - Password: password123
3. Click Login
4. Should navigate to dashboard showing "Alice" and "Developer"

### Test 3: Different Roles
- Admin: Can see Admin Panel for creating users
- Scrum Master: Can see Scrum Master Panel for creating tasks
- Developer: Sees developer-focused views

### Test 4: Logout
1. Click "Logout" button in sidebar
2. Should return to login page
3. Token should be cleared

### Test 5: Token Persistence
1. Login with any account
2. Refresh the page
3. Should remain logged in (token from localStorage)
4. Clear localStorage and refresh
5. Should return to login page

### Test 6: Protected Routes
1. Login required to access dashboard
2. Cannot access dashboard without valid token
3. Invalid token returns 401 error

## Security Notes

⚠️ **Important for Production:**

1. **Change SECRET_KEY** in `app/auth.py`
   - Use environment variable in production
   - Use strong random string

2. **Enable HTTPS**
   - Always use HTTPS in production
   - Never transmit tokens over HTTP

3. **Token Expiration**
   - Currently 30 minutes
   - Consider shorter expiration for sensitive operations
   - Implement refresh tokens for longer sessions

4. **Password Requirements**
   - Current: No minimum length validation
   - Consider adding strength requirements
   - Implement rate limiting on registration/login

5. **CORS Configuration**
   - Currently allows localhost
   - Update allowed origins for production
   - Use environment variables

## Role-Based Access Control

Current roles in system:
- **Developer** - Can view tasks, maintain profile
- **Scrum Master** - Can create and manage tasks
- **Admin** - Can manage users and system

To restrict endpoints to specific roles, use the `check_user_role()` dependency:

```python
@app.post("/admin/endpoint")
def admin_only(current_user: User = Depends(check_user_role(["Admin"]))):
    return {"message": "Admin access"}
```

## API Authentication Usage

All protected endpoints require Bearer token:

```javascript
const response = await fetch(`${API_BASE}/endpoint`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

The front-end `AuthContext` automatically includes this in all requests.

## Files Modified/Created

### Backend
- `app/models.py` - Updated User model
- `app/auth.py` - NEW - Authentication utilities
- `app/schemas.py` - Added auth schemas
- `app/main.py` - Added auth endpoints
- `app/seed.py` - Updated with password hashing
- `requirements.txt` - Added auth dependencies

### Frontend
- `src/AuthContext.jsx` - NEW - Auth context provider
- `src/LoginPage.jsx` - NEW - Login component
- `src/LoginPage.css` - NEW - Login styling
- `src/RegisterPage.jsx` - NEW - Registration component
- `src/RegisterPage.css` - NEW - Registration styling
- `src/App.jsx` - Updated with auth flow
- `src/index.css` - Added user info styling

## Troubleshooting

**Issue: "Could not validate credentials"**
- Check token is being sent in Authorization header
- Verify token hasn't expired
- Check SECRET_KEY matches between frontend & backend

**Issue: "Email already registered"**
- Email must be unique per user
- Clear database or use different email

**Issue: CORS errors**
- Verify backend CORS allows frontend origin
- Check both frontend and backend URLs match

**Issue: localStorage token lost**
- Browser may have cleared storage
- Check browser privacy/incognito mode
- Verify localStorage is enabled

## Next Steps

Consider implementing:
1. Password reset functionality
2. Email verification
3. Refresh tokens for extended sessions
4. Two-factor authentication
5. Rate limiting
6. Audit logging
7. User activity tracking
8. Role-based dashboard customization
