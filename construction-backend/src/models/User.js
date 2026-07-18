const mongoose = require('mongoose');
const { hashPassword, comparePassword } = require('../utils/auth');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },

    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      trim: true,
      minlength: [10, 'Phone must be at least 10 characters'],
      validate: {
        validator: function(v) {
          return /^[0-9+\-\s()]{10,15}$/.test(v);
        },
        message: 'Invalid phone format'
      }
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default
    },

    role: {
      type: String,
      enum: ['OWNER', 'SUPERVISOR', 'LABOR', 'DRIVER'],
      default: 'LABOR'
    },

    assignedSite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      default: null
    },

    assignedSites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Site'
      }
    ],

    isActive: {
      type: Boolean,
      default: true
    },

    lastLogin: Date,

    profilePhoto: String,

    notes: String
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return comparePassword(enteredPassword, this.password);
};

// Method to get user without sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
