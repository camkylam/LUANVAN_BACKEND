const { createLogger, format, transports, addColors } = require('winston');

const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ],
  format: format.combine(
    format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
    format.splat(),
    format.printf(({ level, message, timestamp }) => {
      return `${timestamp} - ${level}: ${message}\n`
    })
  )
});


module.exports = {
  logger,
  apiLogger: (req, res, message, level) => {
    if (level == 'error')
      logger.error(`${req.method} - ${req.originalUrl}: ${message}`);
    else
      logger.info(`${req.method} - ${req.originalUrl}: ${message}`);
  }
} 