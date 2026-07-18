const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { uploadMultiple, handleUploadError } = require('../config/multer');
const { validate, createProgressSchema } = require('../validations/schemas');

// All routes require authentication
router.use(authenticate);

// Upload progress
router.post(
  '/',
  uploadMultiple,
  handleUploadError,
  validate(createProgressSchema),
  progressController.uploadProgress
);

// Get progress records
router.get('/', progressController.getProgress);
router.get('/site/:siteId/timeline', progressController.getSiteTimeline);
router.get('/site/:siteId/stats', progressController.getSiteProgressStats);
router.get('/:id', progressController.getProgressById);

// Approve/Reject progress (Supervisor/Owner)
router.put('/:id/approve', authorize('OWNER', 'SUPERVISOR'), progressController.approveProgress);
router.put('/:id/reject', authorize('OWNER', 'SUPERVISOR'), progressController.rejectProgress);

module.exports = router;
