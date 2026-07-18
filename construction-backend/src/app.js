const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();
require('express-async-errors');

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const siteRoutes = require('./routes/siteRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const progressRoutes = require('./routes/progressRoutes');
const driverActivityRoutes = require('./routes/driverActivityRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Import middleware
const { errorHandler, asyncHandler } = require('./middleware/errorMiddleware');
const { authenticate, authorize } = require('./middleware/authMiddleware');

const app = express();

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());
app.use(compression());

// CORS Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging Middleware
app.use(morgan('combined'));

// Serve static files for uploads
app.use('/uploads', express.static('src/uploads'));

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/driver-activities', driverActivityRoutes);
app.use('/api/reports', reportRoutes);

// Root API endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Construction Workforce Proof-of-Presence Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      sites: '/api/sites',
      attendance: '/api/attendance',
      progress: '/api/progress',
      driverActivities: '/api/driver-activities',
      reports: '/api/reports'
    }
  });
});

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global Error Handler
app.use(errorHandler);

// Unhandled Promise Rejection Handler
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
