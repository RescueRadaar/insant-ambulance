import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from './errorHandler';

/**
 * Middleware to validate request using express-validator
 * @param req Express request
 * @param res Express response
 * @param next Next function
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((error) => error.msg);
    return next(new ApiError(400, messages.join(', ')));
  }

  return next();
};
