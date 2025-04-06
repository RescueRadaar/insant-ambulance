import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',

  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || '/api/v1',
  },

  // Database configuration
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'instant_ambulance',
    maxPool: parseInt(process.env.POSTGRES_MAX_POOL || '20', 10),
    idleTimeout: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000', 10),
  },

  // JWT configuration
  jwt: {
    secret: Buffer.from(process.env.JWT_SECRET || 'default_jwt_secret_key', 'utf-8'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: Buffer.from(
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key',
      'utf-8',
    ),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || path.join(process.cwd(), 'logs', 'app.log'),
  },

  // CORS configuration
  cors: {
    allowedOrigins: (
      process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173'
    ).split(','),
  },
};

export default config;
