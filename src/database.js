const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('./logger');

class Database {
  constructor(dbPath = path.join(__dirname, '..', 'data', 'kv_store.db')) {
    this.dbPath = dbPath;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const fs = require('fs');
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Error opening database', { error: err.message });
          reject(err);
        } else {
          logger.info('Database connected successfully', { path: this.dbPath });
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS kv_store (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(key, timestamp)
        );
        
        CREATE INDEX IF NOT EXISTS idx_key_timestamp ON kv_store(key, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_key ON kv_store(key);
        CREATE INDEX IF NOT EXISTS idx_timestamp ON kv_store(timestamp);
      `;

      this.db.exec(sql, (err) => {
        if (err) {
          logger.error('Error creating tables', { error: err.message });
          reject(err);
        } else {
          logger.info('Database tables created successfully');
          resolve();
        }
      });
    });
  }

  async storeValue(key, value, timestamp) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO kv_store (key, value, timestamp)
        VALUES (?, ?, ?)
      `;
      
      // Convert value to JSON string for storage
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      
      this.db.run(sql, [key, valueStr, timestamp], function(err) {
        if (err) {
          logger.error('Error storing value', { 
            error: err.message, 
            key, 
            timestamp 
          });
          reject(err);
        } else {
          logger.debug('Value stored', { 
            key, 
            timestamp, 
            rowId: this.lastID 
          });
          resolve({ id: this.lastID, key, value: valueStr, timestamp });
        }
      });
    });
  }

  async getLatestValue(key) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT key, value, timestamp
        FROM kv_store
        WHERE key = ?
        ORDER BY timestamp DESC
        LIMIT 1
      `;

      this.db.get(sql, [key], (err, row) => {
        if (err) {
          logger.error('Error getting latest value', { 
            error: err.message, 
            key 
          });
          reject(err);
        } else {
          if (row) {
            // Try to parse JSON, fallback to string
            let parsedValue;
            try {
              parsedValue = JSON.parse(row.value);
            } catch {
              parsedValue = row.value;
            }
            
            resolve({
              key: row.key,
              value: parsedValue,
              timestamp: row.timestamp
            });
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  async getValueAtTimestamp(key, timestamp) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT key, value, timestamp
        FROM kv_store
        WHERE key = ? AND timestamp <= ?
        ORDER BY timestamp DESC
        LIMIT 1
      `;

      this.db.get(sql, [key, timestamp], (err, row) => {
        if (err) {
          logger.error('Error getting value at timestamp', { 
            error: err.message, 
            key, 
            timestamp 
          });
          reject(err);
        } else {
          if (row) {
            // Try to parse JSON, fallback to string
            let parsedValue;
            try {
              parsedValue = JSON.parse(row.value);
            } catch {
              parsedValue = row.value;
            }
            
            resolve({
              key: row.key,
              value: parsedValue,
              timestamp: row.timestamp
            });
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  async getAllVersions(key) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT key, value, timestamp
        FROM kv_store
        WHERE key = ?
        ORDER BY timestamp DESC
      `;

      this.db.all(sql, [key], (err, rows) => {
        if (err) {
          logger.error('Error getting all versions', { 
            error: err.message, 
            key 
          });
          reject(err);
        } else {
          const versions = rows.map(row => {
            let parsedValue;
            try {
              parsedValue = JSON.parse(row.value);
            } catch {
              parsedValue = row.value;
            }
            
            return {
              key: row.key,
              value: parsedValue,
              timestamp: row.timestamp
            };
          });
          resolve(versions);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('Error closing database', { error: err.message });
          } else {
            logger.info('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async getStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT key) as unique_keys,
          MIN(timestamp) as earliest_timestamp,
          MAX(timestamp) as latest_timestamp
        FROM kv_store
      `;

      this.db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

module.exports = Database;
