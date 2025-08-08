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

// Body parsing middleware with enhanced error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      logger.error('JSON parsing failed', { 
        error: e.message, 
        errorId,
        contentLength: buf.length 
      });
      res.status(400).json({
        error: 'Invalid JSON format in request body',
        errorId,
        timestamp: new Date().toISOString(),
        hint: 'Ensure request body contains valid JSON'
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

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connectivity
    await new Promise((resolve, reject) => {
      db.db.get('SELECT 1 as test', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const memUsage = process.memoryUsage();
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        path: db.dbPath
      },
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
      },
      nodeVersion: process.version
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: 'Database connectivity test failed'
      },
      uptime: process.uptime()
    });
  }
});

// POST /object - Store key-value pair with enhanced validation
app.post('/object', async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Validate Content-Type
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type must be application/json',
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Validate request body structure
    const { error: bodyError } = validateValue(req.body);
    if (bodyError) {
      return res.status(400).json({
        error: 'Invalid request body format',
        details: bodyError.details,
        requestId,
        timestamp: new Date().toISOString(),
        hints: ['Request body must be valid JSON object', 'Maximum 100 properties per object']
      });
    }

    const entries = Object.entries(req.body);
    if (entries.length !== 1) {
      return res.status(400).json({
        error: 'Request body must contain exactly one key-value pair',
        received: entries.length,
        requestId,
        timestamp: new Date().toISOString(),
        hint: 'Send JSON like: {"mykey": "myvalue"}'
      });
    }

    const [key, value] = entries[0];
    
    // Enhanced key validation
    const { error: keyError } = validateKey(key);
    if (keyError) {
      return res.status(400).json({
        error: 'Invalid key format',
        key: key,
        details: keyError.details,
        requestId,
        timestamp: new Date().toISOString(),
        hints: [
          'Keys must be 1-255 characters long',
          'Only letters, numbers, underscores, hyphens, and dots allowed',
          'Cannot start or end with dots'
        ]
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const valueSize = JSON.stringify(value).length;
    
    // Check value size limit (1MB)
    if (valueSize > 1024 * 1024) {
      return res.status(413).json({
        error: 'Value too large',
        size: valueSize,
        limit: 1024 * 1024,
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    await db.storeValue(key, value, timestamp);
    
    res.status(201).json({
      key,
      value,
      timestamp,
      requestId,
      size: valueSize
    });

    logger.info('Value stored successfully', { 
      key, 
      timestamp, 
      requestId,
      valueSize,
      valueType: typeof value
    });
  } catch (error) {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.error('Error storing value', { 
      error: error.message, 
      stack: error.stack,
      requestId,
      errorId
    });
    
    if (error.message.includes('UNIQUE constraint')) {
      res.status(409).json({
        error: 'Duplicate key-timestamp combination',
        requestId,
        errorId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        requestId,
        errorId,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// GET /object/:key - Get latest value or value at timestamp with enhanced error handling
app.get('/object/:key', async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { key } = req.params;
    const { timestamp } = req.query;

    // Enhanced key validation
    const { error: keyError } = validateKey(key);
    if (keyError) {
      return res.status(400).json({
        error: 'Invalid key format',
        key: key,
        details: keyError.details,
        requestId,
        timestamp: new Date().toISOString(),
        hints: [
          'Keys must be 1-255 characters long',
          'Only letters, numbers, underscores, hyphens, and dots allowed'
        ]
      });
    }

    if (timestamp) {
      // Enhanced timestamp validation
      const { error: timestampError } = validateTimestamp(timestamp);
      if (timestampError) {
        return res.status(400).json({
          error: 'Invalid timestamp format',
          timestamp: timestamp,
          details: timestampError.details,
          requestId,
          timestamp: new Date().toISOString(),
          hints: [
            'Timestamp must be a valid Unix timestamp (seconds since epoch)',
            'Cannot be more than 1 day in the future',
            'Example: ' + Math.floor(Date.now() / 1000)
          ]
        });
      }

      const ts = parseInt(timestamp);
      const result = await db.getValueAtTimestamp(key, ts);
      if (!result) {
        return res.status(404).json({
          error: 'No value found for key at specified timestamp',
          key: key,
          timestamp: ts,
          requestId,
          timestamp: new Date().toISOString(),
          hint: 'Try getting the latest value without timestamp parameter'
        });
      }

      // Parse value back to original type
      let parsedValue;
      try {
        parsedValue = JSON.parse(result.value);
      } catch {
        parsedValue = result.value;
      }

      res.json({ 
        value: parsedValue,
        timestamp: result.timestamp,
        requestId,
        retrievedAt: new Date().toISOString()
      });
      
      logger.info('Historical value retrieved', { 
        key, 
        timestamp: ts, 
        requestId,
        actualTimestamp: result.timestamp
      });
    } else {
      const result = await db.getLatestValue(key);
      if (!result) {
        return res.status(404).json({
          error: 'Key not found',
          key: key,
          requestId,
          timestamp: new Date().toISOString(),
          hint: 'Make sure the key exists by storing a value first'
        });
      }

      // Parse value back to original type
      let parsedValue;
      try {
        parsedValue = JSON.parse(result.value);
      } catch {
        parsedValue = result.value;
      }

      res.json({ 
        value: parsedValue,
        timestamp: result.timestamp,
        requestId,
        retrievedAt: new Date().toISOString()
      });
      
      logger.info('Latest value retrieved', { 
        key, 
        requestId,
        valueTimestamp: result.timestamp
      });
    }
  } catch (error) {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.error('Error retrieving value', { 
      error: error.message, 
      stack: error.stack,
      requestId,
      errorId,
      key: req.params.key
    });
    
    res.status(500).json({
      error: 'Internal server error',
      requestId,
      errorId,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced 404 handler
app.use('*', (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.warn('Endpoint not found', { 
    path: req.originalUrl, 
    method: req.method,
    ip: req.ip,
    requestId
  });
  
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    requestId,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /',
      'GET /health', 
      'POST /object',
      'GET /object/:key',
      'GET /object/:key?timestamp=<unix_timestamp>'
    ],
    hint: 'Check the API documentation at GET /'
  });
});

// Enhanced global error handler
app.use((error, req, res, next) => {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.error('Unhandled error', { 
    error: error.message, 
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId,
    errorId
  });
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.statusCode || 500).json({
    error: isDevelopment ? error.message : 'Internal server error',
    requestId,
    errorId,
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: error.stack })
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
