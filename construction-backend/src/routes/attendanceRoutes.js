const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { uploadSingle, handleUploadError } = require('../config/multer');
const { validate, checkInSchema, checkOutSchema } = require('../validations/schemas');

// All routes require authentication
router.use(authenticate);

// Check-in and Check-out
router.post(
  '/check-in',
  uploadSingle,
  handleUploadError,
  validate(checkInSchema),
  attendanceController.checkIn
);

router.post(
  '/check-out',
  uploadSingle,
  handleUploadError,
  validate(checkOutSchema),
  attendanceController.checkOut
);

// Get attendance records
router.get('/', attendanceController.getAttendance);
router.get('/summary/daily', attendanceController.getDailyAttendanceSummary);
router.get('/stats', authorize('OWNER'), attendanceController.getAttendanceStats);
router.get('/:id', attendanceController.getAttendanceById);

module.exports = router;
