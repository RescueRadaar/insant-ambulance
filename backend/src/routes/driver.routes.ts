import express from 'express';
import driverController from '../controllers/driver.controller';
import { authenticate, authorize, UserRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { body, param, query } from 'express-validator';

const router = express.Router();

/**
 * @route   PUT /api/driver/status
 * @desc    Update driver availability status
 * @access  Private (Driver)
 */
router.put(
  '/status',
  authenticate,
  authorize(UserRole.DRIVER),
  [body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean value')],
  validateRequest,
  driverController.updateAvailabilityStatus,
);

/**
 * @route   GET /api/driver/assignment/current
 * @desc    Get driver's current assignment
 * @access  Private (Driver)
 */
router.get(
  '/assignment/current',
  authenticate,
  authorize(UserRole.DRIVER),
  driverController.getCurrentAssignment,
);

/**
 * @route   PUT /api/driver/assignment/:id/status
 * @desc    Update assignment status
 * @access  Private (Driver)
 */
router.put(
  '/assignment/:id/status',
  authenticate,
  authorize(UserRole.DRIVER),
  [
    param('id').isUUID().withMessage('Invalid assignment ID'),
    body('status').isIn(['en_route', 'arrived', 'completed']).withMessage('Invalid status value'),
  ],
  validateRequest,
  driverController.updateAssignmentStatus,
);

/**
 * @route   GET /api/driver/assignment/history
 * @desc    Get driver's assignment history
 * @access  Private (Driver)
 */
router.get(
  '/assignment/history',
  authenticate,
  authorize(UserRole.DRIVER),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
  ],
  validateRequest,
  driverController.getAssignmentHistory,
);

export default router;
