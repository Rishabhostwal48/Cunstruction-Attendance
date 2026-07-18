const Site = require('../models/Site');
const User = require('../models/User');
const { sendSuccess } = require('../utils/response');
const { ValidationError, NotFoundError, ForbiddenError } = require('../middleware/errorMiddleware');

/**
 * Create a new site (Owner only)
 * POST /api/sites
 */
const createSite = async (req, res) => {
  const { name, address, latitude, longitude, radius, description, projectCode } = req.validated;

  // Check if project code already exists
  if (projectCode) {
    const existingSite = await Site.findOne({ projectCode });
    if (existingSite) {
      throw new ValidationError('Project code already exists');
    }
  }

  const site = new Site({
    name,
    address,
    latitude,
    longitude,
    radius,
    description,
    projectCode,
    owner: req.user._id
  });

  await site.save();

  // AUTO-ASSIGN: Owner automatically becomes assigned to the site
  await User.findByIdAndUpdate(
    req.user._id,
    { assignedSite: site._id },
    { new: true, runValidators: false }
  );

  sendSuccess(res, 201, 'Site created successfully', { site });
};

/**
 * Get all sites
 * GET /api/sites
 */
const getSites = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  // Owner sees only their sites; Admin sees all
  if (req.user.role !== 'OWNER') {
    filter.assignedWorkers = req.user._id;
  } else {
    filter.owner = req.user._id;
  }

  const skip = (page - 1) * limit;

  const sites = await Site.find(filter)
    .populate('owner', 'name phone')
    .populate('assignedWorkers', 'name phone role')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Site.countDocuments(filter);

  sendSuccess(res, 200, 'Sites retrieved', {
    sites,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
};

/**
 * Get site by ID
 * GET /api/sites/:id
 */
const getSiteById = async (req, res) => {
  const site = await Site.findById(req.params.id)
    .populate('owner', 'name phone')
    .populate('assignedWorkers', 'name phone role');

  if (!site) {
    throw new NotFoundError('Site');
  }

  // Check authorization
  if (req.user.role === 'OWNER' && site.owner._id.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You do not have access to this site');
  }

  sendSuccess(res, 200, 'Site retrieved', { site });
};

/**
 * Update site (Owner only)
 * PUT /api/sites/:id
 */
const updateSite = async (req, res) => {
  const { name, address, latitude, longitude, radius, description, status } = req.body;

  const site = await Site.findById(req.params.id);
  if (!site) {
    throw new NotFoundError('Site');
  }

  // Check authorization
  if (site.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('Only the site owner can update this site');
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (address) updateData.address = address;
  if (latitude) updateData.latitude = latitude;
  if (longitude) updateData.longitude = longitude;
  if (radius) updateData.radius = radius;
  if (description) updateData.description = description;
  if (status) updateData.status = status;

  const updatedSite = await Site.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('owner', 'name phone')
   .populate('assignedWorkers', 'name phone role');

  sendSuccess(res, 200, 'Site updated successfully', { site: updatedSite });
};

/**
 * Delete site (Owner only)
 * DELETE /api/sites/:id
 */
const deleteSite = async (req, res) => {
  const site = await Site.findById(req.params.id);

  if (!site) {
    throw new NotFoundError('Site');
  }

  // Check authorization
  if (site.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('Only the site owner can delete this site');
  }

  await Site.findByIdAndDelete(req.params.id);

  sendSuccess(res, 200, 'Site deleted successfully');
};

/**
 * Assign worker to site (Owner only)
 * POST /api/sites/:id/assign-worker
 */
const assignWorker = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  const site = await Site.findById(req.params.id);
  if (!site) {
    throw new NotFoundError('Site');
  }

  // Check authorization
  if (site.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('Only the site owner can assign workers');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  // Add site to user's assigned sites if not already present
  if (!user.assignedSites.includes(site._id)) {
    user.assignedSites.push(site._id);
  }

  // UPDATE: Set user's primary assigned site
  user.assignedSite = site._id;
  await user.save();

  // Add user to site's assigned workers if not already present
  if (!site.assignedWorkers.includes(user._id)) {
    site.assignedWorkers.push(user._id);
    await site.save();
  }

  const updatedSite = await Site.findById(site._id)
    .populate('owner', 'name phone')
    .populate('assignedWorkers', 'name phone role');

  sendSuccess(res, 200, 'Worker assigned successfully', { site: updatedSite });
};

/**
 * Remove worker from site (Owner only)
 * POST /api/sites/:id/remove-worker
 */
const removeWorker = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  const site = await Site.findById(req.params.id);
  if (!site) {
    throw new NotFoundError('Site');
  }

  // Check authorization
  if (site.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('Only the site owner can remove workers');
  }

  site.assignedWorkers = site.assignedWorkers.filter(id => id.toString() !== userId);
  await site.save();

  // Also remove site from user's assigned sites and reset assignedSite
  await User.findByIdAndUpdate(userId, {
    $pull: { assignedSites: site._id },
    assignedSite: null
  });

  const updatedSite = await Site.findById(site._id)
    .populate('owner', 'name phone')
    .populate('assignedWorkers', 'name phone role');

  sendSuccess(res, 200, 'Worker removed successfully', { site: updatedSite });
};

module.exports = {
  createSite,
  getSites,
  getSiteById,
  updateSite,
  deleteSite,
  assignWorker,
  removeWorker
};
