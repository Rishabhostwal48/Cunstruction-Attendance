const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site is required']
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required']
    },

    images: [
      {
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],

    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note must not exceed 500 characters']
    },

    workDescription: {
      type: String,
      trim: true,
      maxlength: [1000, 'Work description must not exceed 1000 characters']
    },

    progressPercentage: {
      type: Number,
      min: [0, 'Progress must be at least 0%'],
      max: [100, 'Progress must not exceed 100%']
    },

    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    approvalNotes: String
  },
  { timestamps: true }
);

// Indexes
progressSchema.index({ site: 1, createdAt: -1 });
progressSchema.index({ uploadedBy: 1 });
progressSchema.index({ status: 1 });

module.exports = mongoose.model('Progress', progressSchema);
