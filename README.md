# Deploy Agent

Express.js server with comprehensive health check endpoints.

## Features

- Express.js server with security middleware (Helmet, CORS)
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

## Environment Configuration

Copy `.env.example` to `.env` and configure the following variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

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

## Project Structure

```
deploy-agent/
├── src/
│   ├── server.js          # Main server file
│   └── routes/
│       └── health.js      # Health check routes
├── tests/
│   ├── setup.js           # Test configuration
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── package.json           # Dependencies and scripts
├── jest.config.js         # Jest configuration
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
└── README.md             # This file
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

## License

MIT License - see LICENSE file for details.