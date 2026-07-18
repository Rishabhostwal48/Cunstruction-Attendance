require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Site = require('../src/models/Site');
const Attendance = require('../src/models/Attendance');
const Progress = require('../src/models/Progress');
const DriverActivity = require('../src/models/DriverActivity');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/construction-backend';

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Site.deleteMany({});
    await Attendance.deleteMany({});
    await Progress.deleteMany({});
    await DriverActivity.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create test users
    const ownerPassword = await bcrypt.hash('Owner@123', 10);
    const supervisorPassword = await bcrypt.hash('Supervisor@123', 10);
    const laborPassword = await bcrypt.hash('Labor@123', 10);
    const driverPassword = await bcrypt.hash('Driver@123', 10);

    const owner = new User({
      name: 'Project Owner',
      phone: '+1234567890',
      password: ownerPassword,
      role: 'OWNER',
      isActive: true
    });

    const supervisor = new User({
      name: 'Site Supervisor',
      phone: '+1234567891',
      password: supervisorPassword,
      role: 'SUPERVISOR',
      isActive: true
    });

    const labor1 = new User({
      name: 'Worker John',
      phone: '+1234567892',
      password: laborPassword,
      role: 'LABOR',
      isActive: true
    });

    const labor2 = new User({
      name: 'Worker Mike',
      phone: '+1234567893',
      password: laborPassword,
      role: 'LABOR',
      isActive: true
    });

    const driver = new User({
      name: 'Driver Tom',
      phone: '+1234567894',
      password: driverPassword,
      role: 'DRIVER',
      isActive: true
    });

    await User.insertMany([owner, supervisor, labor1, labor2, driver]);
    console.log('✓ Created 5 test users');

    // Create test sites
    const site1 = new Site({
      name: 'Downtown Construction',
      address: '123 Main Street, Downtown',
      latitude: 40.7128,
      longitude: -74.0060,
      radius: 150,
      owner: owner._id,
      assignedWorkers: [supervisor._id, labor1._id, labor2._id],
      status: 'ACTIVE',
      description: 'Main construction project',
      projectCode: 'PROJ001'
    });

    const site2 = new Site({
      name: 'Uptown Development',
      address: '456 Park Avenue, Uptown',
      latitude: 40.7282,
      longitude: -73.9942,
      radius: 200,
      owner: owner._id,
      assignedWorkers: [labor1._id],
      status: 'ACTIVE',
      description: 'Secondary construction project',
      projectCode: 'PROJ002'
    });

    await Site.insertMany([site1, site2]);
    console.log('✓ Created 2 test sites');

    // Update user assigned sites
    supervisor.assignedSites = [site1._id];
    labor1.assignedSites = [site1._id, site2._id];
    labor2.assignedSites = [site1._id];
    await User.updateMany(
      { _id: { $in: [supervisor._id, labor1._id, labor2._id] } },
      { $set: { assignedSites: [] } }
    );
    await supervisor.save();
    await labor1.save();
    await labor2.save();

    // Create test attendance records
    const attendance1 = new Attendance({
      user: labor1._id,
      site: site1._id,
      type: 'CHECKIN',
      photo: '/uploads/attendance/sample1.jpg',
      latitude: 40.7128,
      longitude: -74.0060,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      geofenceStatus: 'INSIDE',
      distance: 30
    });

    const attendance2 = new Attendance({
      user: labor1._id,
      site: site1._id,
      type: 'CHECKOUT',
      photo: '/uploads/attendance/sample2.jpg',
      latitude: 40.7130,
      longitude: -74.0062,
      timestamp: new Date(),
      geofenceStatus: 'INSIDE',
      distance: 45
    });

    await Attendance.insertMany([attendance1, attendance2]);
    console.log('✓ Created 2 test attendance records');

    // Create test progress records
    const progress1 = new Progress({
      site: site1._id,
      uploadedBy: supervisor._id,
      images: [
        {
          filename: 'progress1.jpg',
          url: '/uploads/progress/progress1.jpg',
          uploadedAt: new Date()
        }
      ],
      note: 'Foundation work completed successfully',
      workDescription: 'Completed foundation laying with all quality checks',
      progressPercentage: 25,
      status: 'APPROVED',
      approvedBy: owner._id,
      approvalNotes: 'Good progress, continue with next phase'
    });

    const progress2 = new Progress({
      site: site1._id,
      uploadedBy: supervisor._id,
      images: [
        {
          filename: 'progress2.jpg',
          url: '/uploads/progress/progress2.jpg',
          uploadedAt: new Date()
        }
      ],
      note: 'Wall construction phase started',
      workDescription: 'Began wall construction with proper alignment',
      progressPercentage: 35,
      status: 'PENDING'
    });

    await Progress.insertMany([progress1, progress2]);
    console.log('✓ Created 2 test progress records');

    // Create test driver activity records
    const driverActivity = new DriverActivity({
      driver: driver._id,
      vehicleNumber: 'ABC-1234',
      startTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
      endTime: new Date(),
      startMeter: 50000,
      endMeter: 50150,
      distanceTravelled: 150,
      startPhoto: {
        filename: 'vehicle_start.jpg',
        url: '/uploads/driver-activity/vehicle_start.jpg',
        uploadedAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
      },
      endPhoto: {
        filename: 'vehicle_end.jpg',
        url: '/uploads/driver-activity/vehicle_end.jpg',
        uploadedAt: new Date()
      },
      route: 'Downtown to Uptown',
      status: 'COMPLETED'
    });

    await DriverActivity.insertMany([driverActivity]);
    console.log('✓ Created 1 test driver activity record');

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('================');
    console.log('Owner:');
    console.log('  Phone: +1234567890');
    console.log('  Password: Owner@123');
    console.log('\nSupervisor:');
    console.log('  Phone: +1234567891');
    console.log('  Password: Supervisor@123');
    console.log('\nWorker:');
    console.log('  Phone: +1234567892');
    console.log('  Password: Labor@123');
    console.log('\nDriver:');
    console.log('  Phone: +1234567894');
    console.log('  Password: Driver@123');

    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
