const { MongoClient } = require('mongodb');
const logger = require('./logger');

class MongoDatabase {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.isConnected = false;
  }

  async connect(connectionString = 'mongodb://localhost:27017/kv_store') {
    try {
      this.client = new MongoClient(connectionString);
      await this.client.connect();
      this.db = this.client.db();
      this.collection = this.db.collection('kv_pairs');
      this.isConnected = true;
      
      // Create indexes for performance
      await this.createIndexes();
      
      logger.info('MongoDB connected successfully', { 
        database: this.db.databaseName,
        connectionString: connectionString.replace(/\/\/.*@/, '//***@') // Hide credentials
      });
      
      return true;
    } catch (error) {
      logger.error('MongoDB connection failed', { error: error.message });
      throw error;
    }
  }

  async createIndexes() {
    try {
      // Compound index for efficient queries
      await this.collection.createIndex({ key: 1, timestamp: -1 });
      // Index for timestamp queries
      await this.collection.createIndex({ timestamp: -1 });
      logger.debug('MongoDB indexes created successfully');
    } catch (error) {
      logger.error('Failed to create MongoDB indexes', { error: error.message });
    }
  }

  async storeValue(key, value) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const document = {
      key,
      value,
      timestamp,
      created_at: new Date()
    };

    try {
      const result = await this.collection.insertOne(document);
      logger.debug('Value stored', { key, timestamp, insertedId: result.insertedId });
      return { key, value, timestamp };
    } catch (error) {
      logger.error('Failed to store value', { key, error: error.message });
      throw error;
    }
  }

  async getValue(key, timestamp = null) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      let query = { key };
      
      if (timestamp) {
        query.timestamp = { $lte: parseInt(timestamp) };
      }

      const result = await this.collection
        .findOne(query, { sort: { timestamp: -1 } });

      if (result) {
        logger.debug('Value retrieved', { key, timestamp: result.timestamp });
        return {
          value: result.value,
          timestamp: result.timestamp
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to retrieve value', { key, timestamp, error: error.message });
      throw error;
    }
  }

  async getStats() {
    if (!this.isConnected) {
      return {
        total_records: 0,
        unique_keys: 0,
        database_size: 0
      };
    }

    try {
      const totalRecords = await this.collection.countDocuments();
      const uniqueKeys = await this.collection.distinct('key');
      const dbStats = await this.db.stats();

      return {
        total_records: totalRecords,
        unique_keys: uniqueKeys.length,
        database_size: dbStats.dataSize || 0,
        index_size: dbStats.indexSize || 0,
        storage_size: dbStats.storageSize || 0
      };
    } catch (error) {
      logger.error('Failed to get database stats', { error: error.message });
      return {
        total_records: 0,
        unique_keys: 0,
        database_size: 0,
        error: error.message
      };
    }
  }

  async close() {
    if (this.client) {
      try {
        await this.client.close();
        this.isConnected = false;
        logger.info('MongoDB connection closed');
      } catch (error) {
        logger.error('Error closing MongoDB connection', { error: error.message });
      }
    }
  }

  // Health check method
  async healthCheck() {
    if (!this.isConnected) {
      return { status: 'disconnected', error: 'Database not connected' };
    }

    try {
      // Ping the database
      await this.db.admin().ping();
      const stats = await this.getStats();
      
      return {
        status: 'connected',
        database: this.db.databaseName,
        stats
      };
    } catch (error) {
      logger.error('MongoDB health check failed', { error: error.message });
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = MongoDatabase;
