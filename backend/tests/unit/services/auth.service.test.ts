import authService, {
  UserRegistrationData,
  HospitalRegistrationData,
  DriverRegistrationData,
  LoginData,
} from '../../../src/services/auth.service';
import { User } from '../../../src/models/user.model';
import { Hospital } from '../../../src/models/hospital.model';
import { Driver } from '../../../src/models/driver.model';
import { ApiError } from '../../../src/middleware/errorHandler';
import { UserRole } from '../../../src/middleware/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the models
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/hospital.model');
jest.mock('../../../src/models/driver.model');
jest.mock('../../../src/utils/logger');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock jwt.sign
    (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');
  });

  describe('registerUser', () => {
    const mockUserData: UserRegistrationData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phoneNumber: '1234567890',
      password: 'Password123',
      address: '123 Test St',
      latitude: 37.7749,
      longitude: -122.4194,
    };

    it('should register a user successfully', async () => {
      // Mock user model methods
      const mockUser = {
        id: 'mock-uuid',
        first_name: mockUserData.firstName,
        last_name: mockUserData.lastName,
        email: mockUserData.email,
        role: UserRole.USER,
      };

      // Setup mock methods with proper implementation
      const mockFindByEmail = jest.fn().mockResolvedValue(null);
      const mockCreate = jest.fn().mockResolvedValue(mockUser);

      // Override the prototype methods with mocks
      User.prototype.findByEmail = mockFindByEmail;
      User.prototype.create = mockCreate;

      // Call the service
      const result = await authService.registerUser(mockUserData);

      // Assertions
      expect(mockFindByEmail).toHaveBeenCalledWith(mockUserData.email);
      expect(mockCreate).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('User registered successfully');
      expect(result.data).toHaveProperty('id', mockUser.id);
      expect(result.data).toHaveProperty('firstName', mockUser.first_name);
      expect(result.data).toHaveProperty('lastName', mockUser.last_name);
      expect(result.data).toHaveProperty('email', mockUser.email);
      expect(result.data).toHaveProperty('token');
    });

    it('should throw error when email already exists', async () => {
      // Mock existing user
      const existingUser = {
        id: 'existing-uuid',
        email: mockUserData.email,
      };

      // Setup mock methods
      const mockFindByEmail = jest.fn().mockResolvedValue(existingUser);
      User.prototype.findByEmail = mockFindByEmail;

      // Call the service and expect error
      await expect(authService.registerUser(mockUserData)).rejects.toThrow(ApiError);
      await expect(authService.registerUser(mockUserData)).rejects.toThrow(
        'Email already registered',
      );

      // Verify the user.create method was not called
      expect(User.prototype.create).not.toHaveBeenCalled();
    });
  });

  describe('registerHospital', () => {
    const mockHospitalData: HospitalRegistrationData = {
      name: 'Test Hospital',
      email: 'hospital@example.com',
      phoneNumber: '1234567890',
      password: 'Password123',
      address: '456 Hospital Ave',
      latitude: 37.7849,
      longitude: -122.4294,
      maxCapacity: 50,
    };

    it('should register a hospital successfully', async () => {
      // Mock user and hospital data
      const mockUser = {
        id: 'mock-user-uuid',
        email: mockHospitalData.email,
        role: UserRole.HOSPITAL,
      };

      const mockHospital = {
        id: 'mock-hospital-uuid',
        name: mockHospitalData.name,
        email: mockHospitalData.email,
      };

      // Setup mock methods
      const mockUserFindByEmail = jest.fn().mockResolvedValue(null);
      const mockHospitalFindByEmail = jest.fn().mockResolvedValue(null);
      const mockHospitalCreate = jest
        .fn()
        .mockResolvedValue({ hospital: mockHospital, user: mockUser });

      User.prototype.findByEmail = mockUserFindByEmail;
      Hospital.prototype.findByEmail = mockHospitalFindByEmail;
      Hospital.prototype.create = mockHospitalCreate;

      // Call the service
      const result = await authService.registerHospital(mockHospitalData);

      // Assertions
      expect(mockUserFindByEmail).toHaveBeenCalledWith(mockHospitalData.email);
      expect(mockHospitalFindByEmail).toHaveBeenCalledWith(mockHospitalData.email);
      expect(mockHospitalCreate).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Hospital registered successfully');
      expect(result.data).toHaveProperty('id', mockHospital.id);
      expect(result.data).toHaveProperty('name', mockHospital.name);
      expect(result.data).toHaveProperty('email', mockHospital.email);
      expect(result.data).toHaveProperty('token');
    });

    it('should throw error when email already exists', async () => {
      // Mock existing hospital
      const existingHospital = {
        id: 'existing-uuid',
        email: mockHospitalData.email,
      };

      // Setup mock methods
      const mockUserFindByEmail = jest.fn().mockResolvedValue(null);
      const mockHospitalFindByEmail = jest.fn().mockResolvedValue(existingHospital);

      User.prototype.findByEmail = mockUserFindByEmail;
      Hospital.prototype.findByEmail = mockHospitalFindByEmail;

      // Call the service and expect error
      await expect(authService.registerHospital(mockHospitalData)).rejects.toThrow(ApiError);
      await expect(authService.registerHospital(mockHospitalData)).rejects.toThrow(
        'Email already registered',
      );

      // Verify the hospital.create method was not called
      expect(Hospital.prototype.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockLoginData: LoginData = {
      email: 'test@example.com',
      password: 'Password123',
      userType: UserRole.USER,
    };

    it('should login a user successfully', async () => {
      // Mock user
      const mockUser = {
        id: 'mock-uuid',
        email: mockLoginData.email,
        password: 'hashedPassword',
        role: UserRole.USER,
        first_name: 'Test',
        last_name: 'User',
      };

      // Setup mock methods
      const mockFindByEmail = jest.fn().mockResolvedValue(mockUser);
      const mockVerifyPassword = jest.fn().mockResolvedValue(true);

      User.prototype.findByEmail = mockFindByEmail;
      User.prototype.verifyPassword = mockVerifyPassword;

      // Call the service
      const result = await authService.login(mockLoginData);

      // Assertions
      expect(mockFindByEmail).toHaveBeenCalledWith(mockLoginData.email);
      expect(mockVerifyPassword).toHaveBeenCalledWith(mockLoginData.password, mockUser.password);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.data).toHaveProperty('id', mockUser.id);
      expect(result.data).toHaveProperty('email', mockUser.email);
      expect(result.data).toHaveProperty('firstName', mockUser.first_name);
      expect(result.data).toHaveProperty('lastName', mockUser.last_name);
      expect(result.data).toHaveProperty('userType', mockUser.role);
      expect(result.data).toHaveProperty('token');
    });

    it('should throw error for invalid credentials', async () => {
      // Setup mock method to return null (user not found)
      const mockFindByEmail = jest.fn().mockResolvedValue(null);
      User.prototype.findByEmail = mockFindByEmail;

      // Call the service and expect error
      await expect(authService.login(mockLoginData)).rejects.toThrow(ApiError);
      await expect(authService.login(mockLoginData)).rejects.toThrow('Invalid credentials');

      // Verify the verifyPassword method was not called
      expect(User.prototype.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw error for incorrect password', async () => {
      // Mock user
      const mockUser = {
        id: 'mock-uuid',
        email: mockLoginData.email,
        password: 'hashedPassword',
        role: UserRole.USER,
      };

      // Setup mock methods
      const mockFindByEmail = jest.fn().mockResolvedValue(mockUser);
      const mockVerifyPassword = jest.fn().mockResolvedValue(false); // Password verification fails

      User.prototype.findByEmail = mockFindByEmail;
      User.prototype.verifyPassword = mockVerifyPassword;

      // Call the service and expect error
      await expect(authService.login(mockLoginData)).rejects.toThrow(ApiError);
      await expect(authService.login(mockLoginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for mismatched user type', async () => {
      // Mock user with different role than login attempt
      const mockUser = {
        id: 'mock-uuid',
        email: mockLoginData.email,
        password: 'hashedPassword',
        role: UserRole.HOSPITAL, // Login attempt is for USER
      };

      // Setup mock methods
      const mockFindByEmail = jest.fn().mockResolvedValue(mockUser);
      const mockVerifyPassword = jest.fn().mockResolvedValue(true);

      User.prototype.findByEmail = mockFindByEmail;
      User.prototype.verifyPassword = mockVerifyPassword;

      // Call the service and expect error
      await expect(authService.login(mockLoginData)).rejects.toThrow(ApiError);
      await expect(authService.login(mockLoginData)).rejects.toThrow('Invalid account type');
    });
  });
});
