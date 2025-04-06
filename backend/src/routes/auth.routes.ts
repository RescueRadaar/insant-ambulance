import { Router } from 'express';
import authController from '../controllers/auth.controller';
import {
  validateUserRegistration,
  validateHospitalRegistration,
  validateDriverRegistration,
  validateLogin,
} from '../middleware/validators/auth.validator';

const router = Router();

// User registration
router.post('/register/user', validateUserRegistration, authController.registerUser);

// Hospital registration
router.post('/register/hospital', validateHospitalRegistration, authController.registerHospital);

// Driver registration
router.post('/register/driver', validateDriverRegistration, authController.registerDriver);

// Login for all user types
router.post('/login', validateLogin, authController.login);

export default router;
