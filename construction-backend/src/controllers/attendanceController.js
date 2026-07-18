const Attendance = require("../models/Attendance");
const Site = require("../models/Site");
const { saveFile, getFileUrl } = require("../utils/storage");
const { validateWorkerLocation } = require("../utils/geofence");
const { sendSuccess, sendPaginated } = require("../utils/response");
const {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} = require("../middleware/errorMiddleware");

/**
 * Check In
 * POST /api/attendance/check-in
 */
const checkIn = async (req, res) => {
  const { siteId, latitude, longitude } = req.validated;
  const file = req.file;

  // NO SITE = NO WORK: Verify user has assigned site
  if (!req.user.assignedSite) {
    throw new ForbiddenError('No site assigned. Contact your administrator.');
  }

  // SITE VALIDATION: Verify siteId matches user's assigned site
  if (siteId !== req.user.assignedSite.toString()) {
    throw new ForbiddenError('You can only check in at your assigned site');
  }

  if (!file) {
    throw new ValidationError("Photo is required for check-in");
  }

  const site = await Site.findById(siteId);
  if (!site) {
    throw new NotFoundError("Site");
  }

  // Verify worker is assigned to site
  if (!site.assignedWorkers.includes(req.user._id)) {
    throw new ForbiddenError("You are not assigned to this site");
  }

  // Prevent duplicate check-ins
  const lastAttendance = await Attendance.findOne({
    user: req.user._id,
  }).sort({ timestamp: -1 });

  if (lastAttendance && lastAttendance.type === "CHECKIN") {
    throw new ValidationError(
      "You are already checked in. Please check out first.",
    );
  }

  // Validate geofence
  const geofenceValidation = validateWorkerLocation(site, latitude, longitude);

  // Save photo
  const photoPath = saveFile(file, "attendance");

  const attendance = new Attendance({
    user: req.user._id,
    site: siteId,
    type: "CHECKIN",
    photo: photoPath,
    latitude,
    longitude,
    timestamp: new Date(),
    geofenceStatus: geofenceValidation.status,
    distance: geofenceValidation.distance,
  });

  await attendance.save();
  await attendance.populate("user", "name phone role");
  await attendance.populate("site", "name address");

  sendSuccess(res, 201, "Check-in successful", {
    attendance,
    geofence: {
      isInside: geofenceValidation.isInside,
      distance: geofenceValidation.distance,
      radius: geofenceValidation.radius,
    },
  });
};

/**
 * Check Out
 * POST /api/attendance/check-out
 */
const checkOut = async (req, res) => {
  const { latitude, longitude } = req.validated;
  const file = req.file;

  // NO SITE = NO WORK: Verify user has assigned site
  if (!req.user.assignedSite) {
    throw new ForbiddenError('No site assigned. Contact your administrator.');
  }

  if (!file) {
    throw new ValidationError("Photo is required for check-out");
  }

  // Find active check-in
  const lastAttendance = await Attendance.findOne({
    user: req.user._id,
  }).sort({ timestamp: -1 });

  if (!lastAttendance || lastAttendance.type !== "CHECKIN") {
    throw new ValidationError(
      "No active check-in found. Please check in first.",
    );
  }

  // SITE VALIDATION: Verify checkout is at same site as check-in
  if (lastAttendance.site.toString() !== req.user.assignedSite.toString()) {
    throw new ForbiddenError('You can only check out at your assigned site');
  }

  const site = await Site.findById(lastAttendance.site);

  // Validate geofence
  const geofenceValidation = validateWorkerLocation(site, latitude, longitude);

  // Save photo
  const photoPath = saveFile(file, "attendance");

  const attendance = new Attendance({
    user: req.user._id,
    site: lastAttendance.site,
    type: "CHECKOUT",
    photo: photoPath,
    latitude,
    longitude,
    timestamp: new Date(),
    geofenceStatus: geofenceValidation.status,
    distance: geofenceValidation.distance,
  });

  await attendance.save();
  await attendance.populate("user", "name phone role");
  await attendance.populate("site", "name address");

  sendSuccess(res, 201, "Check-out successful", {
    attendance,
    geofence: {
      isInside: geofenceValidation.isInside,
      distance: geofenceValidation.distance,
      radius: geofenceValidation.radius,
    },
  });
};

/**
 * Get attendance records
 * GET /api/attendance
 */
const getAttendance = async (req, res) => {
  const {
    userId,
    siteId,
    type,
    fromDate,
    toDate,
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};

  // Authorization: Users can only see their own records unless they're Owner
  if (req.user.role !== "OWNER") {
    filter.user = req.user._id;
  } else if (userId) {
    filter.user = userId;
  }

  if (siteId) filter.site = siteId;
  if (type) filter.type = type;

  if (fromDate || toDate) {
    filter.timestamp = {};
    if (fromDate) filter.timestamp.$gte = new Date(fromDate);
    if (toDate) filter.timestamp.$lte = new Date(toDate);
  }

  const skip = (page - 1) * limit;

  const records = await Attendance.find(filter)
    .populate("user", "name phone role")
    .populate("site", "name address")
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Attendance.countDocuments(filter);

  sendPaginated(
    res,
    200,
    "Attendance records retrieved",
    records,
    total,
    page,
    limit,
  );
};

/**
 * Get attendance by ID
 * GET /api/attendance/:id
 */
const getAttendanceById = async (req, res) => {
  const record = await Attendance.findById(req.params.id)
    .populate("user", "name phone role")
    .populate("site", "name address");

  if (!record) {
    throw new NotFoundError("Attendance record");
  }

  // Authorization check
  if (
    req.user.role !== "OWNER" &&
    record.user._id.toString() !== req.user._id.toString()
  ) {
    throw new ForbiddenError("You do not have access to this record");
  }

  sendSuccess(res, 200, "Attendance record retrieved", { attendance: record });
};

/**
 * Get worker's daily attendance summary
 * GET /api/attendance/summary/daily
 */
const getDailyAttendanceSummary = async (req, res) => {
  const { userId, siteId, date } = req.query;

  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const filter = {
    timestamp: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  };

  if (req.user.role !== "OWNER") {
    filter.user = req.user._id;
  } else if (userId) {
    filter.user = userId;
  }

  if (siteId) filter.site = siteId;

  const records = await Attendance.find(filter)
    .populate("user", "name phone role")
    .populate("site", "name address")
    .sort({ timestamp: 1 });

  const checkIns = records.filter((r) => r.type === "CHECKIN");
  const checkOuts = records.filter((r) => r.type === "CHECKOUT");

  let hoursWorked = 0;
  if (checkIns.length > 0 && checkOuts.length > 0) {
    const lastCheckIn = checkIns[checkIns.length - 1];
    const lastCheckOut = checkOuts[checkOuts.length - 1];
    hoursWorked =
      (lastCheckOut.timestamp - lastCheckIn.timestamp) / (1000 * 60 * 60);
  }

  sendSuccess(res, 200, "Daily attendance summary retrieved", {
    date: targetDate.toDateString(),
    checkIns: checkIns.length,
    checkOuts: checkOuts.length,
    hoursWorked: parseFloat(hoursWorked.toFixed(2)),
    records,
  });
};

/**
 * Get attendance statistics (Owner only)
 * GET /api/attendance/stats
 */
const getAttendanceStats = async (req, res) => {
  const { fromDate, toDate } = req.query;

  const filter = {};
  if (fromDate || toDate) {
    filter.timestamp = {};
    if (fromDate) filter.timestamp.$gte = new Date(fromDate);
    if (toDate) filter.timestamp.$lte = new Date(toDate);
  }

  const stats = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$user",
        totalCheckIns: {
          $sum: { $cond: [{ $eq: ["$type", "CHECKIN"] }, 1, 0] },
        },
        totalCheckOuts: {
          $sum: { $cond: [{ $eq: ["$type", "CHECKOUT"] }, 1, 0] },
        },
        insideGeofence: {
          $sum: { $cond: [{ $eq: ["$geofenceStatus", "INSIDE"] }, 1, 0] },
        },
        outsideGeofence: {
          $sum: { $cond: [{ $eq: ["$geofenceStatus", "OUTSIDE"] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
  ]);

  sendSuccess(res, 200, "Attendance statistics retrieved", { stats });
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  getAttendanceById,
  getDailyAttendanceSummary,
  getAttendanceStats,
};
