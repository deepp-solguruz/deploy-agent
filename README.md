# Deploy Agent

Express.js server with comprehensive health check endpoints and JWT authentication.

## Features

- Express.js server with security middleware (Helmet, CORS)
- JWT-based authentication system
- User registration and login
- Protected routes with middleware
- Comprehensive health check endpoints
- Request logging with Morgan
- Error handling middleware
- Environment configuration

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd deploy-agent

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Development

```bash
# Start development server with auto-reload
npm run dev
```

### Production

```bash
# Start production server
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Documentation

### Root Endpoint

#### GET /
Returns basic API information.

**Example:**
```bash
curl http://localhost:3000/
```

**Response:**
```json
{
  "message": "Deploy Agent API",
  "version": "1.0.0",
  "status": "running"
}
```

### Health Check Endpoints

#### GET /api/health
Basic health check with system metrics.

**Example:**
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "uptime": 123.456,
  "message": "OK",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "status": "healthy",
  "service": "deploy-agent",
  "version": "1.0.0",
  "environment": "development",
  "memory": {
    "used": 25.67,
    "total": 50.12,
    "external": 2.34
  },
  "cpu": {
    "user": 123456,
    "system": 78910
  }
}
```

#### GET /api/health/detailed
Comprehensive system information including platform details.

**Example:**
```bash
curl http://localhost:3000/api/health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "service": {
    "name": "deploy-agent",
    "version": "1.0.0",
    "uptime": 123.456,
    "environment": "development"
  },
  "system": {
    "platform": "linux",
    "arch": "x64",
    "nodeVersion": "v18.17.0",
    "pid": 12345
  },
  "memory": {
    "rss": 45.23,
    "heapTotal": 30.12,
    "heapUsed": 25.67,
    "external": 2.34,
    "arrayBuffers": 1.23
  },
  "cpu": {
    "user": 123456,
    "system": 78910
  },
  "loadAverage": [0.5, 0.3, 0.2]
}
```

#### GET /api/health/ready
Readiness probe for container orchestration (Kubernetes, Docker Swarm).

**Example:**
```bash
curl http://localhost:3000/api/health/ready
```

**Response (Ready):**
```json
{
  "status": "ready",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "message": "Service is ready to accept requests"
}
```

**Response (Not Ready - 503 status):**
```json
{
  "status": "not ready",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "message": "Service is not ready to accept requests"
}
```

#### GET /api/health/live
Liveness probe for container orchestration.

**Example:**
```bash
curl http://localhost:3000/api/health/live
```

**Response:**
```json
{
  "status": "alive",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "message": "Service is alive"
}
```

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "1701234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2023-12-07T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securepassword123"
  }'
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "1701234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2023-12-07T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

**Example:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "user": {
    "id": "1701234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2023-12-07T10:30:00.000Z",
    "isActive": true
  }
}
```

#### PUT /api/auth/profile
Update user profile (requires authentication).

**Request Body:**
```json
{
  "email": "newemail@example.com"
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"email": "newemail@example.com"}'
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "1701234567890",
    "username": "johndoe",
    "email": "newemail@example.com",
    "createdAt": "2023-12-07T10:30:00.000Z",
    "updatedAt": "2023-12-07T11:00:00.000Z"
  }
}
```

#### PUT /api/auth/change-password
Change user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword456"
  }'
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

#### POST /api/auth/logout
Logout user (requires authentication).

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Logout successful",
  "note": "Please remove the token from client storage"
}
```

#### POST /api/auth/refresh
Refresh JWT token (requires authentication).

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### User Management Endpoints

#### GET /api/users
Get all users (requires authentication).

**Example:**
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Users retrieved successfully",
  "users": [
    {
      "id": "1701234567890",
      "username": "johndoe",
      "email": "john@example.com",
      "createdAt": "2023-12-07T10:30:00.000Z",
      "updatedAt": "2023-12-07T11:00:00.000Z",
      "isActive": true
    }
  ],
  "total": 1
}
```

#### GET /api/users/:id
Get user by ID (requires authentication, users can only view their own profile).

**Example:**
```bash
curl -X GET http://localhost:3000/api/users/1701234567890 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "User retrieved successfully",
  "user": {
    "id": "1701234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2023-12-07T10:30:00.000Z",
    "updatedAt": "2023-12-07T11:00:00.000Z",
    "isActive": true
  }
}
```

#### POST /api/users
Create new user (requires authentication).

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword123",
  "isActive": true
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "securepassword123",
    "isActive": true
  }'
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "1701234567891",
    "username": "newuser",
    "email": "newuser@example.com",
    "createdAt": "2023-12-07T12:00:00.000Z",
    "isActive": true
  }
}
```

#### PUT /api/users/:id
Update user (requires authentication, users can only update their own profile).

**Request Body:**
```json
{
  "email": "updated@example.com",
  "isActive": false
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/users/1701234567890 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated@example.com",
    "isActive": false
  }'
```

**Response (200):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "1701234567890",
    "username": "johndoe",
    "email": "updated@example.com",
    "createdAt": "2023-12-07T10:30:00.000Z",
    "updatedAt": "2023-12-07T12:30:00.000Z",
    "isActive": false
  }
}
```

#### DELETE /api/users/:id
Soft delete user (deactivate) - requires authentication, users can only delete their own account.

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/users/1701234567890 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "User deactivated successfully",
  "user": {
    "id": "1701234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "isActive": false,
    "deletedAt": "2023-12-07T13:00:00.000Z"
  }
}
```

#### PATCH /api/users/:id/activate
Reactivate user account (requires authentication, users can reactivate their own account).

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/users/1701234567890/activate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "User reactivated successfully",
  "user": {
    "id": "1701234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "isActive": true,
    "updatedAt": "2023-12-07T13:30:00.000Z"
  }
}
```

#### GET /api/users/search/:query
Search users by username or email (requires authentication).

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 10)
- `offset` (optional): Number of results to skip (default: 0)

**Example:**
```bash
curl -X GET "http://localhost:3000/api/users/search/john?limit=5&offset=0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Search completed successfully",
  "users": [
    {
      "id": "1701234567890",
      "username": "johndoe",
      "email": "john@example.com",
      "createdAt": "2023-12-07T10:30:00.000Z",
      "isActive": true
    }
  ],
  "query": "john",
  "total": 1
}
```

## User Management Flow

### 1. User Registration & Authentication
```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "email": "user@example.com", "password": "password123"}'

# Login and get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "password123"}'
```

### 2. User Profile Management
```bash
# View own profile
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Update profile
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"email": "newemail@example.com"}'

# Change password
curl -X PUT http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "old", "newPassword": "new"}'
```

### 3. User Management Operations
```bash
# List all users
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Get specific user
curl -X GET http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Create new user
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "email": "new@example.com", "password": "pass123"}'

# Update user
curl -X PUT http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"email": "updated@example.com"}'

# Search users
curl -X GET "http://localhost:3000/api/users/search/john?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 4. Account Lifecycle Management
```bash
# Deactivate user account (soft delete)
curl -X DELETE http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Reactivate user account
curl -X PATCH http://localhost:3000/api/users/USER_ID/activate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 5. Token Management
- Tokens expire in 24 hours by default
- Use `/api/auth/refresh` to get a new token
- Store tokens securely on the client side
- Remove tokens on logout

### 6. Access Control
- Users can only view/edit their own profiles
- User creation requires authentication
- Search functionality available to authenticated users
- Soft delete preserves data integrity

## Environment Configuration

Copy `.env.example` to `.env` and configure the following variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_SECRET` | Secret key for JWT signing | `your-super-secret-jwt-key-change-this-in-production` |
| `JWT_EXPIRES_IN` | JWT token expiration time | `24h` |

## Testing

The project includes comprehensive test suites:

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: `tests/unit/` - Test individual components
- **Integration Tests**: `tests/integration/` - Test API endpoints
- **Test Setup**: `tests/setup.js` - Jest configuration

## Data Schema

### User Object
```json
{
  "id": "string",           // Unique user identifier (timestamp-based)
  "username": "string",     // Unique username (3-30 chars, alphanumeric + underscore)
  "email": "string",        // User email address (valid email format)
  "password": "string",     // Hashed password (bcrypt, min 6 chars)
  "createdAt": "string",    // ISO timestamp of creation
  "updatedAt": "string",    // ISO timestamp of last update (optional)
  "deletedAt": "string",    // ISO timestamp of soft deletion (optional)
  "isActive": "boolean"     // Account status (true/false)
}
```

### JWT Token Payload
```json
{
  "id": "string",           // User ID
  "username": "string",     // Username
  "email": "string",        // User email
  "iat": "number",          // Issued at timestamp
  "exp": "number"           // Expiration timestamp
}
```

### API Response Formats

#### Success Response
```json
{
  "message": "string",      // Success message
  "user": {},              // User object (when applicable)
  "users": [],             // Array of users (for list endpoints)
  "total": "number",       // Total count (for list endpoints)
  "token": "string"        // JWT token (for auth endpoints)
}
```

#### Error Response
```json
{
  "error": "string",        // Error type/title
  "message": "string",      // Detailed error message
  "details": []            // Validation errors (when applicable)
}
```

### Validation Rules

#### User Creation/Registration
- **username**: Required, 3-30 characters, alphanumeric + underscore, unique
- **email**: Required, valid email format, unique
- **password**: Required, minimum 6 characters
- **isActive**: Optional boolean, defaults to true

#### User Update
- **email**: Optional, valid email format, unique
- **isActive**: Optional boolean
- **username**: Cannot be changed after creation

#### Search Parameters
- **query**: Minimum 2 characters
- **limit**: Optional, default 10, maximum 100
- **offset**: Optional, default 0

## Project Structure

```
deploy-agent/
├── src/
│   ├── server.js                    # Main server file
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication middleware
│   ├── routes/
│   │   ├── health.js               # Health check routes
│   │   ├── auth.js                 # Authentication routes
│   │   └── users.js                # User management routes
│   ├── validators/
│   │   ├── auth.js                 # Auth input validation
│   │   └── users.js                # User input validation
│   ├── models/
│   │   └── User.js                 # User data model
│   └── services/
│       └── UserService.js          # User business logic
├── tests/
│   ├── setup.js                    # Test configuration
│   ├── unit/
│   │   ├── middleware/
│   │   │   └── auth.test.js        # Auth middleware tests
│   │   ├── validators/
│   │   │   └── users.test.js       # User validation tests
│   │   └── services/
│   │       └── UserService.test.js # User service tests
│   └── integration/
│       ├── auth.test.js            # Auth endpoint tests
│       ├── users.test.js           # User endpoint tests
│       └── server.test.js          # Server integration tests
├── package.json                    # Dependencies and scripts
├── jest.config.js                  # Jest configuration
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── CHANGELOG.md                    # Version history
├── PR_DESCRIPTION.md               # Pull request template
└── README.md                       # This file
```

## Middleware Stack

The server uses the following middleware:
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Morgan**: HTTP request logging
- **Express.json()**: JSON body parsing
- **Express.urlencoded()**: URL-encoded body parsing

## Error Handling

The server includes comprehensive error handling:
- Global error handler for unhandled exceptions
- 404 handler for unknown routes
- Environment-aware error messages (detailed in development, generic in production)

## Docker Support

To run with Docker:

```bash
# Build image
docker build -t deploy-agent .

# Run container
docker run -p 3000:3000 deploy-agent
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Inventory Management Endpoints

#### GET /api/inventory
Get all inventory items with filtering and pagination.

**Query Parameters:**
- `category` (optional): Filter by category (general, electronics, clothing, food, books, tools, medical, automotive)
- `status` (optional): Filter by status (active, inactive, discontinued)
- `isActive` (optional): Filter by active status (true/false)
- `lowStock` (optional): Show only low stock items (true)
- `outOfStock` (optional): Show only out of stock items (true)
- `search` (optional): Search in name, description, or SKU
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Example:**
```bash
curl -X GET "http://localhost:3000/api/inventory?category=electronics&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Inventory items retrieved successfully",
  "data": [
    {
      "id": "1701234567890",
      "name": "Wireless Headphones",
      "description": "Bluetooth wireless headphones with noise cancellation",
      "sku": "WH-001",
      "category": "electronics",
      "quantity": 25,
      "minQuantity": 5,
      "maxQuantity": 100,
      "unitPrice": 99.99,
      "totalValue": 2499.75,
      "supplier": "TechCorp",
      "location": "Warehouse A",
      "status": "active",
      "isActive": true,
      "createdAt": "2023-12-07T10:30:00.000Z",
      "updatedAt": "2023-12-07T11:00:00.000Z",
      "lastRestockedAt": "2023-12-07T11:00:00.000Z",
      "expiryDate": null,
      "batchNumber": "BATCH-001",
      "isLowStock": false,
      "isOutOfStock": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### GET /api/inventory/summary
Get inventory summary with key metrics.

**Example:**
```bash
curl -X GET http://localhost:3000/api/inventory/summary \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Inventory summary retrieved successfully",
  "data": {
    "totalItems": 150,
    "totalValue": 45000.50,
    "activeItems": 140,
    "inactiveItems": 10,
    "lowStockItems": 8,
    "outOfStockItems": 3,
    "categories": {
      "electronics": 45,
      "clothing": 30,
      "books": 25,
      "general": 50
    },
    "averageValue": 300.00
  }
}
```

#### GET /api/inventory/low-stock
Get items with low stock (quantity <= minQuantity).

**Example:**
```bash
curl -X GET http://localhost:3000/api/inventory/low-stock \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Low stock items retrieved successfully",
  "data": [
    {
      "id": "1701234567891",
      "name": "USB Cable",
      "sku": "USB-001",
      "quantity": 3,
      "minQuantity": 10,
      "isLowStock": true
    }
  ],
  "count": 1
}
```

#### GET /api/inventory/out-of-stock
Get items that are out of stock (quantity = 0).

**Example:**
```bash
curl -X GET http://localhost:3000/api/inventory/out-of-stock \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Out of stock items retrieved successfully",
  "data": [
    {
      "id": "1701234567892",
      "name": "Phone Case",
      "sku": "PC-001",
      "quantity": 0,
      "minQuantity": 5,
      "isOutOfStock": true
    }
  ],
  "count": 1
}
```

#### GET /api/inventory/search/:query
Search inventory items by name, description, or SKU.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**
```bash
curl -X GET "http://localhost:3000/api/inventory/search/headphones?page=1&limit=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Search completed successfully",
  "data": [
    {
      "id": "1701234567890",
      "name": "Wireless Headphones",
      "sku": "WH-001",
      "quantity": 25
    }
  ],
  "query": "headphones",
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  }
}
```

#### GET /api/inventory/:id
Get inventory item by ID.

**Example:**
```bash
curl -X GET http://localhost:3000/api/inventory/1701234567890 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Inventory item retrieved successfully",
  "data": {
    "id": "1701234567890",
    "name": "Wireless Headphones",
    "description": "Bluetooth wireless headphones with noise cancellation",
    "sku": "WH-001",
    "category": "electronics",
    "quantity": 25,
    "minQuantity": 5,
    "maxQuantity": 100,
    "unitPrice": 99.99,
    "totalValue": 2499.75,
    "supplier": "TechCorp",
    "location": "Warehouse A",
    "status": "active",
    "isActive": true,
    "createdAt": "2023-12-07T10:30:00.000Z",
    "updatedAt": "2023-12-07T11:00:00.000Z",
    "lastRestockedAt": "2023-12-07T11:00:00.000Z",
    "expiryDate": null,
    "batchNumber": "BATCH-001",
    "isLowStock": false,
    "isOutOfStock": false
  }
}
```

#### GET /api/inventory/sku/:sku
Get inventory item by SKU.

**Example:**
```bash
curl -X GET http://localhost:3000/api/inventory/sku/WH-001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Inventory item retrieved successfully",
  "data": {
    "id": "1701234567890",
    "name": "Wireless Headphones",
    "sku": "WH-001",
    "quantity": 25
  }
}
```

#### POST /api/inventory
Create new inventory item.

**Request Body:**
```json
{
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "sku": "WM-001",
  "category": "electronics",
  "quantity": 50,
  "minQuantity": 10,
  "maxQuantity": 200,
  "unitPrice": 29.99,
  "supplier": "TechCorp",
  "location": "Warehouse B",
  "expiryDate": null,
  "batchNumber": "BATCH-002"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/inventory \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with USB receiver",
    "sku": "WM-001",
    "category": "electronics",
    "quantity": 50,
    "minQuantity": 10,
    "maxQuantity": 200,
    "unitPrice": 29.99,
    "supplier": "TechCorp",
    "location": "Warehouse B"
  }'
```

**Response (201):**
```json
{
  "message": "Inventory item created successfully",
  "data": {
    "id": "1701234567893",
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with USB receiver",
    "sku": "WM-001",
    "category": "electronics",
    "quantity": 50,
    "minQuantity": 10,
    "maxQuantity": 200,
    "unitPrice": 29.99,
    "totalValue": 1499.50,
    "supplier": "TechCorp",
    "location": "Warehouse B",
    "status": "active",
    "isActive": true,
    "createdAt": "2023-12-07T12:00:00.000Z",
    "updatedAt": null,
    "lastRestockedAt": null,
    "expiryDate": null,
    "batchNumber": null,
    "isLowStock": false,
    "isOutOfStock": false
  }
}
```

#### PUT /api/inventory/:id
Update inventory item.

**Request Body:**
```json
{
  "name": "Updated Wireless Mouse",
  "description": "Updated description",
  "category": "electronics",
  "quantity": 75,
  "minQuantity": 15,
  "unitPrice": 34.99,
  "supplier": "NewSupplier",
  "location": "Warehouse C"
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/inventory/1701234567893 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Wireless Mouse",
    "unitPrice": 34.99,
    "quantity": 75
  }'
```

**Response (200):**
```json
{
  "message": "Inventory item updated successfully",
  "data": {
    "id": "1701234567893",
    "name": "Updated Wireless Mouse",
    "sku": "WM-001",
    "quantity": 75,
    "unitPrice": 34.99,
    "totalValue": 2624.25,
    "updatedAt": "2023-12-07T12:30:00.000Z"
  }
}
```

#### PATCH /api/inventory/:id/quantity
Update item quantity directly.

**Request Body:**
```json
{
  "quantity": 100
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/inventory/1701234567893/quantity \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"quantity": 100}'
```

**Response (200):**
```json
{
  "message": "Item quantity updated successfully",
  "data": {
    "id": "1701234567893",
    "name": "Updated Wireless Mouse",
    "quantity": 100,
    "totalValue": 3499.00,
    "updatedAt": "2023-12-07T13:00:00.000Z"
  }
}
```

#### PATCH /api/inventory/:id/add-stock
Add stock to existing quantity.

**Request Body:**
```json
{
  "amount": 25
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/inventory/1701234567893/add-stock \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"amount": 25}'
```

**Response (200):**
```json
{
  "message": "Stock added successfully",
  "data": {
    "id": "1701234567893",
    "name": "Updated Wireless Mouse",
    "quantity": 125,
    "totalValue": 4373.75,
    "lastRestockedAt": "2023-12-07T13:15:00.000Z",
    "updatedAt": "2023-12-07T13:15:00.000Z"
  }
}
```

#### PATCH /api/inventory/:id/remove-stock
Remove stock from existing quantity.

**Request Body:**
```json
{
  "amount": 10
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/inventory/1701234567893/remove-stock \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"amount": 10}'
```

**Response (200):**
```json
{
  "message": "Stock removed successfully",
  "data": {
    "id": "1701234567893",
    "name": "Updated Wireless Mouse",
    "quantity": 115,
    "totalValue": 4023.85,
    "updatedAt": "2023-12-07T13:30:00.000Z"
  }
}
```

#### DELETE /api/inventory/:id
Soft delete inventory item (deactivate).

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/inventory/1701234567893 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Inventory item deleted successfully",
  "data": {
    "id": "1701234567893",
    "name": "Updated Wireless Mouse",
    "isActive": false,
    "status": "inactive",
    "deletedAt": "2023-12-07T14:00:00.000Z",
    "updatedAt": "2023-12-07T14:00:00.000Z"
  }
}
```

#### PATCH /api/inventory/:id/restore
Restore soft-deleted inventory item.

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/inventory/1701234567893/restore \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "message": "Inventory item restored successfully",
  "data": {
    "id": "1701234567893",
    "name": "Updated Wireless Mouse",
    "isActive": true,
    "status": "active",
    "deletedAt": null,
    "updatedAt": "2023-12-07T14:15:00.000Z"
  }
}
```

## Inventory Management Flow

### 1. Item Creation & Setup
```bash
# Create new inventory item
curl -X POST http://localhost:3000/api/inventory \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Name",
    "sku": "PROD-001",
    "category": "electronics",
    "quantity": 100,
    "minQuantity": 10,
    "unitPrice": 49.99,
    "supplier": "Supplier Name"
  }'

# Get item details
curl -X GET http://localhost:3000/api/inventory/ITEM_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Get item by SKU
curl -X GET http://localhost:3000/api/inventory/sku/PROD-001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 2. Inventory Monitoring
```bash
# Get inventory summary
curl -X GET http://localhost:3000/api/inventory/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Check low stock items
curl -X GET http://localhost:3000/api/inventory/low-stock \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Check out of stock items
curl -X GET http://localhost:3000/api/inventory/out-of-stock \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Search inventory
curl -X GET "http://localhost:3000/api/inventory/search/product?limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 3. Stock Management
```bash
# Add stock (restock)
curl -X PATCH http://localhost:3000/api/inventory/ITEM_ID/add-stock \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50}'

# Remove stock (sale/usage)
curl -X PATCH http://localhost:3000/api/inventory/ITEM_ID/remove-stock \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5}'

# Set exact quantity
curl -X PATCH http://localhost:3000/api/inventory/ITEM_ID/quantity \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 75}'
```

### 4. Item Management
```bash
# Update item details
curl -X PUT http://localhost:3000/api/inventory/ITEM_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "unitPrice": 54.99,
    "supplier": "New Supplier"
  }'

# Deactivate item (soft delete)
curl -X DELETE http://localhost:3000/api/inventory/ITEM_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Restore deactivated item
curl -X PATCH http://localhost:3000/api/inventory/ITEM_ID/restore \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 5. Filtering & Reporting
```bash
# Filter by category
curl -X GET "http://localhost:3000/api/inventory?category=electronics&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Filter by status
curl -X GET "http://localhost:3000/api/inventory?status=active&isActive=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Show only low stock items
curl -X GET "http://localhost:3000/api/inventory?lowStock=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Search with filters
curl -X GET "http://localhost:3000/api/inventory?search=wireless&category=electronics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Inventory Data Schema

### InventoryItem Object
```json
{
  "id": "string",                    // Unique item identifier (timestamp-based)
  "name": "string",                  // Item name (2-100 chars, required)
  "description": "string",           // Item description (optional)
  "sku": "string",                   // Stock Keeping Unit (2-50 chars, unique, required)
  "category": "string",              // Category (general, electronics, clothing, food, books, tools, medical, automotive)
  "quantity": "number",              // Current stock quantity (non-negative)
  "minQuantity": "number",           // Minimum stock threshold (non-negative)
  "maxQuantity": "number",           // Maximum stock limit (optional, non-negative)
  "unitPrice": "number",             // Price per unit (non-negative)
  "totalValue": "number",            // Calculated: quantity * unitPrice
  "supplier": "string",              // Supplier name (optional)
  "location": "string",              // Storage location (optional)
  "status": "string",                // Item status (active, inactive, discontinued)
  "isActive": "boolean",             // Active status flag
  "createdAt": "string",             // ISO timestamp of creation
  "updatedAt": "string",             // ISO timestamp of last update (optional)
  "deletedAt": "string",             // ISO timestamp of soft deletion (optional)
  "createdBy": "string",             // User ID who created the item
  "updatedBy": "string",             // User ID who last updated the item
  "lastRestockedAt": "string",       // ISO timestamp of last restock (optional)
  "expiryDate": "string",            // Item expiry date (optional)
  "batchNumber": "string",           // Batch/lot number (optional)
  "isLowStock": "boolean",           // Calculated: quantity <= minQuantity && quantity > 0
  "isOutOfStock": "boolean"          // Calculated: quantity === 0
}
```

### Inventory Summary Object
```json
{
  "totalItems": "number",            // Total number of items
  "totalValue": "number",            // Total inventory value
  "activeItems": "number",           // Number of active items
  "inactiveItems": "number",         // Number of inactive items
  "lowStockItems": "number",         // Number of low stock items
  "outOfStockItems": "number",       // Number of out of stock items
  "categories": {                    // Items count by category
    "electronics": "number",
    "clothing": "number",
    "books": "number",
    "general": "number"
  },
  "averageValue": "number"           // Average item value
}
```

### Pagination Object
```json
{
  "page": "number",                  // Current page number
  "limit": "number",                 // Items per page
  "total": "number",                 // Total number of items
  "totalPages": "number"             // Total number of pages
}
```

### Validation Rules

#### Item Creation
- **name**: Required, 2-100 characters
- **sku**: Required, 2-50 characters, alphanumeric + underscore/hyphen, unique
- **category**: Optional, must be valid category
- **quantity**: Optional, non-negative number, default 0
- **minQuantity**: Optional, non-negative number, default 0
- **maxQuantity**: Optional, non-negative number, must be > minQuantity
- **unitPrice**: Optional, non-negative number, default 0
- **status**: Optional, must be valid status, default 'active'
- **isActive**: Optional, boolean, default true

#### Item Update
- **name**: Optional, 2-100 characters
- **sku**: Cannot be changed after creation
- **category**: Optional, must be valid category
- **quantity**: Optional, non-negative number
- **minQuantity**: Optional, non-negative number
- **maxQuantity**: Optional, non-negative number, must be > minQuantity
- **unitPrice**: Optional, non-negative number
- **status**: Optional, must be valid status
- **isActive**: Optional, boolean

#### Stock Operations
- **quantity**: Must be non-negative number
- **amount**: Must be positive number for add/remove operations
- Remove stock cannot exceed current quantity

#### Search & Filtering
- **query**: Minimum 2 characters for search
- **page**: Positive integer, default 1
- **limit**: 1-100, default 10
- **category**: Must be valid category
- **status**: Must be valid status
- **isActive**: Must be boolean

## License

MIT License - see LICENSE file for details.