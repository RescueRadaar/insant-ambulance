import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import pool from '../database/connection';
import { QueryResult } from 'pg';
import { calculateDistance } from '../utils/locationUtils';

interface PendingEmergencyResponse {
  success: boolean;
  data: {
    requests: Array<{
      requestId: string;
      user: {
        name: string;
        phoneNumber: string;
      };
      pickupLocation: {
        latitude: number;
        longitude: number;
        address: string;
      };
      medicalNotes: string;
      distance: string;
      createdAt: Date;
    }>;
  };
}

interface AcceptEmergencyResponse {
  success: boolean;
  message: string;
  data: {
    requestId: string;
    availableDrivers: Array<{
      id: string;
      name: string;
      isAvailable: boolean;
      lastAssignment: Date | null;
    }>;
  };
}

interface AssignDriverResponse {
  success: boolean;
  message: string;
  data: {
    requestId: string;
    assignmentId: string;
    driver: {
      id: string;
      name: string;
      phoneNumber: string;
    };
  };
}

interface ActiveEmergencyResponse {
  success: boolean;
  data: {
    total: number;
    requests: Array<{
      requestId: string;
      user: {
        name: string;
        phoneNumber: string;
      };
      status: string;
      driver: {
        id: string;
        name: string;
        status: string;
      };
      createdAt: Date;
    }>;
  };
}

interface HospitalDriversResponse {
  success: boolean;
  data: {
    total: number;
    drivers: Array<{
      id: string;
      name: string;
      email: string;
      phoneNumber: string;
      licenseNumber: string;
      isAvailable: boolean;
      isApproved: boolean;
      createdAt: Date;
    }>;
  };
}

interface ApproveDriverResponse {
  success: boolean;
  message: string;
  data: {
    driverId: string;
    name: string;
    email: string;
  };
}

export class HospitalService {
  /**
   * Get list of pending emergency requests for a hospital
   * @param hospitalId Hospital ID
   * @returns Response with pending emergency requests
   */
  async getPendingEmergencyRequests(hospitalId: string): Promise<PendingEmergencyResponse> {
    try {
      // First, get hospital location for distance calculation
      const hospitalQuery = `
        SELECT latitude, longitude
        FROM hospitals
        WHERE user_id = $1
      `;

      const hospitalResult: QueryResult = await pool.query(hospitalQuery, [hospitalId]);

      if (hospitalResult.rows.length === 0) {
        throw new ApiError(404, 'Hospital not found');
      }

      const hospital = hospitalResult.rows[0];

      // Get all pending requests
      const requestsQuery = `
        SELECT 
          er.id, er.user_id, er.description, er.pickup_address, 
          er.pickup_latitude, er.pickup_longitude, er.created_at,
          u.first_name, u.last_name, u.phone
        FROM emergency_requests er
        JOIN users u ON er.user_id = u.id
        WHERE er.status = 'pending'
        ORDER BY er.created_at DESC
      `;

      const requestsResult: QueryResult = await pool.query(requestsQuery);

      // Format the response and calculate distances
      const requests = requestsResult.rows.map((row) => {
        // Calculate distance in kilometers
        const distance = calculateDistance(
          hospital.latitude,
          hospital.longitude,
          row.pickup_latitude,
          row.pickup_longitude,
        );

        return {
          requestId: row.id,
          user: {
            name: `${row.first_name} ${row.last_name}`,
            phoneNumber: row.phone,
          },
          pickupLocation: {
            latitude: parseFloat(row.pickup_latitude),
            longitude: parseFloat(row.pickup_longitude),
            address: row.pickup_address,
          },
          medicalNotes: row.description || '',
          distance: `${distance.toFixed(1)} km`,
          createdAt: row.created_at,
        };
      });

      return {
        success: true,
        data: {
          requests,
        },
      };
    } catch (error) {
      logger.error('Error getting pending emergency requests', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to get pending emergency requests');
    }
  }

  /**
   * Accept an emergency request
   * @param requestId Emergency request ID
   * @param hospitalId Hospital ID
   * @returns Response with available drivers
   */
  async acceptEmergencyRequest(
    requestId: string,
    hospitalId: string,
  ): Promise<AcceptEmergencyResponse> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if request exists and is still pending
      const requestQuery = `
        SELECT status
        FROM emergency_requests
        WHERE id = $1
      `;

      const requestResult: QueryResult = await client.query(requestQuery, [requestId]);

      if (requestResult.rows.length === 0) {
        throw new ApiError(404, 'Emergency request not found');
      }

      if (requestResult.rows[0].status !== 'pending') {
        throw new ApiError(400, 'Emergency request is no longer pending');
      }

      // Get hospital ID from user ID
      const hospitalQuery = `
        SELECT id
        FROM hospitals
        WHERE user_id = $1
      `;

      const hospitalResult: QueryResult = await client.query(hospitalQuery, [hospitalId]);

      if (hospitalResult.rows.length === 0) {
        throw new ApiError(404, 'Hospital not found');
      }

      const hospital = hospitalResult.rows[0];

      // Update request status and assign hospital
      const updateQuery = `
        UPDATE emergency_requests
        SET status = 'accepted', hospital_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id
      `;

      await client.query(updateQuery, [hospital.id, requestId]);

      // Get available drivers
      // Since there's no direct hospital-driver relationship in the schema,
      // we'll just get all approved and available drivers
      const driversQuery = `
        SELECT 
          d.id, u.first_name, u.last_name, d.is_available,
          (
            SELECT MAX(ea.assigned_at)
            FROM emergency_assignments ea
            WHERE ea.driver_id = d.id
          ) as last_assignment
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.is_approved = true
        AND d.is_active = true
        ORDER BY d.is_available DESC, last_assignment ASC
      `;

      const driversResult: QueryResult = await client.query(driversQuery);

      const availableDrivers = driversResult.rows.map((row) => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        isAvailable: row.is_available,
        lastAssignment: row.last_assignment,
      }));

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Emergency request accepted successfully',
        data: {
          requestId,
          availableDrivers,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error accepting emergency request', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to accept emergency request');
    } finally {
      client.release();
    }
  }

  /**
   * Assign a driver to an emergency request
   * @param requestId Emergency request ID
   * @param hospitalId Hospital ID (user ID)
   * @param driverId Driver ID
   * @returns Response with assignment details
   */
  async assignDriverToEmergency(
    requestId: string,
    hospitalId: string,
    driverId: string,
  ): Promise<AssignDriverResponse> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get hospital ID from user ID
      const hospitalQuery = `
        SELECT id
        FROM hospitals
        WHERE user_id = $1
      `;

      const hospitalResult: QueryResult = await client.query(hospitalQuery, [hospitalId]);

      if (hospitalResult.rows.length === 0) {
        throw new ApiError(404, 'Hospital not found');
      }

      const hospital = hospitalResult.rows[0];

      // Check if request exists, is accepted, and belongs to this hospital
      const requestQuery = `
        SELECT status
        FROM emergency_requests
        WHERE id = $1 AND hospital_id = $2
      `;

      const requestResult: QueryResult = await client.query(requestQuery, [requestId, hospital.id]);

      if (requestResult.rows.length === 0) {
        throw new ApiError(404, 'Emergency request not found or not assigned to this hospital');
      }

      if (requestResult.rows[0].status !== 'accepted') {
        throw new ApiError(400, 'Emergency request must be in accepted status to assign a driver');
      }

      // Check if driver exists and is available
      const driverQuery = `
        SELECT d.id, d.is_available, u.first_name, u.last_name, u.phone
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = $1 AND d.is_approved = true AND d.is_active = true
      `;

      const driverResult: QueryResult = await client.query(driverQuery, [driverId]);

      if (driverResult.rows.length === 0) {
        throw new ApiError(404, 'Driver not found or not approved');
      }

      const driver = driverResult.rows[0];

      if (!driver.is_available) {
        throw new ApiError(400, 'Driver is currently unavailable');
      }

      // Update request status to assigned
      const updateRequestQuery = `
        UPDATE emergency_requests
        SET status = 'assigned', updated_at = NOW()
        WHERE id = $1
      `;

      await client.query(updateRequestQuery, [requestId]);

      // Create assignment
      const createAssignmentQuery = `
        INSERT INTO emergency_assignments (
          emergency_id, driver_id, assigned_at, status
        ) VALUES ($1, $2, NOW(), 'assigned')
        RETURNING id
      `;

      const assignmentResult: QueryResult = await client.query(createAssignmentQuery, [
        requestId,
        driverId,
      ]);

      const assignmentId = assignmentResult.rows[0].id;

      // Update driver status to unavailable
      const updateDriverQuery = `
        UPDATE drivers
        SET is_available = false, updated_at = NOW()
        WHERE id = $1
      `;

      await client.query(updateDriverQuery, [driverId]);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Driver assigned successfully',
        data: {
          requestId,
          assignmentId,
          driver: {
            id: driver.id,
            name: `${driver.first_name} ${driver.last_name}`,
            phoneNumber: driver.phone,
          },
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error assigning driver to emergency', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to assign driver to emergency');
    } finally {
      client.release();
    }
  }

  /**
   * Get active emergency requests for a hospital
   * @param hospitalId Hospital ID (user ID)
   * @returns Response with active emergency requests
   */
  async getActiveEmergencyRequests(hospitalId: string): Promise<ActiveEmergencyResponse> {
    try {
      // Get hospital ID from user ID
      const hospitalQuery = `
        SELECT id
        FROM hospitals
        WHERE user_id = $1
      `;

      const hospitalResult: QueryResult = await pool.query(hospitalQuery, [hospitalId]);

      if (hospitalResult.rows.length === 0) {
        throw new ApiError(404, 'Hospital not found');
      }

      const hospital = hospitalResult.rows[0];

      // Get active requests (accepted, assigned, in_progress)
      const requestsQuery = `
        SELECT 
          er.id as request_id, er.status, er.created_at,
          u.first_name as user_first_name, u.last_name as user_last_name, u.phone as user_phone,
          d.id as driver_id, du.first_name as driver_first_name, du.last_name as driver_last_name,
          ea.status as driver_status
        FROM emergency_requests er
        JOIN users u ON er.user_id = u.id
        LEFT JOIN emergency_assignments ea ON er.id = ea.emergency_id
        LEFT JOIN drivers d ON ea.driver_id = d.id
        LEFT JOIN users du ON d.user_id = du.id
        WHERE er.hospital_id = $1
        AND er.status IN ('accepted', 'assigned', 'in_progress')
        ORDER BY er.created_at DESC
      `;

      const requestsResult: QueryResult = await pool.query(requestsQuery, [hospital.id]);

      const requests = requestsResult.rows.map((row) => {
        const request = {
          requestId: row.request_id,
          user: {
            name: `${row.user_first_name} ${row.user_last_name}`,
            phoneNumber: row.user_phone,
          },
          status: row.status,
          createdAt: row.created_at,
          driver: null as any,
        };

        // Add driver info if available
        if (row.driver_id) {
          request.driver = {
            id: row.driver_id,
            name: `${row.driver_first_name} ${row.driver_last_name}`,
            status: row.driver_status,
          };
        }

        return request;
      });

      return {
        success: true,
        data: {
          total: requests.length,
          requests,
        },
      };
    } catch (error) {
      logger.error('Error getting active emergency requests', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to get active emergency requests');
    }
  }

  /**
   * Get list of hospital drivers
   * @param hospitalId Hospital ID (user ID)
   * @param status Driver status filter
   * @returns Response with hospital drivers
   */
  async getHospitalDrivers(hospitalId: string, status: string): Promise<HospitalDriversResponse> {
    try {
      // Since there's no direct hospital-driver relationship in the schema,
      // we'll retrieve all drivers and later would need a mechanism to associate drivers with hospitals

      // For now, we'll get all drivers
      let statusFilter = '';

      if (status === 'available') {
        statusFilter = 'AND d.is_available = true';
      } else if (status === 'unavailable') {
        statusFilter = 'AND d.is_available = false';
      } else if (status === 'pending') {
        statusFilter = 'AND d.is_approved = false';
      }

      const driversQuery = `
        SELECT 
          d.id, d.license_number, d.is_available, d.is_approved, d.created_at,
          u.first_name, u.last_name, u.email, u.phone
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.is_active = true ${statusFilter}
        ORDER BY d.created_at DESC
      `;

      const driversResult: QueryResult = await pool.query(driversQuery);

      const drivers = driversResult.rows.map((row) => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        phoneNumber: row.phone,
        licenseNumber: row.license_number,
        isAvailable: row.is_available,
        isApproved: row.is_approved,
        createdAt: row.created_at,
      }));

      return {
        success: true,
        data: {
          total: drivers.length,
          drivers,
        },
      };
    } catch (error) {
      logger.error('Error getting hospital drivers', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to get hospital drivers');
    }
  }

  /**
   * Approve a driver registration
   * @param driverId Driver ID
   * @param hospitalId Hospital ID (user ID)
   * @returns Response with approved driver info
   */
  async approveDriver(driverId: string, hospitalId: string): Promise<ApproveDriverResponse> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Since there's no direct hospital-driver relationship in the schema,
      // we'll check if the driver exists and update their approval status

      // Check if driver exists
      const driverQuery = `
        SELECT d.id, d.is_approved, u.first_name, u.last_name, u.email
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = $1
      `;

      const driverResult: QueryResult = await client.query(driverQuery, [driverId]);

      if (driverResult.rows.length === 0) {
        throw new ApiError(404, 'Driver not found');
      }

      const driver = driverResult.rows[0];

      if (driver.is_approved) {
        throw new ApiError(400, 'Driver is already approved');
      }

      // Update driver to approved
      const updateQuery = `
        UPDATE drivers
        SET is_approved = true, updated_at = NOW()
        WHERE id = $1
      `;

      await client.query(updateQuery, [driverId]);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Driver approved successfully',
        data: {
          driverId: driver.id,
          name: `${driver.first_name} ${driver.last_name}`,
          email: driver.email,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error approving driver', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to approve driver');
    } finally {
      client.release();
    }
  }
}
