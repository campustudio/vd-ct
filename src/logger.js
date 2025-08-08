const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(level, formattedMessage) {
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}.log`;
    const filepath = path.join(this.logDir, filename);
    
    fs.appendFileSync(filepath, formattedMessage + '\n');
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with colors
    const colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[37m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[level] || colors.info}[${level.toUpperCase()}]${colors.reset} ${message}`, meta);
    
    // File output
    this.writeToFile(level, formattedMessage);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, meta);
    }
  }
}

module.exports = new Logger();
