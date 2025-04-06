import { Request, Response, NextFunction } from 'express';
import { EmergencyService } from '../services/emergency.service';
import { logger } from '../utils/logger';
import { JwtPayload } from '../middleware/auth';

class EmergencyController {
  private emergencyService: EmergencyService;

  constructor() {
    this.emergencyService = new EmergencyService();
    this.createEmergency = this.createEmergency.bind(this);
    this.getEmergencyStatus = this.getEmergencyStatus.bind(this);
    this.getEmergencyHistory = this.getEmergencyHistory.bind(this);
    this.getNearbyHospitals = this.getNearbyHospitals.bind(this);
  }

  /**
   * Create a new emergency request
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async createEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as JwtPayload).id;
      const { pickupLatitude, pickupLongitude, pickupAddress, medicalNotes } = req.body;

      const result = await this.emergencyService.createEmergencyRequest({
        userId,
        pickupLatitude,
        pickupLongitude,
        pickupAddress,
        medicalNotes,
      });

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error creating emergency request', { error });
      next(error);
    }
  }

  /**
   * Get status of an emergency request
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async getEmergencyStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as JwtPayload).id;
      const requestId = req.params.requestId;

      const result = await this.emergencyService.getEmergencyRequestStatus(requestId, userId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting emergency request status', { error });
      next(error);
    }
  }

  /**
   * Get user's emergency request history
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async getEmergencyHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as JwtPayload).id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.emergencyService.getUserEmergencyHistory(userId, page, limit);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting emergency request history', { error });
      next(error);
    }
  }

  /**
   * Get nearby hospitals for an emergency request
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async getNearbyHospitals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as JwtPayload).id;
      const requestId = req.params.requestId;
      const maxDistance = parseInt(req.query.maxDistance as string) || 50; // Default 50km
      const limit = parseInt(req.query.limit as string) || 10; // Default 10 hospitals

      // First, get the emergency request to confirm ownership and get coordinates
      const requestResult = await this.emergencyService.getEmergencyRequestStatus(
        requestId,
        userId,
      );

      if (!requestResult.success || !requestResult.data) {
        res.status(404).json({ success: false, error: { message: 'Emergency request not found' } });
        return;
      }

      // Now fetch nearby hospitals based on the emergency location
      const emergencyRequest = await this.emergencyService.getEmergencyLocationById(requestId);

      if (!emergencyRequest) {
        res.status(404).json({
          success: false,
          error: { message: 'Emergency request location data not available' },
        });
        return;
      }

      const nearbyHospitals = await this.emergencyService.findNearbyHospitals(
        emergencyRequest.pickupLatitude,
        emergencyRequest.pickupLongitude,
        maxDistance,
        limit,
      );

      res.status(200).json({
        success: true,
        data: {
          totalHospitals: nearbyHospitals.length,
          hospitals: nearbyHospitals.map((hospital) => ({
            id: hospital.id,
            name: hospital.name,
            address: hospital.address,
            distance: `${hospital.distance.toFixed(2)} km`,
            currentLoad: `${hospital.currentRequests}/${hospital.maxCapacity}`,
            availability: hospital.currentRequests < hospital.maxCapacity ? 'Available' : 'Busy',
          })),
        },
      });
    } catch (error) {
      logger.error('Error getting nearby hospitals', { error });
      next(error);
    }
  }
}

export default new EmergencyController();
