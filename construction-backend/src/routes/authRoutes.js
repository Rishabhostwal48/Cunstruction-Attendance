const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validate, registerSchema, createUserSchema, loginSchema } = require('../validations/schemas');

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

// Owner only routes
router.post('/create-user', authenticate, authorize('OWNER'), validate(createUserSchema), authController.createUser);
router.get('/users', authenticate, authorize('OWNER'), authController.listUsers);
router.get('/users/:id', authenticate, authorize('OWNER'), authController.getUserById);
router.put('/users/:id', authenticate, authorize('OWNER'), authController.updateUser);
router.delete('/users/:id', authenticate, authorize('OWNER'), authController.deactivateUser);

module.exports = router;
