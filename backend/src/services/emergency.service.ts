import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import pool from '../database/connection';
import { QueryResult } from 'pg';
import { calculateDistance } from '../utils/locationUtils';

interface EmergencyRequestData {
  userId: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  medicalNotes?: string;
}

interface EmergencyRequestResponse {
  success: boolean;
  message: string;
  data?: {
    requestId: string;
    status: string;
    createdAt: Date;
  };
}

interface EmergencyStatusResponse {
  success: boolean;
  data?: {
    requestId: string;
    status: string;
    hospital?: {
      id: string;
      name: string;
      address: string;
      phoneNumber: string;
    };
    driver?: {
      id: string;
      name: string;
      phoneNumber: string;
      status: string;
      estimatedArrival: string;
    };
    createdAt: Date;
    acceptedAt?: Date;
  };
}

interface EmergencyHistoryResponse {
  success: boolean;
  data?: {
    total: number;
    page: number;
    limit: number;
    requests: Array<{
      requestId: string;
      status: string;
      hospital?: string;
      createdAt: Date;
      completedAt?: Date;
    }>;
  };
}

// Interface for nearby hospital
interface NearbyHospital {
  id: string;
  name: string;
  userId: string;
  distance: number;
  address: string;
  latitude: number;
  longitude: number;
  maxCapacity: number;
  currentRequests: number;
}

// Add a new interface for emergency location data
interface EmergencyLocation {
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
}

export class EmergencyService {
  /**
   * Find nearby hospitals sorted by distance
   * @param latitude Patient's latitude
   * @param longitude Patient's longitude
   * @param maxDistance Maximum distance in kilometers (default: 50)
   * @param limit Maximum number of hospitals to return (default: 10)
   * @returns Array of nearby hospitals sorted by distance
   */
  async findNearbyHospitals(
    latitude: number,
    longitude: number,
    maxDistance: number = 50,
    limit: number = 10,
  ): Promise<NearbyHospital[]> {
    try {
      // Query to get all hospitals with location data and their current request count
      const query = `
        SELECT 
          h.id, h.name, h.user_id, h.address, h.latitude, h.longitude, h.emergency_capacity as max_capacity,
          COUNT(er.id) FILTER (WHERE er.status = 'accepted' OR er.status = 'assigned') as current_requests
        FROM hospitals h
        LEFT JOIN emergency_requests er ON h.id = er.hospital_id
        WHERE h.is_active = true AND h.latitude IS NOT NULL AND h.longitude IS NOT NULL
        GROUP BY h.id
      `;

      const result: QueryResult = await pool.query(query);

      // Calculate distance for each hospital and filter by max distance
      const nearbyHospitals = result.rows
        .map((hospital) => {
          const distance = calculateDistance(
            latitude,
            longitude,
            hospital.latitude,
            hospital.longitude,
          );

          return {
            id: hospital.id,
            name: hospital.name,
            userId: hospital.user_id,
            address: hospital.address,
            latitude: hospital.latitude,
            longitude: hospital.longitude,
            distance,
            maxCapacity: hospital.max_capacity,
            currentRequests: parseInt(hospital.current_requests) || 0,
          };
        })
        .filter((hospital) => hospital.distance <= maxDistance)
        // Sort by distance (closest first)
        .sort((a, b) => a.distance - b.distance)
        // Take only the specified limit
        .slice(0, limit);

      return nearbyHospitals;
    } catch (error) {
      logger.error('Error finding nearby hospitals', { error });
      throw new ApiError(500, 'Failed to find nearby hospitals');
    }
  }

  /**
   * Create a new emergency request
   * @param requestData Emergency request data
   * @returns Response with created request info
   */
  async createEmergencyRequest(
    requestData: EmergencyRequestData,
  ): Promise<EmergencyRequestResponse> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create emergency request in database
      const query = `
        INSERT INTO emergency_requests (
          user_id, pickup_latitude, pickup_longitude, pickup_address, emergency_type, description, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, status, created_at
      `;

      const values = [
        requestData.userId,
        requestData.pickupLatitude,
        requestData.pickupLongitude,
        requestData.pickupAddress,
        'Medical Emergency', // Default emergency type
        requestData.medicalNotes || '', // Use medical notes as description
        'pending',
      ];

      const result: QueryResult = await client.query(query, values);
      const emergencyRequest = result.rows[0];

      await client.query('COMMIT');

      // Find nearby hospitals
      try {
        const nearbyHospitals = await this.findNearbyHospitals(
          requestData.pickupLatitude,
          requestData.pickupLongitude,
        );

        logger.info(
          `Found ${nearbyHospitals.length} nearby hospitals for emergency ${emergencyRequest.id}`,
        );

        // Here we would send the request to each hospital one by one
        // This would typically be done through a background job or queue
        // For demonstration, we'll log them here
        nearbyHospitals.forEach((hospital, index) => {
          logger.info(
            `Hospital ${index + 1}: ${hospital.name}, Distance: ${hospital.distance.toFixed(2)} km`,
          );

          // In a real implementation, we would:
          // 1. Send a notification to the hospital (via push, SMS, etc.)
          // 2. Wait for a response or timeout
          // 3. If accepted, assign this hospital to the request
          // 4. If rejected or timed out, move to the next hospital

          // For the demo, we'll just log that we would notify this hospital
          logger.info(
            `Would notify hospital ${hospital.name} about emergency ${emergencyRequest.id}`,
          );
        });
      } catch (error) {
        // Just log the error, don't prevent the request from being created
        logger.error('Error finding nearby hospitals', { error });
      }

      return {
        success: true,
        message: 'Emergency request created successfully',
        data: {
          requestId: emergencyRequest.id,
          status: emergencyRequest.status,
          createdAt: emergencyRequest.created_at,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating emergency request', { error });
      throw new ApiError(500, 'Failed to create emergency request');
    } finally {
      client.release();
    }
  }

  /**
   * Get status of an emergency request
   * @param requestId Emergency request ID
   * @param userId User ID
   * @returns Response with emergency request status
   */
  async getEmergencyRequestStatus(
    requestId: string,
    userId: string,
  ): Promise<EmergencyStatusResponse> {
    try {
      // Query to get emergency request with related hospital and driver info
      const query = `
        SELECT 
          er.id as request_id, er.status, er.created_at, er.updated_at as accepted_at,
          h.id as hospital_id, h.name as hospital_name, h.address as hospital_address, h.phone as hospital_phone,
          ea.id as assignment_id, ea.status as driver_status, ea.assigned_at,
          d.id as driver_id, 
          u.first_name as driver_first_name, u.last_name as driver_last_name, u.phone as driver_phone
        FROM emergency_requests er
        LEFT JOIN hospitals h ON er.hospital_id = h.id
        LEFT JOIN emergency_assignments ea ON er.id = ea.emergency_id
        LEFT JOIN drivers d ON ea.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE er.id = $1 AND er.user_id = $2
      `;

      const result: QueryResult = await pool.query(query, [requestId, userId]);

      if (result.rows.length === 0) {
        throw new ApiError(404, 'Emergency request not found');
      }

      const request = result.rows[0];

      // Prepare response data
      const responseData: EmergencyStatusResponse = {
        success: true,
        data: {
          requestId: request.request_id,
          status: request.status,
          createdAt: request.created_at,
          acceptedAt: request.accepted_at,
        },
      };

      // Add hospital data if available
      if (request.hospital_id) {
        responseData.data!.hospital = {
          id: request.hospital_id,
          name: request.hospital_name,
          address: request.hospital_address,
          phoneNumber: request.hospital_phone,
        };
      }

      // Add driver data if available
      if (request.driver_id) {
        const driverName = `${request.driver_first_name} ${request.driver_last_name}`;

        // Calculate estimated arrival time (this would normally use a more sophisticated calculation)
        const estimatedArrival = '5 minutes'; // Placeholder

        responseData.data!.driver = {
          id: request.driver_id,
          name: driverName,
          phoneNumber: request.driver_phone,
          status: request.driver_status,
          estimatedArrival,
        };
      }

      return responseData;
    } catch (error) {
      logger.error('Error getting emergency request status', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to get emergency request status');
    }
  }

  /**
   * Get user's emergency request history
   * @param userId User ID
   * @param page Page number
   * @param limit Items per page
   * @returns Response with emergency request history
   */
  async getUserEmergencyHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<EmergencyHistoryResponse> {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;

      // Query to get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM emergency_requests
        WHERE user_id = $1
      `;

      const countResult: QueryResult = await pool.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].total);

      // Query to get paginated history
      const historyQuery = `
        SELECT 
          er.id as request_id, er.status, er.created_at, er.updated_at as completed_at,
          h.name as hospital_name
        FROM emergency_requests er
        LEFT JOIN hospitals h ON er.hospital_id = h.id
        WHERE er.user_id = $1
        ORDER BY er.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const historyResult: QueryResult = await pool.query(historyQuery, [userId, limit, offset]);

      // Format the response
      const requests = historyResult.rows.map((row) => ({
        requestId: row.request_id,
        status: row.status,
        hospital: row.hospital_name || null,
        createdAt: row.created_at,
        completedAt: row.completed_at || null,
      }));

      return {
        success: true,
        data: {
          total,
          page,
          limit,
          requests,
        },
      };
    } catch (error) {
      logger.error('Error getting user emergency history', { error });
      throw new ApiError(500, 'Failed to get emergency request history');
    }
  }

  /**
   * Get emergency request location data by ID
   * @param requestId Emergency request ID
   * @returns Emergency location data or null if not found
   */
  async getEmergencyLocationById(requestId: string): Promise<EmergencyLocation | null> {
    try {
      const query = `
        SELECT pickup_latitude, pickup_longitude, pickup_address
        FROM emergency_requests
        WHERE id = $1
      `;

      const result: QueryResult = await pool.query(query, [requestId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        pickupLatitude: parseFloat(row.pickup_latitude),
        pickupLongitude: parseFloat(row.pickup_longitude),
        pickupAddress: row.pickup_address,
      };
    } catch (error) {
      logger.error('Error getting emergency location', { error, requestId });
      throw new ApiError(500, 'Failed to get emergency location data');
    }
  }
}
