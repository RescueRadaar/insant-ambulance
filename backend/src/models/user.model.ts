import { Pool, QueryResult } from 'pg';
import bcrypt from 'bcrypt';
import pool from '../database/connection';
import { logger } from '../utils/logger';
import { UserRole } from '../middleware/auth';

export interface UserData {
  id?: string;
  email: string;
  password: string;
  role?: UserRole;
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  date_of_birth?: Date;
  emergency_contact?: string;
  profile_picture?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class User {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Create a new user
   * @param userData User data to create
   * @returns Created user data
   */
  async create(userData: UserData): Promise<UserData> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const query = `
        INSERT INTO users (
          email, password, role, first_name, last_name, phone, address,
          date_of_birth, emergency_contact, profile_picture, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, email, role, first_name, last_name, phone, address,
                 date_of_birth, emergency_contact, profile_picture, is_active, created_at, updated_at
      `;

      const values = [
        userData.email,
        hashedPassword,
        userData.role || UserRole.USER,
        userData.first_name,
        userData.last_name,
        userData.phone,
        userData.address || null,
        userData.date_of_birth || null,
        userData.emergency_contact || null,
        userData.profile_picture || null,
        userData.is_active !== undefined ? userData.is_active : true,
      ];

      const result: QueryResult = await client.query(query, values);
      const user = result.rows[0];

      await client.query('COMMIT');

      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating user', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find user by email
   * @param email User email
   * @returns User data if found
   */
  async findByEmail(email: string): Promise<UserData | null> {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result: QueryResult = await this.pool.query(query, [email]);

      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error finding user by email', { error });
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param id User ID
   * @returns User data if found
   */
  async findById(id: string): Promise<UserData | null> {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result: QueryResult = await this.pool.query(query, [id]);

      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error finding user by ID', { error });
      throw error;
    }
  }

  /**
   * Verify password for a user
   * @param providedPassword Password to verify
   * @param storedPassword Stored hashed password
   * @returns True if password matches
   */
  async verifyPassword(providedPassword: string, storedPassword: string): Promise<boolean> {
    return await bcrypt.compare(providedPassword, storedPassword);
  }
}
