# Version Controlled Key-Value Store

A production-quality version-controlled key-value store with HTTP API built with Node.js. This project implements a RESTful API that allows storing and retrieving key-value pairs with timestamp-based version control.

## 🚀 Live Demo

**Deployed API**: [https://vd-ct.vercel.app](https://vd-ct.vercel.app)

**GitHub Repository**: [https://github.com/campustudio/vd-ct](https://github.com/campustudio/vd-ct)

> **⚠️ Production Note**: The live demo uses in-memory storage for serverless compatibility. For production deployments, use the MongoDB version for persistent, scalable storage.

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
- **MongoDB** - Production database (scalable, cloud-ready)
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
- **Triple Database Support**: SQLite for development, MongoDB for production, in-memory for serverless demos
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

## 🧪 Testing

### Local API Testing

```bash
# Run comprehensive Jest test suite (SQLite)
npm test

# Run tests in watch mode
npm run test:watch

# Test SQLite version with API calls
npm run test:sqlite

# Test MongoDB version with API calls
npm run test:mongodb
```

### Manual Testing

```bash
# Test SQLite version
npm start
npm run demo

# Test MongoDB version  
npm run start:mongodb
npm run test:mongodb
```

### 📋 Test Scripts Overview

| Script | Purpose | Command | Database |
|--------|---------|---------|----------|
| **Jest Tests** | Unit testing suite | `npm test` | SQLite |
| **SQLite API Test** | Manual API testing | `npm run test:sqlite` | SQLite |
| **MongoDB API Test** | Manual API testing | `npm run test:mongodb` | MongoDB |
| **Vercel Serverless Test** | Remote API testing | `./test-vercel-serverless.sh` | In-Memory |
| **Demo Script** | Interactive demo | `npm run demo` | SQLite |

### SQLite Test Results

The SQLite API test script (`test-sqlite-api.js`) verifies:
- ✅ **API Documentation**: Endpoint information
- ✅ **Health Check**: Server status and uptime
- ✅ **Data Storage**: Key-value pair storage
- ✅ **Version Control**: Historical value retrieval
- ✅ **Error Handling**: 404 responses for missing keys

### Vercel Serverless Test Results

The Vercel serverless test script (`test-vercel-serverless.sh`) verifies:
- ✅ **Remote API Access**: Tests deployed API at https://vd-ct.vercel.app
- ✅ **Serverless Functions**: Vercel serverless function execution
- ✅ **In-Memory Storage**: Temporary storage for demo purposes
- ✅ **Version Control**: Historical value retrieval (within session)
- ✅ **Error Handling**: Proper error responses

**Note**: Vercel uses in-memory storage, so data resets between function invocations.

### MongoDB Test Results

The MongoDB test script (`test-mongodb.js`) verifies:

- ✅ **Database Connection**: MongoDB connectivity and health monitoring
- ✅ **Document Storage**: Storing key-value pairs with automatic timestamps
- ✅ **Version Control**: Retrieving values at specific timestamps
- ✅ **Performance Stats**: Real-time database statistics
- ✅ **Index Optimization**: Efficient queries with proper indexing

**Expected Output:**
```
🍃 MongoDB API Regression Test
1. Testing API Documentation: ✅ OK
2. Testing Health Check with MongoDB Stats: ✅ Connected
3. Storing first value: ✅ Success
4. Storing updated value: ✅ Success
5. Getting latest value: ✅ Correct
6. Getting value at first timestamp: ✅ Working
7. Checking updated MongoDB stats: ✅ Updated
```

### Vercel Serverless Testing

For testing the deployed Vercel API, use the serverless test script:

```bash
# Make the script executable
chmod +x test-vercel-serverless.sh

# Run the Vercel serverless test suite
./test-vercel-serverless.sh
```

This script will automatically:
1. Test API documentation endpoint
2. Verify health check
3. Store multiple values with timestamps
4. Test version control functionality
5. Validate error handling
6. Display formatted results

**Requirements**: The script requires `jq` for JSON formatting. Install it with:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Or run without jq (less formatted output)
bash test-vercel-serverless.sh
```

### Manual Test Commands

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
# SQLite version (default)
npm start

# MongoDB version (requires MongoDB server)
npm run start:mongodb
```

4. **For development with auto-reload:**
```bash
# SQLite version
npm run dev

# MongoDB version
npm run dev:mongodb
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

## 🏭 Production Deployment

### 🍃 **Recommended: MongoDB Version**

**For production environments, always use the MongoDB version** for these critical benefits:

- **✅ Persistent Storage**: Data survives server restarts and deployments
- **✅ Scalability**: Handles thousands of concurrent requests
- **✅ High Availability**: Built-in replication and failover
- **✅ Performance**: Optimized indexes for fast queries
- **✅ Cloud Integration**: Native support for MongoDB Atlas

### Quick Production Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up MongoDB (choose one):
# Option A: Local MongoDB
brew install mongodb-community  # macOS
sudo systemctl start mongod     # Linux

# Option B: MongoDB Atlas (recommended)
# Create free cluster at https://www.mongodb.com/atlas
# Get connection string from Atlas dashboard

# 3. Configure environment
cp .env.example .env
# Edit .env with your MongoDB connection string:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kv_store

# 4. Start production server
npm run start:mongodb
```

### 🧪 Test MongoDB Version

```bash
# Start MongoDB server
npm run start:mongodb

# Run MongoDB-specific tests
npm run test:mongodb
```

### Production vs Development

| Environment | Database | Command | Use Case |
|-------------|----------|---------|----------|
| **Development** | SQLite | `npm start` | Local testing, quick prototyping |
| **Production** | MongoDB | `npm run start:mongodb` | **Scalable, persistent production** |
| **Serverless Demo** | In-Memory | Vercel deployment | Demo purposes only |

> **⚠️ Important**: The SQLite version is perfect for development, but MongoDB is essential for production due to scalability, persistence, and cloud deployment requirements.

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
- **server-mongodb.js**: MongoDB version (production-ready)
- **src/database.js**: SQLite database operations
- **src/database-mongodb.js**: MongoDB database operations
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
├── server.js                    # Main server (SQLite, local development)
├── server-mongodb.js            # MongoDB version (scalable, production-ready)
├── server-serverless.js        # Serverless-optimized version
├── api/
│   ├── index.js                # Vercel serverless entry point
│   └── test.js                 # Simple test endpoint
├── src/
│   ├── database.js             # SQLite database (local)
│   ├── database-mongodb.js     # MongoDB database (production)
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
├── test-sqlite-api.js          # SQLite API testing script
├── test-mongodb.js             # MongoDB API testing script
├── test-vercel-serverless.sh   # Vercel serverless API testing script
├── MONGODB_GUIDE.md            # MongoDB integration guide
└── DEPLOYMENT.md               # Deployment instructions
```

## 🔧 Architecture

### Local Development
- **Express.js** server with SQLite database
- Persistent data storage in `./data/kv_store.db`
- Full logging to `./logs/` directory
- Rate limiting and security middleware

### Production Deployment (MongoDB)
- **MongoDB** database for scalable storage
- Persistent data with high availability
- Optimized for high traffic and concurrent requests
- Cloud integration with MongoDB Atlas

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

2. **Database Layer** (`src/database.js` / `src/database-mongodb.js` / `src/database-serverless.js`)
   - Triple implementation: development (SQLite) vs production (MongoDB) vs serverless (in-memory)
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