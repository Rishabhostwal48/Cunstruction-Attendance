const User = require('../models/User');
const { generateToken, hashPassword } = require('../utils/auth');
const { sendSuccess, sendError } = require('../utils/response');
const { ValidationError, UnauthorizedError } = require('../middleware/errorMiddleware');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  const { name, phone, password, role, assignedSite } = req.validated;

  // Check if user already exists
  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new ValidationError('Phone number already registered');
  }

  // OWNER CREATION RULE:
  // Check if any OWNER exists
  const ownerExists = await User.findOne({ role: 'OWNER' });

  if (!ownerExists) {
    // First installation: Allow OWNER registration
    if (role && role !== 'OWNER') {
      throw new ValidationError('Public registration is disabled. Only OWNER registration is allowed.');
    }

    // Create first OWNER
    const user = new User({
      name,
      phone,
      password,
      role: 'OWNER',
      assignedSite: null  // Owner may not have a site
    });

    await user.save();
    const token = generateToken(user._id, user.role);

    sendSuccess(res, 201, 'OWNER account created successfully', {
      user: user.toJSON(),
      token
    });
    return;
  }

  // After first OWNER exists: Public registration is disabled
  throw new ValidationError('Public registration is disabled. Only authorized users can create accounts.');
};

/**
 * Create user account (OWNER only)
 * POST /api/auth/create-user
 * OWNER can create LABOR, SUPERVISOR, or DRIVER accounts
 */
const createUser = async (req, res) => {
  const { name, phone, password, role, assignedSite } = req.validated;

  // Verify requesting user is OWNER
  if (req.user.role !== 'OWNER') {
    throw new ForbiddenError('Only OWNER can create user accounts');
  }

  // Cannot create another OWNER
  if (role === 'OWNER') {
    throw new ValidationError('Cannot create additional OWNER accounts');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new ValidationError('Phone number already registered');
  }

  // Validate site assignment is mandatory for LABOR, SUPERVISOR, DRIVER
  if (['LABOR', 'SUPERVISOR', 'DRIVER'].includes(role)) {
    if (!assignedSite) {
      throw new ValidationError(`${role} requires a site assignment`);
    }

    // Verify site exists
    const Site = require('../models/Site');
    const site = await Site.findById(assignedSite);
    if (!site) {
      throw new ValidationError('Site not found');
    }
  }

  // Create new user
  const user = new User({
    name,
    phone,
    password,
    role,
    assignedSite: assignedSite || null
  });

  await user.save();

  const token = generateToken(user._id, user.role);

  sendSuccess(res, 201, 'User created successfully', {
    user: user.toJSON(),
    token
  });
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { phone, password } = req.validated;

  // Find user by phone
  const user = await User.findOne({ phone }).select('+password');
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check password
  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id, user.role);

  sendSuccess(res, 200, 'Login successful', {
    user: user.toJSON(),
    token
  });
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).populate('assignedSite').populate('assignedSites');
  
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  sendSuccess(res, 200, 'Profile retrieved', { user });
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  const { name, phone, profilePhoto } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) {
    const existingUser = await User.findOne({ phone, _id: { $ne: req.user._id } });
    if (existingUser) {
      throw new ValidationError('Phone number already in use');
    }
    updateData.phone = phone;
  }
  if (profilePhoto) updateData.profilePhoto = profilePhoto;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  sendSuccess(res, 200, 'Profile updated successfully', { user });
};

/**
 * Change password
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isPasswordValid = await user.matchPassword(currentPassword);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, 200, 'Password changed successfully');
};

/**
 * List all users (Owner only)
 * GET /api/auth/users
 */
const listUsers = async (req, res) => {
  const { role, isActive, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-password');

  const total = await User.countDocuments(filter);

  sendSuccess(res, 200, 'Users retrieved', {
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
};

/**
 * Get user by ID (Owner only)
 * GET /api/auth/users/:id
 */
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('assignedSites')
    .select('-password');

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  sendSuccess(res, 200, 'User retrieved', { user });
};

/**
 * Update user (Owner only)
 * PUT /api/auth/users/:id
 */
const updateUser = async (req, res) => {
  const { name, phone, role, isActive } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) {
    const existingUser = await User.findOne({ phone, _id: { $ne: req.params.id } });
    if (existingUser) {
      throw new ValidationError('Phone number already in use');
    }
    updateData.phone = phone;
  }
  if (role) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  sendSuccess(res, 200, 'User updated successfully', { user });
};

/**
 * Deactivate user (Owner only)
 * DELETE /api/auth/users/:id
 */
const deactivateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('-password');

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  sendSuccess(res, 200, 'User deactivated successfully', { user });
};

module.exports = {
  register,
  createUser,
  login,
  getProfile,
  updateProfile,
  changePassword,
  listUsers,
  getUserById,
  updateUser,
  deactivateUser
};
