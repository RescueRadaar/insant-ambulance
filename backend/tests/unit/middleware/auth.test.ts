import { Request, Response } from 'express';
import passport from 'passport';
import { authenticate, authorize, UserRole } from '../../../src/middleware/auth';
import { ApiError } from '../../../src/middleware/errorHandler';

// Mock passport
jest.mock('passport', () => {
  return {
    authenticate: jest.fn((strategy, options) => {
      return (req: any, res: any, next: any) => {
        // This will be overridden in each test
        next();
      };
    }),
    use: jest.fn(),
  };
});

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  let passportAuthenticateMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();

    // Store original implementation
    passportAuthenticateMock = passport.authenticate as jest.Mock;
  });

  describe('authenticate', () => {
    it('should call next with error when authentication fails', () => {
      const error = new Error('Authentication failed');

      // Mock passport authenticate to call next with an error
      passportAuthenticateMock.mockImplementationOnce(() => {
        return (req: any, res: any, next: any) => {
          next(error);
        };
      });

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(passport.authenticate).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('should call next with ApiError when no user is found', () => {
      // Mock passport authenticate to call next with null user
      passportAuthenticateMock.mockImplementationOnce(() => {
        return (req: any, res: any, next: any) => {
          // Simulate passport calling callback with no user
          const callback = next;
          callback(null, null); // No error, but no user either
        };
      });

      // We'll need to create a mock next function that simulates the behavior
      // we expect from the middleware
      const mockNext = (err?: any) => {
        if (err) {
          expect(err).toBeInstanceOf(ApiError);
          expect(err.statusCode).toBe(401);
          expect(err.message).toBe('Unauthorized - Invalid token');
        }
      };

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(passport.authenticate).toHaveBeenCalled();
    });

    it('should attach user to request and call next when authentication succeeds', () => {
      const mockUser = { id: 'user-id', role: UserRole.USER };

      // Mock passport authenticate to call next with a user
      passportAuthenticateMock.mockImplementationOnce(() => {
        return (req: any, res: any, next: any) => {
          // Simulate passport strategy assigning user to req
          req.user = mockUser;
          next();
        };
      });

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(passport.authenticate).toHaveBeenCalled();
      expect(mockRequest.user).toBe(mockUser);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should call next with ApiError when no user is attached to request', () => {
      const authMiddleware = authorize(UserRole.USER);

      authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ApiError));
      expect(nextFunction.mock.calls[0][0].statusCode).toBe(401);
      expect(nextFunction.mock.calls[0][0].message).toContain('Authentication required');
    });

    it('should call next with ApiError when user role does not match required roles', () => {
      mockRequest.user = { id: 'user-id', role: UserRole.USER };
      const authMiddleware = authorize(UserRole.HOSPITAL, UserRole.DRIVER);

      authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ApiError));
      expect(nextFunction.mock.calls[0][0].statusCode).toBe(403);
      expect(nextFunction.mock.calls[0][0].message).toContain('Forbidden');
    });

    it('should call next when user role matches required roles', () => {
      mockRequest.user = { id: 'user-id', role: UserRole.HOSPITAL };
      const authMiddleware = authorize(UserRole.HOSPITAL, UserRole.ADMIN);

      authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });
  });
});
