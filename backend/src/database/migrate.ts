import fs from 'fs';
import path from 'path';
import pool from './connection';
import { logger } from '../utils/logger';

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    logger.info('Starting database migrations');

    // Migrations directory
    const migrationsDir = path.join(__dirname, 'migrations');

    // Read all migration files
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Sort by filename to ensure correct order

    logger.info(`Found ${migrationFiles.length} migration files`);

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get applied migrations
    const { rows: appliedMigrations } = await pool.query('SELECT name FROM migrations');
    const appliedMigrationNames = appliedMigrations.map((row) => row.name);

    // Get client for transaction
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Apply each migration
      for (const file of migrationFiles) {
        // Skip if already applied
        if (appliedMigrationNames.includes(file)) {
          logger.info(`Migration ${file} already applied`);
          continue;
        }

        logger.info(`Applying migration: ${file}`);

        // Read and execute migration file
        const migrationPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await client.query(sql);

        // Record migration
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);

        logger.info(`Successfully applied migration: ${file}`);
      }

      // Commit transaction
      await client.query('COMMIT');
      logger.info('All migrations applied successfully');
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release client
      client.release();
    }
  } catch (error) {
    logger.error('Migration failed', { error });
    throw error;
  }
}

// Run migrations directly if this script is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration complete');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Migration failed', { error: err });
      process.exit(1);
    });
}

export default runMigrations;
