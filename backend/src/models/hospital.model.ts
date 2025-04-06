import { Pool, QueryResult } from 'pg';
import pool from '../database/connection';
import { logger } from '../utils/logger';
import { User, UserData } from './user.model';
import { UserRole } from '../middleware/auth';

export interface HospitalData {
  id?: string;
  user_id?: string;
  name: string;
  license_number?: string;
  hospital_type?: string;
  specialty?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  website?: string;
  emergency_capacity: number;
  is_active?: boolean;
  is_approved?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Hospital {
  private pool: Pool;
  private userModel: User;

  constructor() {
    this.pool = pool;
    this.userModel = new User();
  }

  /**
   * Create a new hospital with user account
   * @param hospitalData Hospital data
   * @param password Password for the associated user account
   * @returns Created hospital data
   */
  async create(
    hospitalData: HospitalData,
    password: string,
  ): Promise<{ hospital: HospitalData; user: UserData }> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create user account for hospital
      const userData: UserData = {
        email: hospitalData.email,
        password,
        role: UserRole.HOSPITAL,
        first_name: hospitalData.name,
        last_name: '',
        phone: hospitalData.phone,
      };

      // Use client directly to maintain transaction
      const userQuery = `
        INSERT INTO users (
          email, password, role, first_name, last_name, phone, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, role, first_name, last_name, phone, is_active, created_at, updated_at
      `;

      // Hash password
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userValues = [
        userData.email,
        hashedPassword,
        userData.role,
        userData.first_name,
        userData.last_name,
        userData.phone,
        true,
      ];

      const userResult: QueryResult = await client.query(userQuery, userValues);
      const user = userResult.rows[0];

      // Create hospital entry
      const hospitalQuery = `
        INSERT INTO hospitals (
          user_id, name, license_number, hospital_type, specialty, address, 
          latitude, longitude, phone, email, website, emergency_capacity, is_active, is_approved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, user_id, name, license_number, hospital_type, specialty, address,
                 latitude, longitude, phone, email, website, emergency_capacity, 
                 is_active, is_approved, created_at, updated_at
      `;

      const hospitalValues = [
        user.id,
        hospitalData.name,
        hospitalData.license_number || `H-${Math.floor(Math.random() * 1000000)}`,
        hospitalData.hospital_type || 'General',
        hospitalData.specialty || null,
        hospitalData.address,
        hospitalData.latitude || null,
        hospitalData.longitude || null,
        hospitalData.phone,
        hospitalData.email,
        hospitalData.website || null,
        hospitalData.emergency_capacity,
        hospitalData.is_active !== undefined ? hospitalData.is_active : true,
        hospitalData.is_approved !== undefined ? hospitalData.is_approved : false,
      ];

      const hospitalResult: QueryResult = await client.query(hospitalQuery, hospitalValues);
      const hospital = hospitalResult.rows[0];

      await client.query('COMMIT');

      return { hospital, user };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating hospital', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find hospital by ID
   * @param id Hospital ID
   * @returns Hospital data if found
   */
  async findById(id: string): Promise<HospitalData | null> {
    try {
      const query = 'SELECT * FROM hospitals WHERE id = $1';
      const result: QueryResult = await this.pool.query(query, [id]);

      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error finding hospital by ID', { error });
      throw error;
    }
  }

  /**
   * Find hospital by user ID
   * @param userId User ID
   * @returns Hospital data if found
   */
  async findByUserId(userId: string): Promise<HospitalData | null> {
    try {
      const query = 'SELECT * FROM hospitals WHERE user_id = $1';
      const result: QueryResult = await this.pool.query(query, [userId]);

      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error finding hospital by user ID', { error });
      throw error;
    }
  }

  /**
   * Find hospital by email
   * @param email Hospital email
   * @returns Hospital data if found
   */
  async findByEmail(email: string): Promise<HospitalData | null> {
    try {
      const query = 'SELECT * FROM hospitals WHERE email = $1';
      const result: QueryResult = await this.pool.query(query, [email]);

      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error finding hospital by email', { error });
      throw error;
    }
  }
}
