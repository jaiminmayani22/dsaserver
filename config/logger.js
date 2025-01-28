const winston = require("winston");
const config = require("config");
const path = require("path");
const fs = require("fs");

const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: config.get("STATUS").INFO,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: `${logDir}/${new Date().toISOString().split('T')[0]}.log`, // Creates a log file named by the current date (e.g., 2025-01-28.log)
      format: winston.format.combine(
        winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
        // winston.format.align(),
        winston.format.printf(info => `${info.level} : ${[info.timestamp]} :  ${info.message} :  ${info.request_params || ""}`),
      )
    }),
  ],
});

function log(type, message, data = { data: config.get("NO_DEBUG_DATA") }) {
  switch (type) {
    case config.get("STATUS").INFO:
      logger.info(message, data);
      break;
    case config.get("STATUS").DEBUG:
      logger.debug(message, data);
      break;
    case config.get("STATUS").WARN:
      logger.warn(message, data);
      break;
    case config.get("STATUS").ERROR:
      logger.error(message, data);
      break;
    default:
      logger.info(message, data);
      break;
  }
}

module.exports = { log, logger };
