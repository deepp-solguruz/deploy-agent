# Build Auth Endpoints and Flow

## Summary

This PR implements a comprehensive JWT-based authentication system for the deploy-agent service. The implementation includes complete user registration, login, profile management, and security features with extensive testing coverage.

## Changes Made

### Authentication System
- **JWT Authentication Middleware** (`src/middleware/auth.js`)
  - Token generation with configurable expiration
  - Token verification and validation
  - Authentication guard middleware for protected routes
  - Secure JWT secret handling via environment variables

- **Complete Auth Routes** (`src/routes/auth.js`)
  - `POST /api/auth/register` - User registration with validation
  - `POST /api/auth/login` - User authentication and token generation
  - `GET /api/auth/profile` - Get current user profile (protected)
  - `PUT /api/auth/profile` - Update user profile (protected)
  - `PUT /api/auth/change-password` - Change user password (protected)
  - `POST /api/auth/logout` - User logout endpoint
  - `POST /api/auth/refresh` - Token refresh endpoint (protected)

- **Input Validation** (`src/validators/auth.js`)
  - Registration validation (username, email, password strength)
  - Login validation with sanitization
  - Email format validation and uniqueness checks
  - Password strength requirements (minimum 6 characters)

### Security Features
- **Password Security**
  - Bcrypt hashing with salt rounds (10)
  - Password strength validation
  - Secure password change flow with current password verification

- **JWT Security**
  - Configurable token expiration (default: 24h)
  - Secure token generation and verification
  - Environment-based JWT secret configuration
  - Token refresh mechanism for extended sessions

- **User Management**
  - In-memory user store (production-ready for database integration)
  - User activation/deactivation support
  - Duplicate username/email prevention
  - Profile update capabilities

### Package Dependencies
- **bcrypt ^5.1.1** - Password hashing and verification
- **jsonwebtoken ^9.0.2** - JWT token generation and verification

### Server Integration
- **Route Registration** (`src/server.js`)
  - Auth routes mounted at `/api/auth`
  - Integrated with existing Express server setup

### Environment Configuration
- **JWT Configuration** (`.env.example`)
  - `JWT_SECRET` - Secret key for JWT signing
  - `JWT_EXPIRES_IN` - Token expiration time (default: 24h)

### Comprehensive Testing
- **Unit Tests** (`tests/unit/middleware/auth.test.js`)
  - Token generation and verification tests
  - Authentication middleware testing
  - Error handling validation

- **Integration Tests** (`tests/integration/auth.test.js`)
  - Complete auth flow testing (register → login → profile)
  - Password change workflow testing
  - Token refresh mechanism testing
  - Error scenario validation
  - Security boundary testing

## API Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/register` | POST | No | User registration |
| `/api/auth/login` | POST | No | User authentication |
| `/api/auth/profile` | GET | Yes | Get user profile |
| `/api/auth/profile` | PUT | Yes | Update user profile |
| `/api/auth/change-password` | PUT | Yes | Change password |
| `/api/auth/logout` | POST | Yes | User logout |
| `/api/auth/refresh` | POST | Yes | Refresh JWT token |

## Authentication Flow

1. **Registration**: User creates account with username, email, password
2. **Login**: User authenticates and receives JWT token
3. **Protected Access**: Token required for profile and password operations
4. **Token Refresh**: Extend session without re-authentication
5. **Logout**: Client-side token removal

## Security Considerations

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with configurable expiration
- Input validation and sanitization
- Duplicate user prevention
- Account activation status checking
- Secure error messages (no information leakage)

## Testing Coverage

- **Unit Tests**: Authentication middleware and token operations
- **Integration Tests**: Complete auth workflows and error scenarios
- **Security Tests**: Invalid token handling, password validation
- **Edge Cases**: Duplicate users, inactive accounts, malformed requests

## Breaking Changes

None - This is a new feature addition.

## Migration Guide

### Environment Setup
1. Add JWT configuration to `.env`:
   ```
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=24h
   ```

### Usage Examples
```javascript
// Register new user
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

// Login user
POST /api/auth/login
{
  "username": "john_doe",
  "password": "securepassword123"
}

// Access protected route
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

## Production Considerations

- Replace in-memory user store with database (MongoDB, PostgreSQL)
- Implement token blacklisting for logout
- Add rate limiting for auth endpoints
- Configure secure JWT secrets in production
- Implement password reset functionality
- Add email verification for registration

## Checklist

- [x] JWT authentication middleware implemented
- [x] Complete auth endpoints (register, login, profile, etc.)
- [x] Input validation and sanitization
- [x] Password hashing with bcrypt
- [x] Comprehensive test suite
- [x] Environment configuration
- [x] Security best practices
- [x] Error handling and logging
- [x] Documentation updated
- [x] Integration with existing server