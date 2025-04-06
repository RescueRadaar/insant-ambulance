import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiError } from '../errorHandler';

/**
 * Validation rules for creating an emergency request
 */
export const validateEmergencyRequest = [
  body('pickupLatitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Pickup latitude must be a valid coordinate between -90 and 90'),

  body('pickupLongitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Pickup longitude must be a valid coordinate between -180 and 180'),

  body('pickupAddress')
    .notEmpty()
    .withMessage('Pickup address is required')
    .isString()
    .withMessage('Pickup address must be a string')
    .isLength({ min: 5, max: 200 })
    .withMessage('Pickup address must be between 5 and 200 characters'),

  body('medicalNotes')
    .optional()
    .isString()
    .withMessage('Medical notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Medical notes cannot exceed 500 characters'),

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
