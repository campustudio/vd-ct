# Version Controlled Key-Value Store

A production-quality version-controlled key-value store with HTTP API built with Node.js.

## Features

- **Version Control**: Store and retrieve values at specific timestamps
- **RESTful API**: Simple GET/POST endpoints for data operations
- **Production Ready**: Includes logging, error handling, rate limiting, and security middleware
- **SQLite Database**: Persistent storage with optimized indexes
- **Comprehensive Testing**: Full test suite with Jest
- **Docker Support**: Containerized deployment ready
- **Input Validation**: Robust validation using Joi

## API Endpoints

### Store Key-Value Pair
```
POST /object
Content-Type: application/json

Body: {"key": "value"}
```

**Response:**
```json
{
  "key": "mykey",
  "value": "value1",
  "timestamp": 1640995200
}
```

### Get Latest Value
```
GET /object/:key
```

**Response:**
```json
{
  "value": "value1"
}
```

### Get Value at Timestamp
```
GET /object/:key?timestamp=1640995200
```

**Response:**
```json
{
  "value": "value1"
}
```

### Health Check
```
GET /health
```

## Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Start the server:**
```bash
npm start
```

3. **For development with auto-reload:**
```bash
npm run dev
```

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Docker Deployment

1. **Build and run with Docker Compose:**
```bash
docker-compose up -d
```

2. **Or build manually:**
```bash
docker build -t kv-store .
docker run -p 3000:3000 kv-store
```

## Configuration

Copy `.env.example` to `.env` and modify as needed:
```bash
cp .env.example .env
```

## Architecture

- **server.js**: Main application server with Express.js
- **src/database.js**: SQLite database operations
- **src/validators.js**: Input validation schemas
- **src/logger.js**: Structured logging system
- **tests/**: Comprehensive test suite

## Production Features

- **Security**: Helmet.js for security headers, CORS, rate limiting
- **Performance**: Compression middleware, optimized database indexes
- **Monitoring**: Health check endpoint, structured logging
- **Error Handling**: Comprehensive error handling and validation
- **Graceful Shutdown**: Proper cleanup on process termination

## Example Usage

```bash
# Store a value
curl -X POST http://localhost:3000/object \
  -H "Content-Type: application/json" \
  -d '{"mykey": "hello world"}'

# Get latest value
curl http://localhost:3000/object/mykey

# Get value at specific timestamp
curl http://localhost:3000/object/mykey?timestamp=1640995200
```