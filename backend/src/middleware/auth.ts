import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';
import config from '../config';

// Define user types
export enum UserRole {
  USER = 'user',
  HOSPITAL = 'hospital',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

// JWT payload type
export interface JwtPayload {
  id: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Configure JWT strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret,
};

// Initialize passport with JWT strategy
passport.use(
  new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
    try {
      // Here you would typically check if the user exists in the database
      // For now, we'll just pass the payload as the user
      return done(null, payload);
    } catch (error) {
      return done(error, false);
    }
  }),
);

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: JwtPayload) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new ApiError(401, 'Unauthorized - Invalid token'));
    }

    // Attach user to request object
    req.user = user;
    return next();
  })(req, res, next);
};

// Role-based authorization middleware
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized - Authentication required'));
    }

    const user = req.user as JwtPayload;

    if (!roles.includes(user.role)) {
      return next(new ApiError(403, 'Forbidden - Insufficient permissions'));
    }

    return next();
  };
};
