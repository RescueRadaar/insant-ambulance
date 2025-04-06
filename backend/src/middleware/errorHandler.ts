import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found error middleware
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Resource not found - ${req.originalUrl}`);
  next(error);
};

// Global error handler middleware
export const errorHandler = (
  err: ApiError | Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = (err as ApiError).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error details
  logger.error(`${statusCode} - ${message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: err.stack,
  });

  // Determine if sending stack trace based on environment
  const stack = process.env.NODE_ENV === 'production' ? undefined : err.stack;

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      stack,
    },
  });
};
