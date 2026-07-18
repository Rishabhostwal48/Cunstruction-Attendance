const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('./errorMiddleware');
const User = require('../models/User');

/**
 * Authenticate user using JWT token
 * Extracts token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token');
    }
    next(error);
  }
};

/**
 * Authorize user based on role
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`This action requires one of these roles: ${roles.join(', ')}`);
    }

    next();
  };
};

/**
 * Check if user is assigned to the site
 */
const checkSiteAssignment = async (req, res, next) => {
  try {
    const { siteId } = req.params || req.body;
    
    if (!req.user.assignedSites?.includes(siteId)) {
      throw new ForbiddenError('You are not assigned to this site');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has an assigned site
 * Required before work-related activities
 */
const requireSiteAssignment = async (req, res, next) => {
  try {
    if (!req.user.assignedSite) {
      throw new ForbiddenError('No site assigned. Contact your administrator.');
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  checkSiteAssignment,
  requireSiteAssignment
};
