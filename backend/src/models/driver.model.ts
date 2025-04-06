import { Pool, QueryResult } from 'pg';
import pool from '../database/connection';
import { logger } from '../utils/logger';
import { User, UserData } from './user.model';
import { UserRole } from '../middleware/auth';

export interface DriverData {
  id?: string;
  user_id?: string;
  license_number: string;
  license_expiry?: Date;
  vehicle_type?: string;
  vehicle_registration?: string;
  is_available?: boolean;
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: Date;
  is_active?: boolean;
  is_approved?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Driver {
  private pool: Pool;
  private userModel: User;

  constructor() {
    this.pool = pool;
    this.userModel = new User();
  }

  /**
   * Create a new driver with user account
   * @param driverData Driver data
   * @param userData User data for the associated user account
   * @returns Created driver data with user
   */
  async create(
    driverData: DriverData,
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      password: string;
    },
  ): Promise<{ driver: DriverData; user: UserData }> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create user account for driver
      const userDataToCreate: UserData = {
        email: userData.email,
        password: userData.password,
        role: UserRole.DRIVER,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phoneNumber,
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
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const userValues = [
        userDataToCreate.email,
        hashedPassword,
        userDataToCreate.role,
        userDataToCreate.first_name,
        userDataToCreate.last_name,
        userDataToCreate.phone,
        true,
      ];

      const userResult: QueryResult = await client.query(userQuery, userValues);
      const user = userResult.rows[0];

      // Create driver entry
      const driverQuery = `
        INSERT INTO drivers (
          user_id, license_number, license_expiry, vehicle_type, 
          vehicle_registration, is_available, is_active, is_approved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_id, license_number, license_expiry, vehicle_type, 
                 vehicle_registration, is_available, current_latitude, current_longitude, 
                 last_location_update, is_active, is_approved, created_at, updated_at
      `;

      // Calculate license expiry date if not provided (1 year from now)
      const licenseExpiry =
        driverData.license_expiry || new Date(new Date().setFullYear(new Date().getFullYear() + 1));

      const driverValues = [
        user.id,
        driverData.license_number,
        licenseExpiry,
        driverData.vehicle_type || 'Ambulance',
        driverData.vehicle_registration || `AMB-${Math.floor(Math.random() * 10000)}`,
        driverData.is_available !== undefined ? driverData.is_available : true,
        driverData.is_active !== undefined ? driverData.is_active : true,
        driverData.is_approved !== undefined ? driverData.is_approved : false,
      ];

      const driverResult: QueryResult = await client.query(driverQuery, driverValues);
      const driver = driverResult.rows[0];

      await client.query('COMMIT');

      return { driver, user };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating driver', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find driver by ID
   * @param id Driver ID
   * @returns Driver data if found
   */
  async findById(id: string): Promise<DriverData | null> {
    try {
      const query = 'SELECT * FROM drivers WHERE id = $1';
      const result: QueryResult = await this.pool.query(query, [id]);

      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error finding driver by ID', { error });
      throw error;
    }
  }

  /**
   * Find driver by user ID
   * @param userId User ID
   * @returns Driver data if found
   */
  async findByUserId(userId: string): Promise<DriverData | null> {
    try {
      const query = 'SELECT * FROM drivers WHERE user_id = $1';
      const result: QueryResult = await this.pool.query(query, [userId]);

      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error finding driver by user ID', { error });
      throw error;
    }
  }

  /**
   * Update driver location
   * @param driverId Driver ID
   * @param latitude Current latitude
   * @param longitude Current longitude
   * @returns Updated driver data
   */
  async updateLocation(
    driverId: string,
    latitude: number,
    longitude: number,
  ): Promise<DriverData | null> {
    try {
      const query = `
        UPDATE drivers 
        SET current_latitude = $1, current_longitude = $2, last_location_update = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;

      const result: QueryResult = await this.pool.query(query, [latitude, longitude, driverId]);

      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error updating driver location', { error });
      throw error;
    }
  }

  /**
   * Update driver availability
   * @param driverId Driver ID
   * @param isAvailable Availability status
   * @returns Updated driver data
   */
  async updateAvailability(driverId: string, isAvailable: boolean): Promise<DriverData | null> {
    try {
      const query = `
        UPDATE drivers 
        SET is_available = $1
        WHERE id = $2
        RETURNING *
      `;

      const result: QueryResult = await this.pool.query(query, [isAvailable, driverId]);

      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error updating driver availability', { error });
      throw error;
    }
  }
}
