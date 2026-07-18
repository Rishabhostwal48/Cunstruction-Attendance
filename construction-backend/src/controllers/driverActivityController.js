const DriverActivity = require('../models/DriverActivity');
const { saveFile, getFileUrl } = require('../utils/storage');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { ValidationError, NotFoundError, ForbiddenError } = require('../middleware/errorMiddleware');

/**
 * Start duty
 * POST /api/driver-activities/start-duty
 */
const startDuty = async (req, res) => {
  const { vehicleNumber, startMeter } = req.validated;
  const file = req.file;

  // NO SITE = NO WORK: Verify user has assigned site
  if (!req.user.assignedSite) {
    throw new ForbiddenError('No site assigned. Contact your administrator.');
  }

  if (!file) {
    throw new ValidationError('Vehicle photo is required');
  }

  // Check for active duty
  const activeDuty = await DriverActivity.findOne({
    driver: req.user._id,
    status: 'ACTIVE'
  });

  if (activeDuty) {
    throw new ValidationError('Driver already has an active duty session');
  }

  // Save photo
  const photoPath = saveFile(file, 'driver-activity');

  const activity = new DriverActivity({
    driver: req.user._id,
    vehicleNumber,
    startTime: new Date(),
    startMeter,
    startPhoto: {
      filename: file.originalname,
      url: getFileUrl(photoPath),
      uploadedAt: new Date()
    },
    status: 'ACTIVE'
  });

  await activity.save();
  await activity.populate('driver', 'name phone');

  sendSuccess(res, 201, 'Duty started successfully', { activity });
};

/**
 * End duty
 * POST /api/driver-activities/end-duty
 */
const endDuty = async (req, res) => {
  const { endMeter } = req.validated;
  const file = req.file;

  // NO SITE = NO WORK: Verify user has assigned site
  if (!req.user.assignedSite) {
    throw new ForbiddenError('No site assigned. Contact your administrator.');
  }

  if (!file) {
    throw new ValidationError('Vehicle photo is required');
  }

  // Find active duty
  const activity = await DriverActivity.findOne({
    driver: req.user._id,
    status: 'ACTIVE'
  });

  if (!activity) {
    throw new ValidationError('No active duty session found');
  }

  // Save photo
  const photoPath = saveFile(file, 'driver-activity');

  activity.endTime = new Date();
  activity.endMeter = endMeter;
  activity.endPhoto = {
    filename: file.originalname,
    url: getFileUrl(photoPath),
    uploadedAt: new Date()
  };
  activity.status = 'COMPLETED';

  // Distance is calculated automatically by schema pre-save middleware
  await activity.save();
  await activity.populate('driver', 'name phone');

  sendSuccess(res, 200, 'Duty ended successfully', { activity });
};

/**
 * Get driver activities
 * GET /api/driver-activities
 */
const getActivities = async (req, res) => {
  const { driverId, vehicleNumber, status, fromDate, toDate, page = 1, limit = 10 } = req.query;

  const filter = {};

  // Users can only see their own; Owners see all
  if (req.user.role !== 'OWNER') {
    filter.driver = req.user._id;
  } else if (driverId) {
    filter.driver = driverId;
  }

  if (vehicleNumber) filter.vehicleNumber = { $regex: vehicleNumber, $options: 'i' };
  if (status) filter.status = status;

  if (fromDate || toDate) {
    filter.startTime = {};
    if (fromDate) filter.startTime.$gte = new Date(fromDate);
    if (toDate) filter.startTime.$lte = new Date(toDate);
  }

  const skip = (page - 1) * limit;

  const activities = await DriverActivity.find(filter)
    .populate('driver', 'name phone')
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await DriverActivity.countDocuments(filter);

  sendPaginated(res, 200, 'Driver activities retrieved', activities, total, page, limit);
};

/**
 * Get activity by ID
 * GET /api/driver-activities/:id
 */
const getActivityById = async (req, res) => {
  const activity = await DriverActivity.findById(req.params.id)
    .populate('driver', 'name phone');

  if (!activity) {
    throw new NotFoundError('Driver activity');
  }

  // Authorization check
  if (req.user.role !== 'OWNER' && activity.driver._id.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You do not have access to this activity');
  }

  sendSuccess(res, 200, 'Activity retrieved', { activity });
};

/**
 * Get driver's daily summary
 * GET /api/driver-activities/summary/daily
 */
const getDailySummary = async (req, res) => {
  const { driverId, date } = req.query;

  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const filter = {
    startTime: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  };

  if (req.user.role !== 'OWNER') {
    filter.driver = req.user._id;
  } else if (driverId) {
    filter.driver = driverId;
  }

  const activities = await DriverActivity.find(filter)
    .populate('driver', 'name phone')
    .sort({ startTime: 1 });

  const totalDistance = activities.reduce((sum, a) => sum + (a.distanceTravelled || 0), 0);
  const totalDutyTime = activities.reduce((sum, a) => {
    if (a.startTime && a.endTime) {
      return sum + (a.endTime - a.startTime) / (1000 * 60 * 60);
    }
    return sum;
  }, 0);

  sendSuccess(res, 200, 'Daily summary retrieved', {
    date: targetDate.toDateString(),
    totalActivities: activities.length,
    totalDistance,
    totalDutyHours: parseFloat(totalDutyTime.toFixed(2)),
    activities
  });
};

/**
 * Cancel duty
 * POST /api/driver-activities/:id/cancel
 */
const cancelActivity = async (req, res) => {
  const { notes } = req.body;

  const activity = await DriverActivity.findById(req.params.id);
  if (!activity) {
    throw new NotFoundError('Driver activity');
  }

  // Authorization check
  if (activity.driver.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only cancel your own activities');
  }

  activity.status = 'CANCELLED';
  if (notes) activity.notes = notes;

  await activity.save();
  await activity.populate('driver', 'name phone');

  sendSuccess(res, 200, 'Activity cancelled', { activity });
};

/**
 * Get driver statistics
 * GET /api/driver-activities/stats
 */
const getDriverStats = async (req, res) => {
  const { fromDate, toDate } = req.query;

  const filter = {
    status: 'COMPLETED'
  };

  if (fromDate || toDate) {
    filter.startTime = {};
    if (fromDate) filter.startTime.$gte = new Date(fromDate);
    if (toDate) filter.startTime.$lte = new Date(toDate);
  }

  const stats = await DriverActivity.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$driver',
        totalTrips: { $sum: 1 },
        totalDistance: { $sum: '$distanceTravelled' },
        avgDistance: { $avg: '$distanceTravelled' }
      }
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'driver' } }
  ]);

  sendSuccess(res, 200, 'Driver statistics retrieved', { stats });
};

module.exports = {
  startDuty,
  endDuty,
  getActivities,
  getActivityById,
  getDailySummary,
  cancelActivity,
  getDriverStats
};
