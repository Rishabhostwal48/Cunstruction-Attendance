const mongoose = require('mongoose');

const driverActivitySchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver is required']
    },

    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      minlength: [3, 'Vehicle number must be at least 3 characters']
    },

    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },

    endTime: Date,

    startMeter: {
      type: Number,
      required: [true, 'Start meter reading is required'],
      min: [0, 'Meter reading cannot be negative']
    },

    endMeter: {
      type: Number,
      min: [0, 'Meter reading cannot be negative']
    },

    distanceTravelled: {
      type: Number,
      description: 'Distance calculated from meter readings'
    },

    startPhoto: {
      filename: String,
      url: String,
      uploadedAt: Date
    },

    endPhoto: {
      filename: String,
      url: String,
      uploadedAt: Date
    },

    route: String,

    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE'
    },

    notes: String
  },
  { timestamps: true }
);

// Indexes
driverActivitySchema.index({ driver: 1, startTime: -1 });
driverActivitySchema.index({ vehicleNumber: 1 });
driverActivitySchema.index({ status: 1 });

// Middleware to calculate distance travelled
driverActivitySchema.pre('save', function(next) {
  if (this.endMeter && this.startMeter) {
    this.distanceTravelled = this.endMeter - this.startMeter;
  }
  next();
});

module.exports = mongoose.model('DriverActivity', driverActivitySchema);
