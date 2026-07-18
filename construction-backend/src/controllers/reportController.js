const Attendance = require('../models/Attendance');
const Progress = require('../models/Progress');
const DriverActivity = require('../models/DriverActivity');
const User = require('../models/User');
const Site = require('../models/Site');
const { sendSuccess } = require('../utils/response');
const { ForbiddenError, NotFoundError } = require('../middleware/errorMiddleware');

/**
 * Generate Daily Attendance Report
 * GET /api/reports/attendance/daily
 */
const getDailyAttendanceReport = async (req, res) => {
  const { siteId, date } = req.query;

  if (!siteId) {
    throw new NotFoundError('Site ID is required');
  }

  // Authorization check
  const site = await Site.findById(siteId);
  if (!site) {
    throw new NotFoundError('Site');
  }

  if (req.user.role === 'OWNER' && site.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You do not have access to this site');
  }

  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const report = await Attendance.aggregate([
    {
      $match: {
        site: require('mongoose').Types.ObjectId(siteId),
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: '$user',
        checkIns: {
          $push: {
            $cond: [{ $eq: ['$type', 'CHECKIN'] }, '$timestamp', null]
          }
        },
        checkOuts: {
          $push: {
            $cond: [{ $eq: ['$type', 'CHECKOUT'] }, '$timestamp', null]
          }
        },
        geofenceViolations: {
          $sum: { $cond: [{ $eq: ['$geofenceStatus', 'OUTSIDE'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'worker'
      }
    }
  ]);

  const formattedReport = report.map((entry) => {
    const checkInTime = entry.checkIns.filter(t => t !== null)[0];
    const checkOutTime = entry.checkOuts.filter(t => t !== null)[0];
    let hoursWorked = 0;

    if (checkInTime && checkOutTime) {
      hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    }

    return {
      worker: entry.worker[0],
      checkInTime: checkInTime ? new Date(checkInTime).toLocaleTimeString() : 'Not checked in',
      checkOutTime: checkOutTime ? new Date(checkOutTime).toLocaleTimeString() : 'Not checked out',
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
      geofenceViolations: entry.geofenceViolations
    };
  });

  sendSuccess(res, 200, 'Daily attendance report', {
    date: targetDate.toDateString(),
    site: { id: site._id, name: site.name },
    totalWorkers: formattedReport.length,
    report: formattedReport
  });
};

/**
 * Generate Site Progress Report
 * GET /api/reports/progress/site
 */
const getSiteProgressReport = async (req, res) => {
  const { siteId, fromDate, toDate } = req.query;

  if (!siteId) {
    throw new NotFoundError('Site ID is required');
  }

  const site = await Site.findById(siteId);
  if (!site) {
    throw new NotFoundError('Site');
  }

  if (req.user.role === 'OWNER' && site.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You do not have access to this site');
  }

  const filter = { site: siteId };

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const progressUpdates = await Progress.find(filter)
    .populate('uploadedBy', 'name phone role')
    .sort({ createdAt: -1 });

  const stats = {
    total: progressUpdates.length,
    approved: progressUpdates.filter(p => p.status === 'APPROVED').length,
    rejected: progressUpdates.filter(p => p.status === 'REJECTED').length,
    pending: progressUpdates.filter(p => p.status === 'PENDING').length,
    avgProgressPercentage: progressUpdates.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / (progressUpdates.length || 1)
  };

  sendSuccess(res, 200, 'Site progress report', {
    site: { id: site._id, name: site.name },
    statistics: stats,
    updates: progressUpdates
  });
};

/**
 * Generate Driver Activity Report
 * GET /api/reports/driver-activities
 */
const getDriverActivityReport = async (req, res) => {
  const { driverId, vehicleNumber, fromDate, toDate } = req.query;

  const filter = { status: 'COMPLETED' };

  if (driverId) {
    filter.driver = driverId;
  } else if (req.user.role !== 'OWNER') {
    filter.driver = req.user._id;
  }

  if (vehicleNumber) filter.vehicleNumber = { $regex: vehicleNumber, $options: 'i' };

  if (fromDate || toDate) {
    filter.startTime = {};
    if (fromDate) filter.startTime.$gte = new Date(fromDate);
    if (toDate) filter.startTime.$lte = new Date(toDate);
  }

  const activities = await DriverActivity.find(filter)
    .populate('driver', 'name phone')
    .sort({ startTime: -1 });

  const totalDistance = activities.reduce((sum, a) => sum + (a.distanceTravelled || 0), 0);
  const totalTrips = activities.length;
  const avgDistancePerTrip = totalTrips > 0 ? totalDistance / totalTrips : 0;

  // Group by vehicle
  const byVehicle = {};
  activities.forEach((activity) => {
    if (!byVehicle[activity.vehicleNumber]) {
      byVehicle[activity.vehicleNumber] = {
        vehicle: activity.vehicleNumber,
        trips: 0,
        totalDistance: 0,
        activities: []
      };
    }
    byVehicle[activity.vehicleNumber].trips += 1;
    byVehicle[activity.vehicleNumber].totalDistance += activity.distanceTravelled || 0;
    byVehicle[activity.vehicleNumber].activities.push(activity);
  });

  sendSuccess(res, 200, 'Driver activity report', {
    summary: {
      totalTrips,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      avgDistancePerTrip: parseFloat(avgDistancePerTrip.toFixed(2))
    },
    byVehicle,
    activities
  });
};

/**
 * Generate comprehensive site report
 * GET /api/reports/site/comprehensive
 */
const getComprehensiveSiteReport = async (req, res) => {
  const { siteId, fromDate, toDate } = req.query;

  if (!siteId) {
    throw new NotFoundError('Site ID is required');
  }

  const site = await Site.findById(siteId)
    .populate('owner', 'name phone')
    .populate('assignedWorkers', 'name phone role');

  if (!site) {
    throw new NotFoundError('Site');
  }

  if (req.user.role === 'OWNER' && site.owner._id.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You do not have access to this site');
  }

  const dateFilter = {};
  if (fromDate || toDate) {
    dateFilter.$gte = fromDate ? new Date(fromDate) : new Date(0);
    dateFilter.$lte = toDate ? new Date(toDate) : new Date();
  }

  // Attendance data
  const attendanceFilter = { site: siteId };
  if (fromDate || toDate) attendanceFilter.timestamp = dateFilter;

  const attendanceRecords = await Attendance.find(attendanceFilter);
  const uniqueWorkers = [...new Set(attendanceRecords.map(a => a.user.toString()))].length;

  // Progress data
  const progressFilter = { site: siteId };
  if (fromDate || toDate) progressFilter.createdAt = dateFilter;

  const progressRecords = await Progress.find(progressFilter);

  // Summary
  const report = {
    site: {
      id: site._id,
      name: site.name,
      address: site.address,
      owner: site.owner,
      totalAssignedWorkers: site.assignedWorkers.length
    },
    period: {
      from: fromDate || 'All time',
      to: toDate || 'All time'
    },
    attendance: {
      total: attendanceRecords.length,
      checkIns: attendanceRecords.filter(a => a.type === 'CHECKIN').length,
      checkOuts: attendanceRecords.filter(a => a.type === 'CHECKOUT').length,
      uniqueWorkers,
      geofenceViolations: attendanceRecords.filter(a => a.geofenceStatus === 'OUTSIDE').length
    },
    progress: {
      total: progressRecords.length,
      approved: progressRecords.filter(p => p.status === 'APPROVED').length,
      rejected: progressRecords.filter(p => p.status === 'REJECTED').length,
      pending: progressRecords.filter(p => p.status === 'PENDING').length
    }
  };

  sendSuccess(res, 200, 'Comprehensive site report', report);
};

/**
 * Export report as JSON (can be extended for CSV/Excel)
 * GET /api/reports/export/:reportType
 */
const exportReport = async (req, res) => {
  const { reportType } = req.params;
  const queryParams = req.query;

  let reportData;

  switch (reportType) {
    case 'attendance':
      reportData = await getDailyAttendanceReport.call({ user: req.user }, { query: queryParams });
      break;
    case 'progress':
      reportData = await getSiteProgressReport.call({ user: req.user }, { query: queryParams });
      break;
    case 'driver-activities':
      reportData = await getDriverActivityReport.call({ user: req.user }, { query: queryParams });
      break;
    default:
      throw new NotFoundError('Report type');
  }

  // Set response headers for download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=report-${reportType}-${Date.now()}.json`);

  res.json(reportData);
};

module.exports = {
  getDailyAttendanceReport,
  getSiteProgressReport,
  getDriverActivityReport,
  getComprehensiveSiteReport,
  exportReport
};
