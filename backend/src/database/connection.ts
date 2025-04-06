import { Pool } from 'pg';
import config from '../config';
import { logger } from '../utils/logger';

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  max: config.database.maxPool,
  idleTimeoutMillis: config.database.idleTimeout,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Error in PostgreSQL connection', { error: err.message });
});

export default pool;
