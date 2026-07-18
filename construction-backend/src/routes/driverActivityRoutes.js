const express = require('express');
const router = express.Router();
const driverActivityController = require('../controllers/driverActivityController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { uploadSingle, handleUploadError } = require('../config/multer');
const { validate, startDutySchema, endDutySchema } = require('../validations/schemas');

// All routes require authentication
router.use(authenticate);

// Driver role authorization
const isDriver = authorize('DRIVER', 'OWNER');

// Start and end duty
router.post(
  '/start-duty',
  isDriver,
  uploadSingle,
  handleUploadError,
  validate(startDutySchema),
  driverActivityController.startDuty
);

router.post(
  '/end-duty',
  isDriver,
  uploadSingle,
  handleUploadError,
  validate(endDutySchema),
  driverActivityController.endDuty
);

// Get activities
router.get('/', driverActivityController.getActivities);
router.get('/summary/daily', driverActivityController.getDailySummary);
router.get('/stats', authorize('OWNER'), driverActivityController.getDriverStats);
router.get('/:id', driverActivityController.getActivityById);

// Cancel activity
router.post('/:id/cancel', driverActivityController.cancelActivity);

module.exports = router;
