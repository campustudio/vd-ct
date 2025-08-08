// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const { validateKey, validateValue, validateTimestamp } = require('../src/validators');

// Simple in-memory store for demo purposes
const store = new Map();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Root endpoint - API documentation
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: 'serverless',
    storeSize: store.size
  });
});

// POST /object - Store key-value pair
app.post('/object', (req, res) => {
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

    const timestamp = Math.floor(Date.now() / 1000);
    
    // Store in memory with versioning
    if (!store.has(key)) {
      store.set(key, []);
    }
    store.get(key).push({ value, timestamp });
    
    res.json({
      key,
      value,
      timestamp
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /object/:key - Get latest value or value at timestamp
app.get('/object/:key', (req, res) => {
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

    const versions = store.get(key);
    if (!versions || versions.length === 0) {
      return res.status(404).json({
        error: 'Key not found'
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

      const targetTimestamp = parseInt(timestamp);
      const validVersions = versions.filter(v => v.timestamp <= targetTimestamp);
      
      if (validVersions.length === 0) {
        return res.status(404).json({
          error: 'No value found for key at the specified timestamp'
        });
      }

      const latestVersion = validVersions[validVersions.length - 1];
      res.json({ value: latestVersion.value });
    } else {
      const latestVersion = versions[versions.length - 1];
      res.json({ value: latestVersion.value });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

module.exports = app;
