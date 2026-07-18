const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },

    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site is required']
    },

    type: {
      type: String,
      enum: ['CHECKIN', 'CHECKOUT'],
      required: true
    },

    photo: {
      type: String,
      required: [true, 'Photo is required for attendance']
    },

    latitude: {
      type: Number,
      required: [true, 'Latitude is required']
    },

    longitude: {
      type: Number,
      required: [true, 'Longitude is required']
    },

    timestamp: {
      type: Date,
      default: Date.now
    },

    geofenceStatus: {
      type: String,
      enum: ['INSIDE', 'OUTSIDE'],
      default: 'OUTSIDE'
    },

    distance: {
      type: Number,
      description: 'Distance from site in meters'
    },

    notes: String
  },
  { timestamps: true }
);

// Indexes
attendanceSchema.index({ user: 1, site: 1, timestamp: -1 });
attendanceSchema.index({ site: 1, timestamp: -1 });
attendanceSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
