import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import pool from '../database/connection';
import { QueryResult } from 'pg';

interface AvailabilityStatusResponse {
  success: boolean;
  message: string;
  data: {
    isAvailable: boolean;
    updatedAt: Date;
  };
}

interface CurrentAssignmentResponse {
  success: boolean;
  data: {
    assignmentId: string;
    requestId: string;
    status: string;
    user: {
      name: string;
      phoneNumber: string;
    };
    pickup: {
      latitude: number;
      longitude: number;
      address: string;
    };
    hospital: {
      name: string;
      address: string;
    };
    medicalNotes: string;
    assignedAt: Date;
  } | null;
}

interface AssignmentStatusResponse {
  success: boolean;
  message: string;
  data: {
    assignmentId: string;
    status: string;
    updatedAt: Date;
  };
}

interface AssignmentHistoryResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    assignments: Array<{
      assignmentId: string;
      requestId: string;
      user: string;
      pickup: string;
      status: string;
      completedAt?: Date;
    }>;
  };
}

export class DriverService {
  /**
   * Update driver availability status
   * @param driverId Driver ID
   * @param isAvailable Availability status
   * @returns Response with updated status
   */
  async updateAvailabilityStatus(
    driverId: string,
    isAvailable: boolean,
  ): Promise<AvailabilityStatusResponse> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if driver exists
      const driverQuery = `
        SELECT id
        FROM drivers
        WHERE user_id = $1
      `;

      const driverResult: QueryResult = await client.query(driverQuery, [driverId]);

      if (driverResult.rows.length === 0) {
        throw new ApiError(404, 'Driver not found');
      }

      const driver = driverResult.rows[0];

      // Check if driver has active assignments
      if (!isAvailable) {
        // If driver is trying to go unavailable, check if they have active assignments
        const activeAssignmentQuery = `
          SELECT id
          FROM emergency_assignments
          WHERE driver_id = $1
          AND status IN ('assigned', 'en_route', 'arrived')
          LIMIT 1
        `;

        const activeAssignmentResult: QueryResult = await client.query(activeAssignmentQuery, [
          driver.id,
        ]);

        if (activeAssignmentResult.rows.length > 0) {
          throw new ApiError(400, 'Cannot change status to unavailable with active assignments');
        }
      }

      // Update driver status
      const updateQuery = `
        UPDATE drivers
        SET is_available = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING is_available, updated_at
      `;

      const updateResult: QueryResult = await client.query(updateQuery, [isAvailable, driver.id]);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Status updated successfully',
        data: {
          isAvailable: updateResult.rows[0].is_available,
          updatedAt: updateResult.rows[0].updated_at,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating driver availability status', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to update driver availability status');
    } finally {
      client.release();
    }
  }

  /**
   * Get driver's current assignment
   * @param driverId Driver ID (user ID)
   * @returns Response with current assignment details
   */
  async getCurrentAssignment(driverId: string): Promise<CurrentAssignmentResponse> {
    try {
      // Get driver ID from user ID
      const driverQuery = `
        SELECT id
        FROM drivers
        WHERE user_id = $1
      `;

      const driverResult: QueryResult = await pool.query(driverQuery, [driverId]);

      if (driverResult.rows.length === 0) {
        throw new ApiError(404, 'Driver not found');
      }

      const driver = driverResult.rows[0];

      // Get current assignment
      const assignmentQuery = `
        SELECT 
          ea.id as assignment_id, ea.emergency_id as request_id, ea.status, ea.assigned_at,
          er.description, er.pickup_address, er.pickup_latitude, er.pickup_longitude,
          u.first_name as user_first_name, u.last_name as user_last_name, u.phone as user_phone,
          h.name as hospital_name, h.address as hospital_address
        FROM emergency_assignments ea
        JOIN emergency_requests er ON ea.emergency_id = er.id
        JOIN users u ON er.user_id = u.id
        LEFT JOIN hospitals h ON er.hospital_id = h.id
        WHERE ea.driver_id = $1
        AND ea.status IN ('assigned', 'en_route', 'arrived')
        ORDER BY ea.assigned_at DESC
        LIMIT 1
      `;

      const assignmentResult: QueryResult = await pool.query(assignmentQuery, [driver.id]);

      // If no active assignment found
      if (assignmentResult.rows.length === 0) {
        return {
          success: true,
          data: null,
        };
      }

      const assignment = assignmentResult.rows[0];

      return {
        success: true,
        data: {
          assignmentId: assignment.assignment_id,
          requestId: assignment.request_id,
          status: assignment.status,
          user: {
            name: `${assignment.user_first_name} ${assignment.user_last_name}`,
            phoneNumber: assignment.user_phone,
          },
          pickup: {
            latitude: parseFloat(assignment.pickup_latitude),
            longitude: parseFloat(assignment.pickup_longitude),
            address: assignment.pickup_address,
          },
          hospital: {
            name: assignment.hospital_name,
            address: assignment.hospital_address,
          },
          medicalNotes: assignment.description || '',
          assignedAt: assignment.assigned_at,
        },
      };
    } catch (error) {
      logger.error('Error getting current assignment', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to get current assignment');
    }
  }

  /**
   * Update assignment status
   * @param assignmentId Assignment ID
   * @param driverId Driver ID (user ID)
   * @param status New status
   * @returns Response with updated status
   */
  async updateAssignmentStatus(
    assignmentId: string,
    driverId: string,
    status: string,
  ): Promise<AssignmentStatusResponse> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get driver ID from user ID
      const driverQuery = `
        SELECT id
        FROM drivers
        WHERE user_id = $1
      `;

      const driverResult: QueryResult = await client.query(driverQuery, [driverId]);

      if (driverResult.rows.length === 0) {
        throw new ApiError(404, 'Driver not found');
      }

      const driver = driverResult.rows[0];

      // Check if assignment exists and belongs to this driver
      const assignmentQuery = `
        SELECT id, status, emergency_id
        FROM emergency_assignments
        WHERE id = $1 AND driver_id = $2
      `;

      const assignmentResult: QueryResult = await client.query(assignmentQuery, [
        assignmentId,
        driver.id,
      ]);

      if (assignmentResult.rows.length === 0) {
        throw new ApiError(404, 'Assignment not found or not assigned to this driver');
      }

      const assignment = assignmentResult.rows[0];

      // Validate status transition
      const validStatusMap: Record<string, string[]> = {
        assigned: ['en_route'],
        en_route: ['arrived'],
        arrived: ['completed'],
      };

      if (!validStatusMap[assignment.status]?.includes(status)) {
        throw new ApiError(400, `Cannot transition from ${assignment.status} to ${status}`);
      }

      // Update fields based on new status
      let updateAssignmentQuery = `
        UPDATE emergency_assignments
        SET status = $1
      `;

      const queryParams: any[] = [status];

      // Add timestamp fields based on status
      if (status === 'en_route') {
        updateAssignmentQuery += `, en_route_at = NOW()`;
      } else if (status === 'arrived') {
        updateAssignmentQuery += `, arrived_at = NOW()`;
      } else if (status === 'completed') {
        updateAssignmentQuery += `, completed_at = NOW()`;

        // If completed, make driver available again
        await client.query(
          `UPDATE drivers SET is_available = true, updated_at = NOW() WHERE id = $1`,
          [driver.id],
        );

        // Also update emergency request status to completed
        await client.query(
          `UPDATE emergency_requests SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [assignment.emergency_id],
        );
      }

      updateAssignmentQuery += `, updated_at = NOW() WHERE id = $2 RETURNING status, updated_at`;
      queryParams.push(assignmentId);

      const updateResult: QueryResult = await client.query(updateAssignmentQuery, queryParams);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Assignment status updated successfully',
        data: {
          assignmentId,
          status: updateResult.rows[0].status,
          updatedAt: updateResult.rows[0].updated_at,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating assignment status', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to update assignment status');
    } finally {
      client.release();
    }
  }

  /**
   * Get driver's assignment history
   * @param driverId Driver ID (user ID)
   * @param page Page number
   * @param limit Items per page
   * @returns Response with assignment history
   */
  async getAssignmentHistory(
    driverId: string,
    page: number,
    limit: number,
  ): Promise<AssignmentHistoryResponse> {
    try {
      // Get driver ID from user ID
      const driverQuery = `
        SELECT id
        FROM drivers
        WHERE user_id = $1
      `;

      const driverResult: QueryResult = await pool.query(driverQuery, [driverId]);

      if (driverResult.rows.length === 0) {
        throw new ApiError(404, 'Driver not found');
      }

      const driver = driverResult.rows[0];

      // Calculate offset
      const offset = (page - 1) * limit;

      // Query to get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM emergency_assignments
        WHERE driver_id = $1
      `;

      const countResult: QueryResult = await pool.query(countQuery, [driver.id]);
      const total = parseInt(countResult.rows[0].total);

      // Query to get paginated history
      const historyQuery = `
        SELECT 
          ea.id as assignment_id, ea.emergency_id as request_id, ea.status, ea.completed_at,
          u.first_name as user_first_name, u.last_name as user_last_name,
          er.pickup_address
        FROM emergency_assignments ea
        JOIN emergency_requests er ON ea.emergency_id = er.id
        JOIN users u ON er.user_id = u.id
        WHERE ea.driver_id = $1
        ORDER BY ea.assigned_at DESC
        LIMIT $2 OFFSET $3
      `;

      const historyResult: QueryResult = await pool.query(historyQuery, [driver.id, limit, offset]);

      // Format the response
      const assignments = historyResult.rows.map((row) => ({
        assignmentId: row.assignment_id,
        requestId: row.request_id,
        user: `${row.user_first_name} ${row.user_last_name}`,
        pickup: row.pickup_address,
        status: row.status,
        completedAt: row.completed_at || null,
      }));

      return {
        success: true,
        data: {
          total,
          page,
          limit,
          assignments,
        },
      };
    } catch (error) {
      logger.error('Error getting assignment history', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to get assignment history');
    }
  }
}
