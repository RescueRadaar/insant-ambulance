import { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/driver.service';
import { logger } from '../utils/logger';
import { JwtPayload } from '../middleware/auth';

class DriverController {
  private driverService: DriverService;

  constructor() {
    this.driverService = new DriverService();
    // Bind methods to ensure 'this' context
    this.updateAvailabilityStatus = this.updateAvailabilityStatus.bind(this);
    this.getCurrentAssignment = this.getCurrentAssignment.bind(this);
    this.updateAssignmentStatus = this.updateAssignmentStatus.bind(this);
    this.getAssignmentHistory = this.getAssignmentHistory.bind(this);
  }

  /**
   * Update driver availability status
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async updateAvailabilityStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = (req.user as JwtPayload).id;
      const { isAvailable } = req.body;

      const result = await this.driverService.updateAvailabilityStatus(driverId, isAvailable);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error updating driver availability status', { error });
      next(error);
    }
  }

  /**
   * Get driver's current assignment
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async getCurrentAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = (req.user as JwtPayload).id;

      const result = await this.driverService.getCurrentAssignment(driverId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting current assignment', { error });
      next(error);
    }
  }

  /**
   * Update assignment status
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async updateAssignmentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = (req.user as JwtPayload).id;
      const assignmentId = req.params.id;
      const { status } = req.body;

      const result = await this.driverService.updateAssignmentStatus(
        assignmentId,
        driverId,
        status,
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error updating assignment status', { error });
      next(error);
    }
  }

  /**
   * Get driver's assignment history
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async getAssignmentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = (req.user as JwtPayload).id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.driverService.getAssignmentHistory(driverId, page, limit);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting assignment history', { error });
      next(error);
    }
  }
}

export default new DriverController();
