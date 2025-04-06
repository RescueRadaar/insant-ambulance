import { Request, Response } from 'express';
import { ApiError, errorHandler, notFoundHandler } from '../../../src/middleware/errorHandler';
import { logger } from '../../../src/utils/logger';

// Mock logger
jest.mock('../../../src/utils/logger');

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/test/url',
      method: 'GET',
      ip: '127.0.0.1',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
  });

  describe('ApiError class', () => {
    it('should create ApiError with status code and message', () => {
      const error = new ApiError(400, 'Bad Request');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
      expect(error.name).toBe('ApiError');
    });
  });

  describe('notFoundHandler', () => {
    it('should create ApiError with 404 status and pass to next', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();

      const error = nextFunction.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('Resource not found');
      expect(error.message).toContain(mockRequest.originalUrl);
    });
  });

  describe('errorHandler', () => {
    it('should handle ApiError', () => {
      const apiError = new ApiError(400, 'Bad Request Test');

      errorHandler(apiError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Bad Request Test',
          stack: expect.any(String),
        },
      });
    });

    it('should handle regular Error', () => {
      const regularError = new Error('Some Error');

      errorHandler(regularError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500); // Default status for regular errors
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Some Error',
          stack: expect.any(String),
        },
      });
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const apiError = new ApiError(400, 'Bad Request Test');

      errorHandler(apiError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Bad Request Test',
          stack: undefined,
        },
      });

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});
