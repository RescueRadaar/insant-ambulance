import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiError } from '../errorHandler';
import { UserRole } from '../auth';

// Helper function to format validation errors
const formatValidationErrors = (req: Request): string => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return '';
  }

  return errors
    .array()
    .map((error) => `${error.msg}`)
    .join(', ');
};

// Validate user registration request
export const validateUserRegistration = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .withMessage('Last name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isString()
    .withMessage('Phone number must be a string')
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Invalid phone number format'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),

  body('address').optional().isString().withMessage('Address must be a string'),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = formatValidationErrors(req);
      return next(new ApiError(400, errorMessage));
    }
    next();
  },
];

// Validate hospital registration request
export const validateHospitalRegistration = [
  body('name')
    .notEmpty()
    .withMessage('Hospital name is required')
    .isString()
    .withMessage('Hospital name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Hospital name must be between 2 and 100 characters'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isString()
    .withMessage('Phone number must be a string')
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Invalid phone number format'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),

  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isString()
    .withMessage('Address must be a string'),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('maxCapacity')
    .notEmpty()
    .withMessage('Maximum capacity is required')
    .isInt({ min: 1 })
    .withMessage('Maximum capacity must be a positive integer'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = formatValidationErrors(req);
      return next(new ApiError(400, errorMessage));
    }
    next();
  },
];

// Validate driver registration request
export const validateDriverRegistration = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .withMessage('Last name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isString()
    .withMessage('Phone number must be a string')
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Invalid phone number format'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),

  body('licenseNumber')
    .notEmpty()
    .withMessage('License number is required')
    .isString()
    .withMessage('License number must be a string')
    .isLength({ min: 5, max: 20 })
    .withMessage('License number must be between 5 and 20 characters'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = formatValidationErrors(req);
      return next(new ApiError(400, errorMessage));
    }
    next();
  },
];

// Validate login request
export const validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('password').notEmpty().withMessage('Password is required'),

  body('userType')
    .notEmpty()
    .withMessage('User type is required')
    .isIn([UserRole.USER, UserRole.HOSPITAL, UserRole.DRIVER])
    .withMessage('User type must be one of: user, hospital, driver'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = formatValidationErrors(req);
      return next(new ApiError(400, errorMessage));
    }
    next();
  },
];
