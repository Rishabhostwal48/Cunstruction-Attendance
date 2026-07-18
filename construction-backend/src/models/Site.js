const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
      minlength: [3, 'Site name must be at least 3 characters']
    },

    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      minlength: [5, 'Address must be at least 5 characters']
    },

    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },

    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },

    radius: {
      type: Number,
      default: 100,
      min: [10, 'Radius must be at least 10 meters'],
      max: [5000, 'Radius must not exceed 5000 meters']
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    assignedWorkers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'COMPLETED'],
      default: 'ACTIVE'
    },

    description: String,

    projectCode: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  { timestamps: true }
);

// Indexes
siteSchema.index({ owner: 1 });
siteSchema.index({ status: 1 });
siteSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Site', siteSchema);
