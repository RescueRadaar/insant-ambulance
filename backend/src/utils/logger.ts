import winston from 'winston';
import fs from 'fs';
import path from 'path';
import config from '../config';

// Ensure log directory exists
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Create Winston logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'instant-ambulance-api' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...rest }) => {
          return `[${timestamp}] ${service} ${level}: ${message} ${
            Object.keys(rest).length ? JSON.stringify(rest, null, 2) : ''
          }`;
        }),
      ),
    }),

    // File transport
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Create a stream object for Morgan
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
