import { JwtPayload } from '../../middleware/auth';

// This module augmentation approach avoids conflicts with the existing Express definitions
declare module 'express-serve-static-core' {
  interface Request {
    user: JwtPayload | any;
  }
}
