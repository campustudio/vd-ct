const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const MongoDatabase = require('./src/database-mongodb');
const { validateKey, validateValue, validateTimestamp } = require('./src/validators');
const logger = require('./src/logger');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kv_store';

// Initialize database
const db = new MongoDatabase();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Compression and parsing
app.use(compression());
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? req.body : undefined
  });
  next();
});

// API Documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Version Controlled Key-Value Store API (MongoDB)',
    version: '1.0.0',
    database: 'MongoDB',
    description: 'A production-ready RESTful API for storing and retrieving key-value pairs with version control using timestamps',
    endpoints: {
      'POST /object': 'Store a key-value pair',
      'GET /object/:key': 'Get latest value for a key',
      'GET /object/:key?timestamp=X': 'Get value at specific timestamp',
      'GET /health': 'Health check with database stats'
    },
    features: [
      'Version control with timestamps',
      'Input validation',
      'Rate limiting',
      'Security headers',
      'Structured logging',
      'MongoDB with indexing',
      'Real-time statistics'
    ]
  });
});

// Store key-value pair
app.post('/object', async (req, res) => {
  try {
    // Validate request body structure
    const { error: bodyError } = validateValue(req.body);
    if (bodyError) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: bodyError.details
      });
    }

    const entries = Object.entries(req.body);
    if (entries.length !== 1) {
      return res.status(400).json({
        error: 'Request body must contain exactly one key-value pair'
      });
    }

    const [key, value] = entries[0];
    
    const { error: keyError } = validateKey(key);
    if (keyError) {
      return res.status(400).json({
        error: 'Invalid key',
        details: keyError.details
      });
    }
    
    // Store in database
    const result = await db.storeValue(key, value);
    
    logger.info('Value stored successfully', { key, timestamp: result.timestamp });
    res.json(result);
    
  } catch (error) {
    logger.error('Error storing value', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get value by key
app.get('/object/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { timestamp } = req.query;

    // Validate timestamp if provided
    if (timestamp) {
      const { error: timestampError } = validateTimestamp(timestamp);
      if (timestampError) {
        return res.status(400).json({
          error: 'Invalid timestamp',
          details: timestampError.details
        });
      }
    }

    // Get value from database
    const result = await db.getValue(key, timestamp);
    
    if (!result) {
      return res.status(404).json({ error: 'Key not found' });
    }

    if (timestamp) {
      logger.info('Value retrieved at timestamp', { key, timestamp });
    } else {
      logger.info('Latest value retrieved', { key });
    }

    res.json({ value: result.value });
    
  } catch (error) {
    logger.error('Error retrieving value', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await db.healthCheck();
    const uptime = process.uptime();
    
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      database: health.status,
      stats: health.stats || {}
    };

    if (health.status === 'connected') {
      res.json(response);
    } else {
      res.status(503).json({
        ...response,
        status: 'unhealthy',
        error: health.error
      });
    }
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await db.connect(MONGODB_URI);
    
    // Start HTTP server
    app.listen(PORT, () => {
      logger.info('Server running on port ' + PORT, { database: 'MongoDB', port: PORT });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();
