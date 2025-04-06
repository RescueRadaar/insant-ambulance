import { Router } from 'express';
import emergencyController from '../controllers/emergency.controller';
import { authenticate, authorize, UserRole } from '../middleware/auth';
import { validateEmergencyRequest } from '../middleware/validators/emergency.validator';

const router = Router();

// Create emergency request - POST /api/user/emergency
router.post(
  '/user/emergency',
  authenticate,
  authorize(UserRole.USER),
  validateEmergencyRequest,
  emergencyController.createEmergency,
);

// Get user emergency history - GET /api/user/emergency/history
// Must be defined before the specific requestId route to avoid conflicts
router.get(
  '/user/emergency/history',
  authenticate,
  authorize(UserRole.USER),
  emergencyController.getEmergencyHistory,
);

// Get emergency request status - GET /api/user/emergency/{requestId}
router.get(
  '/user/emergency/:requestId',
  authenticate,
  authorize(UserRole.USER),
  emergencyController.getEmergencyStatus,
);

// Get nearby hospitals for an emergency - GET /api/user/emergency/{requestId}/nearby-hospitals
router.get(
  '/user/emergency/:requestId/nearby-hospitals',
  authenticate,
  authorize(UserRole.USER),
  emergencyController.getNearbyHospitals,
);

export default router;
