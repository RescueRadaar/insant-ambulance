import jwt from 'jsonwebtoken';
import { User, UserData } from '../models/user.model';
import { Hospital, HospitalData } from '../models/hospital.model';
import { Driver, DriverData } from '../models/driver.model';
import { ApiError } from '../middleware/errorHandler';
import { UserRole } from '../middleware/auth';
import config from '../config';
import { logger } from '../utils/logger';

interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface HospitalRegistrationData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  address: string;
  latitude?: number;
  longitude?: number;
  maxCapacity: number;
}

interface DriverRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  licenseNumber: string;
}

interface LoginData {
  email: string;
  password: string;
  userType: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    userType: string;
    token: string;
  };
}

class AuthService {
  private userModel: User;
  private hospitalModel: Hospital;
  private driverModel: Driver;

  constructor() {
    this.userModel = new User();
    this.hospitalModel = new Hospital();
    this.driverModel = new Driver();
  }

  /**
   * Register a new user
   * @param userData User registration data
   * @returns Authentication response
   */
  async registerUser(userData: UserRegistrationData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userModel.findByEmail(userData.email);
      if (existingUser) {
        throw new ApiError(400, 'Email already registered');
      }

      // Create user record
      const newUser = await this.userModel.create({
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phoneNumber,
        address: userData.address,
        role: UserRole.USER,
      });

      // Generate JWT token
      const token = this.generateToken({
        id: newUser.id as string,
        role: UserRole.USER,
      });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          id: newUser.id as string,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          email: newUser.email,
          userType: UserRole.USER,
          token,
        },
      };
    } catch (error) {
      logger.error('Error in user registration', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Error registering user');
    }
  }

  /**
   * Register a new hospital
   * @param hospitalData Hospital registration data
   * @returns Authentication response
   */
  async registerHospital(hospitalData: HospitalRegistrationData): Promise<AuthResponse> {
    try {
      // Check if hospital already exists with the same email
      const existingHospital = await this.hospitalModel.findByEmail(hospitalData.email);
      if (existingHospital) {
        throw new ApiError(400, 'Email already registered');
      }

      // Check if user already exists with the same email
      const existingUser = await this.userModel.findByEmail(hospitalData.email);
      if (existingUser) {
        throw new ApiError(400, 'Email already registered');
      }

      // Create hospital with user account
      const { hospital, user } = await this.hospitalModel.create(
        {
          name: hospitalData.name,
          email: hospitalData.email,
          phone: hospitalData.phoneNumber,
          address: hospitalData.address,
          latitude: hospitalData.latitude,
          longitude: hospitalData.longitude,
          emergency_capacity: hospitalData.maxCapacity,
        },
        hospitalData.password,
      );

      // Generate JWT token
      const token = this.generateToken({
        id: user.id as string,
        role: UserRole.HOSPITAL,
      });

      return {
        success: true,
        message: 'Hospital registered successfully',
        data: {
          id: hospital.id as string,
          name: hospital.name,
          email: hospital.email,
          userType: UserRole.HOSPITAL,
          token,
        },
      };
    } catch (error) {
      logger.error('Error in hospital registration', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Error registering hospital');
    }
  }

  /**
   * Register a new driver
   * @param driverData Driver registration data
   * @returns Authentication response
   */
  async registerDriver(driverData: DriverRegistrationData): Promise<AuthResponse> {
    try {
      // Check if user already exists with the same email
      const existingUser = await this.userModel.findByEmail(driverData.email);
      if (existingUser) {
        throw new ApiError(400, 'Email already registered');
      }

      // Create driver with user account
      const { driver, user } = await this.driverModel.create(
        {
          license_number: driverData.licenseNumber,
          is_approved: false,
        },
        {
          firstName: driverData.firstName,
          lastName: driverData.lastName,
          email: driverData.email,
          phoneNumber: driverData.phoneNumber,
          password: driverData.password,
        },
      );

      // Generate JWT token
      const token = this.generateToken({
        id: user.id as string,
        role: UserRole.DRIVER,
      });

      return {
        success: true,
        message: 'Driver registration submitted successfully. Awaiting hospital approval.',
        data: {
          id: user.id as string,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          userType: UserRole.DRIVER,
          token,
        },
      };
    } catch (error) {
      logger.error('Error in driver registration', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Error registering driver');
    }
  }

  /**
   * Login a user, hospital or driver
   * @param loginData Login credentials
   * @returns Authentication response
   */
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const { email, password, userType } = loginData;

      // Find user by email
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        throw new ApiError(401, 'Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await this.userModel.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials');
      }

      // Verify user type matches
      if (user.role !== userType) {
        throw new ApiError(401, `Invalid account type. This account is registered as ${user.role}`);
      }

      // Generate token
      const token = this.generateToken({
        id: user.id as string,
        role: user.role as UserRole,
      });

      let name = '';
      let response: any = {
        id: user.id,
        email: user.email,
        userType: user.role,
        token,
      };

      // Add role-specific details
      if (user.role === UserRole.USER) {
        response.firstName = user.first_name;
        response.lastName = user.last_name;
      } else if (user.role === UserRole.HOSPITAL) {
        const hospital = await this.hospitalModel.findByUserId(user.id as string);
        if (hospital) {
          response.name = hospital.name;
        }
      } else if (user.role === UserRole.DRIVER) {
        response.firstName = user.first_name;
        response.lastName = user.last_name;
      }

      return {
        success: true,
        message: 'Login successful',
        data: response,
      };
    } catch (error) {
      logger.error('Error in login', { error });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Login failed');
    }
  }

  /**
   * Generate JWT token
   * @param payload Token payload
   * @returns JWT token
   */
  private generateToken(payload: { id: string; role: UserRole }): string {
    const secretKey = process.env.JWT_SECRET || 'default_jwt_secret_key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const options: jwt.SignOptions = {
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    };

    return jwt.sign(payload, secretKey, options);
  }
}

export default new AuthService();
export {
  UserRegistrationData,
  HospitalRegistrationData,
  DriverRegistrationData,
  LoginData,
  AuthResponse,
};
