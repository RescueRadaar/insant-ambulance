import { Request, Response, NextFunction } from 'express';
import authService, {
  UserRegistrationData,
  HospitalRegistrationData,
  DriverRegistrationData,
  LoginData,
} from '../services/auth.service';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

class AuthController {
  /**
   * Register a new user
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async registerUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: UserRegistrationData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        password: req.body.password,
        address: req.body.address,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      };

      const result = await authService.registerUser(userData);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register a new hospital
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async registerHospital(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalData: HospitalRegistrationData = {
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        password: req.body.password,
        address: req.body.address,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        maxCapacity: req.body.maxCapacity,
      };

      const result = await authService.registerHospital(hospitalData);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register a new driver
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async registerDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverData: DriverRegistrationData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        password: req.body.password,
        licenseNumber: req.body.licenseNumber,
      };

      const result = await authService.registerDriver(driverData);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login for all user types
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData: LoginData = {
        email: req.body.email,
        password: req.body.password,
        userType: req.body.userType,
      };

      const result = await authService.login(loginData);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
