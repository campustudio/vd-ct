const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const ServerlessDatabase = require('./src/database-serverless');
const { validateKey, validateValue, validateTimestamp } = require('./src/validators');
const logger = require('./src/logger');

const app = express();

// Initialize database - will be created fresh for each serverless function invocation
let db = null;

// Initialize database function
async function initDatabase() {
  if (!db) {
    db = new ServerlessDatabase();
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DB init
  }
  return db;
}

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Rate limiting (reduced for serverless)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for serverless
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware with error handling
app.use(express.json({ 
  limit: '1mb', // Reduced for serverless
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        error: 'Invalid JSON format'
      });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? req.body : undefined
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: 'serverless'
  });
});

// GET / - API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Version Controlled Key-Value Store API',
    version: '1.0.0',
    description: 'A production-quality version-controlled key-value store with HTTP API',
    endpoints: {
      'POST /object': 'Store a key-value pair with timestamp',
      'GET /object/:key': 'Get the latest value for a key',
      'GET /object/:key?timestamp=X': 'Get the value for a key at a specific timestamp',
      'GET /health': 'Health check endpoint'
    },
    example: {
      store: 'POST /object with body {"mykey": "myvalue"}',
      retrieve: 'GET /object/mykey',
      retrieveAtTime: 'GET /object/mykey?timestamp=1640995200'
    }
  });
});

// POST /object - Store key-value pair
app.post('/object', async (req, res) => {
  try {
    const database = await initDatabase();
    
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

    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    
    await database.storeValue(key, value, timestamp);
    
    res.json({
      key,
      value,
      timestamp
    });

    logger.info('Value stored successfully', { key, timestamp });
  } catch (error) {
    logger.error('Error storing value', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /object/:key - Get latest value or value at timestamp
app.get('/object/:key', async (req, res) => {
  try {
    const database = await initDatabase();
    
    const { key } = req.params;
    const { timestamp } = req.query;

    const { error: keyError } = validateKey(key);
    if (keyError) {
      return res.status(400).json({
        error: 'Invalid key',
        details: keyError.details
      });
    }

    if (timestamp) {
      const { error: timestampError } = validateTimestamp(timestamp);
      if (timestampError) {
        return res.status(400).json({
          error: 'Invalid timestamp',
          details: timestampError.details
        });
      }

      const result = await database.getValueAtTimestamp(key, parseInt(timestamp));
      if (!result) {
        return res.status(404).json({
          error: 'No value found for key at the specified timestamp'
        });
      }

      res.json({ value: result.value });
      logger.info('Value retrieved at timestamp', { key, timestamp: parseInt(timestamp) });
    } else {
      const result = await database.getLatestValue(key);
      if (!result) {
        return res.status(404).json({
          error: 'Key not found'
        });
      }

      res.json({ value: result.value });
      logger.info('Latest value retrieved', { key });
    }
  } catch (error) {
    logger.error('Error retrieving value', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({
    error: 'Internal server error'
  });
});

// For local development
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = app;
