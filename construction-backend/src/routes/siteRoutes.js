const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validate, createSiteSchema, updateSiteSchema } = require('../validations/schemas');

// All authenticated routes
router.use(authenticate);

// Public (all authenticated users)
router.get('/', siteController.getSites);
router.get('/:id', siteController.getSiteById);

// Owner only
router.post('/', authorize('OWNER'), validate(createSiteSchema), siteController.createSite);
router.put('/:id', authorize('OWNER'), validate(updateSiteSchema), siteController.updateSite);
router.delete('/:id', authorize('OWNER'), siteController.deleteSite);

// Worker management (Owner only)
router.post('/:id/assign-worker', authorize('OWNER'), siteController.assignWorker);
router.post('/:id/remove-worker', authorize('OWNER'), siteController.removeWorker);

module.exports = router;
