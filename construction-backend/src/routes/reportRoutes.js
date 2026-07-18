const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Attendance reports
router.get('/attendance/daily', reportController.getDailyAttendanceReport);

// Progress reports
router.get('/progress/site', reportController.getSiteProgressReport);

// Driver activity reports
router.get('/driver-activities', reportController.getDriverActivityReport);

// Comprehensive site report
router.get('/site/comprehensive', reportController.getComprehensiveSiteReport);

// Export reports
router.get('/export/:reportType', reportController.exportReport);

module.exports = router;
