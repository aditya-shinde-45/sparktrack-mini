import config from '../config/index.js';

/**
 * Enhanced logging utility
 */
class Logger {
  /**
   * Log info message
   */
  info(message) {
    console.log(`ℹ️ [INFO] ${message}`);
  }

  /**
   * Log success message
   */
  success(message) {
    console.log(`✅ [SUCCESS] ${message}`);
  }

  /**
   * Log error message
   */
  error(message, error = null) {
    console.error(`❌ [ERROR] ${message}`);
    if (error && config.server.env === 'development') {
      console.error(error);
    }
  }

  /**
   * Log warning message
   */
  warn(message) {
    console.warn(`⚠️ [WARNING] ${message}`);
  }

  /**
   * Log debug message (only in development)
   */
  debug(message, data = null) {
    if (config.server.env === 'development') {
      console.log(`🔍 [DEBUG] ${message}`);
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Log server startup message
   */
  serverStarted(port, environment) {
    console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🚀 SparkTrack API Server Started!       ║
║                                           ║
║   🌐 PORT:    ${port.toString().padEnd(24)} ║
║   🔧 ENV:     ${environment.padEnd(24)} ║
║   ⏰ TIME:    ${new Date().toISOString().padEnd(24)} ║
║                                           ║
╚═══════════════════════════════════════════╝
    `);
  }
}

export default new Logger();