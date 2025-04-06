import { Request, Response, NextFunction } from 'express';
import { HospitalService } from '../services/hospital.service';
import { logger } from '../utils/logger';
import { JwtPayload } from '../middleware/auth';

class HospitalController {
  private hospitalService: HospitalService;

  constructor() {
    this.hospitalService = new HospitalService();
    // Bind methods to ensure 'this' context
    this.getPendingEmergencyRequests = this.getPendingEmergencyRequests.bind(this);
    this.acceptEmergencyRequest = this.acceptEmergencyRequest.bind(this);
    this.assignDriverToEmergency = this.assignDriverToEmergency.bind(this);
    this.getActiveEmergencyRequests = this.getActiveEmergencyRequests.bind(this);
    this.getHospitalDrivers = this.getHospitalDrivers.bind(this);
    this.approveDriver = this.approveDriver.bind(this);
  }

  /**
   * Get list of pending emergency requests for a hospital
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async getPendingEmergencyRequests(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const hospitalId = (req.user as JwtPayload).id;

      const result = await this.hospitalService.getPendingEmergencyRequests(hospitalId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting pending emergency requests', { error });
      next(error);
    }
  }

  /**
   * Accept an emergency request
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async acceptEmergencyRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = (req.user as JwtPayload).id;
      const requestId = req.params.requestId;

      const result = await this.hospitalService.acceptEmergencyRequest(requestId, hospitalId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error accepting emergency request', { error });
      next(error);
    }
  }

  /**
   * Assign a driver to an emergency request
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async assignDriverToEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = (req.user as JwtPayload).id;
      const requestId = req.params.requestId;
      const { driverId } = req.body;

      const result = await this.hospitalService.assignDriverToEmergency(
        requestId,
        hospitalId,
        driverId,
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error assigning driver to emergency', { error });
      next(error);
    }
  }

  /**
   * Get active emergency requests for a hospital
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async getActiveEmergencyRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = (req.user as JwtPayload).id;

      const result = await this.hospitalService.getActiveEmergencyRequests(hospitalId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting active emergency requests', { error });
      next(error);
    }
  }

  /**
   * Get list of hospital drivers
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async getHospitalDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = (req.user as JwtPayload).id;
      const status = (req.query.status as string) || 'all';

      const result = await this.hospitalService.getHospitalDrivers(hospitalId, status);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting hospital drivers', { error });
      next(error);
    }
  }

  /**
   * Approve a driver registration
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async approveDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = (req.user as JwtPayload).id;
      const driverId = req.params.driverId;

      const result = await this.hospitalService.approveDriver(driverId, hospitalId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error approving driver', { error });
      next(error);
    }
  }
}

export default new HospitalController();
