# Version Controlled Key-Value Store

A production-quality version-controlled key-value store with HTTP API built with Node.js. This project implements a RESTful API that allows storing and retrieving key-value pairs with timestamp-based version control.

## 🚀 Live Demo

**Deployed API**: [https://vd-ct.vercel.app](https://vd-ct.vercel.app)

**GitHub Repository**: [https://github.com/campustudio/vd-ct](https://github.com/campustudio/vd-ct)

## 📋 Project Overview

This project fulfills the requirements of building a version-controlled key-value store with the following specifications:

1. **Store key-value pairs** with automatic timestamp generation
2. **Retrieve latest values** for any given key
3. **Retrieve historical values** at specific timestamps
4. **Production-quality code** with comprehensive error handling and validation
5. **Deployed to cloud** with public API access
6. **Open source database** (SQLite for local, in-memory for serverless)

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Local database (persistent storage)
- **In-Memory Storage** - Serverless deployment (demo purposes)

### Validation & Security
- **Joi** - Input validation and schema validation
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - API rate limiting

### Testing & Quality
- **Jest** - Testing framework
- **Supertest** - HTTP assertion testing
- **ESLint** - Code linting (configured)

### Deployment & DevOps
- **Vercel** - Serverless deployment platform
- **Docker** - Containerization support
- **GitHub Actions** - CI/CD (automatic deployment)

### Development Tools
- **Nodemon** - Development auto-reload
- **Compression** - Response compression
- **Structured Logging** - Custom logging system

## ✨ Features

- **Version Control**: Store and retrieve values at specific timestamps
- **RESTful API**: Simple GET/POST endpoints for data operations
- **Production Ready**: Includes logging, error handling, rate limiting, and security middleware
- **Dual Database Support**: SQLite for local development, in-memory for serverless
- **Comprehensive Testing**: Full test suite with 13 passing tests
- **Docker Support**: Containerized deployment ready
- **Input Validation**: Robust validation using Joi schemas
- **Serverless Optimized**: Vercel-ready with automatic scaling
- **API Documentation**: Built-in endpoint documentation

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

## 🧪 Testing the Live API

### Quick Test Commands

```bash
# 1. View API documentation
curl https://vd-ct.vercel.app/

# 2. Health check
curl https://vd-ct.vercel.app/health

# 3. Store a key-value pair
curl -X POST https://vd-ct.vercel.app/object \
  -H "Content-Type: application/json" \
  -d '{"mykey": "hello world"}'

# 4. Retrieve latest value
curl https://vd-ct.vercel.app/object/mykey

# 5. Store updated value (wait a moment, then run)
curl -X POST https://vd-ct.vercel.app/object \
  -H "Content-Type: application/json" \
  -d '{"mykey": "updated value"}'

# 6. Get value at specific timestamp (replace TIMESTAMP with actual timestamp from step 3)
curl "https://vd-ct.vercel.app/object/mykey?timestamp=TIMESTAMP"
```

### Expected API Responses

**Store Response:**
```json
{
  "key": "mykey",
  "value": "hello world",
  "timestamp": 1754640839
}
```

**Retrieve Response:**
```json
{
  "value": "hello world"
}
```

**Health Check Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-08T08:13:36.286Z",
  "environment": "serverless",
  "storeSize": 0
}
```

## 💻 Local Development

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/campustudio/vd-ct.git
cd vd-ct
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the server:**
```bash
npm start
```

4. **For development with auto-reload:**
```bash
npm run dev
```

The local server will run on `http://localhost:3000`

### Local Testing

Run the comprehensive test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Test the local API:
```bash
# Run the demo script
node demo.js

# Or test manually
curl -X POST http://localhost:3000/object \
  -H "Content-Type: application/json" \
  -d '{"testkey": "testvalue"}'

curl http://localhost:3000/object/testkey
```

## Deployment Options

### Vercel Deployment (Recommended for Demo)

1. **Deploy to Vercel:**
   - Push code to GitHub
   - Connect repository to Vercel
   - Automatic deployment with `vercel.json` configuration

2. **Serverless Features:**
   - Uses in-memory database (fresh for each request)
   - Optimized for serverless environment
   - Automatic scaling and CDN

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Docker Deployment

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

## 📁 Project Structure

```
/
├── server.js                    # Main server (local development)
├── server-serverless.js        # Serverless-optimized version
├── api/
│   ├── index.js                # Vercel serverless entry point
│   └── test.js                 # Simple test endpoint
├── src/
│   ├── database.js             # SQLite database (local)
│   ├── database-serverless.js  # In-memory database (serverless)
│   ├── validators.js           # Input validation schemas
│   └── logger.js               # Structured logging system
├── tests/
│   ├── api.test.js             # Comprehensive API tests
│   └── setup.js                # Test environment setup
├── vercel.json                 # Vercel deployment configuration
├── Dockerfile                  # Docker containerization
├── docker-compose.yml          # Docker Compose setup
├── package.json                # Dependencies and scripts
├── demo.js                     # Local API demonstration
└── test-deployed-api.sh        # Deployed API testing script
```

## 🔧 Architecture

### Local Development
- **Express.js** server with SQLite database
- Persistent data storage in `./data/kv_store.db`
- Full logging to `./logs/` directory
- Rate limiting and security middleware

### Serverless Deployment (Vercel)
- **Serverless functions** with in-memory storage
- Fresh database for each request (demo purposes)
- Optimized for cold starts and scalability
- Automatic HTTPS and CDN

### Key Components

1. **Validation Layer** (`src/validators.js`)
   - Key format validation (alphanumeric, underscore, hyphen, dot)
   - JSON body validation
   - Unix timestamp validation

2. **Database Layer** (`src/database.js` / `src/database-serverless.js`)
   - Dual implementation for local vs serverless
   - Version control with timestamp indexing
   - Optimized queries for performance

3. **API Layer** (`server.js` / `api/index.js`)
   - RESTful endpoint implementation
   - Error handling and logging
   - Security middleware integration

## 🚀 Deployment Process

### Automatic Deployment
1. Push code to GitHub repository
2. Vercel automatically detects changes
3. Builds and deploys serverless functions
4. Updates live API at `https://vd-ct.vercel.app`

### Manual Deployment
```bash
# Using Vercel CLI
npm i -g vercel
vercel

# Using Docker
docker build -t kv-store .
docker run -p 3000:3000 kv-store
```

## 📊 Performance & Limitations

### Local Version
- ✅ Persistent data storage
- ✅ Full logging and monitoring
- ✅ Handles concurrent requests
- ✅ Production-ready features

### Serverless Version
- ✅ Auto-scaling and high availability
- ✅ Global CDN distribution
- ✅ Zero server maintenance
- ⚠️ In-memory storage (data resets per function invocation)
- ⚠️ Cold start latency (~100-500ms)

### Production Considerations
For production use, consider:
- **External Database**: PostgreSQL, MongoDB Atlas, or Redis
- **Persistent Storage**: File system or cloud storage
- **Monitoring**: Application performance monitoring
- **Caching**: Redis or Memcached for frequently accessed data

## 🧪 Example Usage Scenarios

### Basic Key-Value Operations
```bash
# Store a value
curl -X POST https://vd-ct.vercel.app/object \
  -H "Content-Type: application/json" \
  -d '{"user_123": "John Doe"}'

# Get latest value
curl https://vd-ct.vercel.app/object/user_123
```

### Version Control Features
```bash
# Store initial configuration
curl -X POST https://vd-ct.vercel.app/object \
  -H "Content-Type: application/json" \
  -d '{"app_config": "{\"theme\": \"dark\", \"version\": \"1.0\"}"}'

# Update configuration
curl -X POST https://vd-ct.vercel.app/object \
  -H "Content-Type: application/json" \
  -d '{"app_config": "{\"theme\": \"light\", \"version\": \"1.1\"}"}'

# Get current configuration
curl https://vd-ct.vercel.app/object/app_config

# Get configuration at specific time
curl "https://vd-ct.vercel.app/object/app_config?timestamp=1754640839"
```

### Error Handling Examples
```bash
# Invalid key format
curl -X POST https://vd-ct.vercel.app/object \
  -H "Content-Type: application/json" \
  -d '{"invalid key!": "value"}'

# Multiple keys (not allowed)
curl -X POST https://vd-ct.vercel.app/object \
  -H "Content-Type: application/json" \
  -d '{"key1": "value1", "key2": "value2"}'

# Non-existent key
curl https://vd-ct.vercel.app/object/nonexistent
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern Node.js best practices
- Inspired by production-quality API design patterns
- Deployed using Vercel's excellent serverless platform