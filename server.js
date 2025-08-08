const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const Database = require('./src/database');
const { validateKey, validateValue, validateTimestamp } = require('./src/validators');
const logger = require('./src/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware with error handling
app.use(express.json({ 
  limit: '10mb',
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
    uptime: process.uptime()
  });
});

// POST /object - Store key-value pair
app.post('/object', async (req, res) => {
  try {
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
    
    await db.storeValue(key, value, timestamp);
    
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

      const result = await db.getValueAtTimestamp(key, parseInt(timestamp));
      if (!result) {
        return res.status(404).json({
          error: 'No value found for key at the specified timestamp'
        });
      }

      res.json({ value: result.value });
      logger.info('Value retrieved at timestamp', { key, timestamp: parseInt(timestamp) });
    } else {
      const result = await db.getLatestValue(key);
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

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = app;
