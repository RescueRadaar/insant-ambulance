import { Router } from 'express';
import hospitalController from '../controllers/hospital.controller';
import { authenticate, authorize, UserRole } from '../middleware/auth';
import { validateDriverAssignment } from '../middleware/validators/hospital.validator';

const router = Router();

// All hospital routes require authentication and hospital role
const hospitalAuth = [authenticate, authorize(UserRole.HOSPITAL)];

// Get pending emergency requests
router.get(
  '/hospital/emergency/pending',
  hospitalAuth,
  hospitalController.getPendingEmergencyRequests,
);

// Accept emergency request
router.post(
  '/hospital/emergency/:requestId/accept',
  hospitalAuth,
  hospitalController.acceptEmergencyRequest,
);

// Assign driver to emergency
router.post(
  '/hospital/emergency/:requestId/assign',
  hospitalAuth,
  validateDriverAssignment,
  hospitalController.assignDriverToEmergency,
);

// Get active emergency requests
router.get(
  '/hospital/emergency/active',
  hospitalAuth,
  hospitalController.getActiveEmergencyRequests,
);

// Get hospital drivers
router.get('/hospital/drivers', hospitalAuth, hospitalController.getHospitalDrivers);

// Approve driver
router.post('/hospital/drivers/:driverId/approve', hospitalAuth, hospitalController.approveDriver);

export default router;
