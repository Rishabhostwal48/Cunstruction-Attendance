const Progress = require("../models/Progress");
const Site = require("../models/Site");
const { saveFile, getFileUrl } = require("../utils/storage");
const { sendSuccess, sendPaginated } = require("../utils/response");
const {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} = require("../middleware/errorMiddleware");

/**
 * Upload progress update with image and note
 * POST /api/progress
 */
const uploadProgress = async (req, res) => {
  const { siteId, note, workDescription, progressPercentage } = req.validated;
  const files = req.files || [];
  
  // NO SITE = NO WORK: Verify user has assigned site
  if (!req.user.assignedSite) {
    throw new ForbiddenError('No site assigned. Contact your administrator.');
  }

  // SITE VALIDATION: Verify siteId matches user's assigned site
  if (siteId !== req.user.assignedSite.toString()) {
    throw new ForbiddenError('You can only upload progress for your assigned site');
  }

  // validate that at least one image is uploaded
  if (files.length === 0) {
    throw new ValidationError("At least one progress image is required");
  }

  const site = await Site.findById(siteId);
  if (!site) {
    throw new NotFoundError("Site");
  }

  // Verify user is owner or supervisor
  if (!["OWNER", "SUPERVISOR"].includes(req.user.role)) {
    throw new ForbiddenError("Only supervisors and owners can upload progress");
  }

  // Verify user is assigned to site
  if (!site.assignedWorkers.includes(req.user._id)) {
    throw new ForbiddenError("You are not assigned to this site");
  }

  const images = [];
  if (files.length > 0) {
    for (const file of files) {
      const photoPath = saveFile(file, "progress");
      images.push({
        filename: file.originalname,
        url: getFileUrl(photoPath),
      });
    }
  }

  const progress = new Progress({
    site: siteId,
    uploadedBy: req.user._id,
    images,
    note,
    workDescription,
    progressPercentage:
              progressPercentage ?? null,
    status: "PENDING",
  });

  await progress.save();
  await progress.populate("uploadedBy", "name phone role");
  await progress.populate("site", "name address");

  sendSuccess(res, 201, "Progress uploaded successfully", { progress });
};

/**
 * Get progress records
 * GET /api/progress
 */
const getProgress = async (req, res) => {
  const { siteId, uploadedBy, status, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (siteId) filter.site = siteId;
  if (uploadedBy) filter.uploadedBy = uploadedBy;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const records = await Progress.find(filter)
    .populate("uploadedBy", "name phone role")
    .populate("site", "name address")
    .populate("approvedBy", "name phone role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Progress.countDocuments(filter);

  sendPaginated(
    res,
    200,
    "Progress records retrieved",
    records,
    total,
    page,
    limit,
  );
};

/**
 * Get progress by ID
 * GET /api/progress/:id
 */
const getProgressById = async (req, res) => {
  const record = await Progress.findById(req.params.id)
    .populate("uploadedBy", "name phone role")
    .populate("site", "name address")
    .populate("approvedBy", "name phone role");

  if (!record) {
    throw new NotFoundError("Progress record");
  }

  sendSuccess(res, 200, "Progress record retrieved", { progress: record });
};

/**
 * Approve progress update (Owner/Supervisor only)
 * PUT /api/progress/:id/approve
 */
const approveProgress = async (req, res) => {
  const { approvalNotes } = req.body;

  const record = await Progress.findById(req.params.id);
  if (!record) {
    throw new NotFoundError("Progress record");
  }

  // Verify user is site owner or supervisor
  const site = await Site.findById(record.site);
  if (
    site.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "SUPERVISOR"
  ) {
    throw new ForbiddenError("You do not have permission to approve progress");
  }

  record.status = "APPROVED";
  record.approvedBy = req.user._id;
  if (approvalNotes) record.approvalNotes = approvalNotes;

  await record.save();
  await record.populate("uploadedBy", "name phone role");
  await record.populate("site", "name address");
  await record.populate("approvedBy", "name phone role");

  sendSuccess(res, 200, "Progress approved successfully", { progress: record });
};

/**
 * Reject progress update (Owner/Supervisor only)
 * PUT /api/progress/:id/reject
 */
const rejectProgress = async (req, res) => {
  const { approvalNotes } = req.body;

  if (!approvalNotes) {
    throw new ValidationError("Rejection reason is required");
  }

  const record = await Progress.findById(req.params.id);
  if (!record) {
    throw new NotFoundError("Progress record");
  }

  // Verify user is site owner or supervisor
  const site = await Site.findById(record.site);
  if (
    site.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "SUPERVISOR"
  ) {
    throw new ForbiddenError("You do not have permission to reject progress");
  }

  record.status = "REJECTED";
  record.approvedBy = req.user._id;
  record.approvalNotes = approvalNotes;

  await record.save();
  await record.populate("uploadedBy", "name phone role");
  await record.populate("site", "name address");
  await record.populate("approvedBy", "name phone role");

  sendSuccess(res, 200, "Progress rejected", { progress: record });
};

/**
 * Get site timeline
 * GET /api/progress/site/:siteId/timeline
 */
const getSiteTimeline = async (req, res) => {
  const { siteId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  const timeline = await Progress.find({ site: siteId })
    .populate("uploadedBy", "name phone role")
    .populate("site", "name address")
    .populate("approvedBy", "name phone role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Progress.countDocuments({ site: siteId });

  sendPaginated(
    res,
    200,
    "Site timeline retrieved",
    timeline,
    total,
    page,
    limit,
  );
};

/**
 * Get site progress statistics
 * GET /api/progress/site/:siteId/stats
 */
const getSiteProgressStats = async (req, res) => {
  const { siteId } = req.params;

  const stats = await Progress.aggregate([
    { $match: { site: require("mongoose").Types.ObjectId(siteId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgProgressPercentage: { $avg: "$progressPercentage" },
      },
    },
  ]);

  const totalUpdates = await Progress.countDocuments({ site: siteId });
  const avgProgress = await Progress.aggregate([
    { $match: { site: require("mongoose").Types.ObjectId(siteId) } },
    { $group: { _id: null, avgProgress: { $avg: "$progressPercentage" } } },
  ]);

  sendSuccess(res, 200, "Progress statistics retrieved", {
    totalUpdates,
    averageProgress: avgProgress[0]?.avgProgress || 0,
    statusBreakdown: stats,
  });
};

module.exports = {
  uploadProgress,
  getProgress,
  getProgressById,
  approveProgress,
  rejectProgress,
  getSiteTimeline,
  getSiteProgressStats,
};
