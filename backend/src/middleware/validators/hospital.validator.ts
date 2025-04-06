import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiError } from '../errorHandler';

/**
 * Validation rules for driver assignment
 */
export const validateDriverAssignment = [
  body('driverId')
    .notEmpty()
    .withMessage('Driver ID is required')
    .isUUID()
    .withMessage('Driver ID must be a valid UUID'),

  // Validation handler middleware
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors.array().map((error) => error.msg);
      return next(new ApiError(400, messages.join(', ')));
    }
    return next();
  },
];
