# Construction Workforce Proof-of-Presence Platform - Development Guide

## Project Overview

This is a production-ready backend for a Construction Workforce Proof-of-Presence Platform. It provides verifiable proof that workers, supervisors, and drivers were present at assigned construction sites and performed assigned activities.

### Key Features
- JWT-based authentication with role-based access control
- Geofence validation using Haversine formula
- Attendance tracking with selfie verification
- Progress monitoring with image uploads
- Driver activity tracking with meter readings
- Comprehensive reporting and analytics
- File upload system with storage abstraction for future AWS S3 migration

---

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **Bcryptjs** - Password hashing

### Architecture
- Clean monolithic architecture
- Modular folder structure
- Separation of concerns
- Ready for future microservices migration

---

## Project Structure

```
src/
├── app.js                 # Express app configuration
├── config/
│   ├── db.js             # MongoDB connection
│   └── multer.js         # File upload configuration
├── controllers/          # Business logic
│   ├── authController.js
│   ├── siteController.js
│   ├── attendanceController.js
│   ├── progressController.js
│   ├── driverActivityController.js
│   └── reportController.js
├── models/               # Mongoose schemas
│   ├── User.js
│   ├── Site.js
│   ├── Attendance.js
│   ├── Progress.js
│   └── DriverActivity.js
├── routes/               # API endpoints
│   ├── authRoutes.js
│   ├── siteRoutes.js
│   ├── attendanceRoutes.js
│   ├── progressRoutes.js
│   ├── driverActivityRoutes.js
│   └── reportRoutes.js
├── middleware/           # Express middleware
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── utils/                # Utility functions
│   ├── geofence.js       # Geofence validation
│   ├── auth.js           # JWT and password utilities
│   ├── response.js       # Response helpers
│   └── storage.js        # File storage abstraction
├── validations/          # Input validation
│   └── schemas.js        # Joi validation schemas
├── uploads/              # User uploaded files
│   ├── attendance/
│   ├── progress/
│   └── driver-activity/
└── scripts/              # Utility scripts
    └── seed.js           # Database seeding
```

---

## Installation & Setup

### Prerequisites
- Node.js v18+ 
- MongoDB v4.4+ (local or remote)
- npm or yarn

### Step 1: Clone and Install Dependencies

```bash
cd construction-backend
npm install
```

### Step 2: Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/construction-backend

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRY=7d

# File Upload Configuration
UPLOAD_DIR=./src/uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### Step 3: Start MongoDB

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGO_URI in .env with your connection string
```

### Step 4: Start Development Server

```bash
npm run dev
```

Server will be running at `http://localhost:5000`

### Step 5: Verify Installation

Visit: `http://localhost:5000/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00Z",
  "environment": "development"
}
```

---

## Database Setup

### MongoDB Connection

The application automatically connects to MongoDB on startup. Ensure:

1. MongoDB service is running
2. `MONGO_URI` in `.env` is correct
3. Database and collections are created automatically by Mongoose

### Database Indexes

All indexes are automatically created by Mongoose based on schema definitions. Key indexes include:
- User: `phone`, `role`, `isActive`
- Site: `owner`, `status`
- Attendance: `user+site+timestamp`, `site+timestamp`, `user+type`
- Progress: `site+createdAt`, `uploadedBy`, `status`
- DriverActivity: `driver+startTime`, `vehicleNumber`, `status`

---

## User Roles & Permissions

### 1. OWNER
- Creates and manages sites
- Creates and manages users
- Assigns workers to sites
- Views all attendance and progress records
- Approves/rejects progress updates
- Generates all reports
- Manages driver activities

### 2. SUPERVISOR
- Checks in/out at assigned sites
- Uploads progress photos and notes
- Views assigned workers
- Approves/rejects progress updates
- Views site attendance

### 3. LABOR (Workers)
- Checks in/out with selfie at assigned sites
- Views assigned site information
- Views their own attendance records

### 4. DRIVER
- Starts and ends duty with vehicle photos
- Records meter readings
- Views their own activity logs

---

## API Authentication

### Getting Started with Authentication

1. **Register a User**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "phone": "+1234567890",
       "password": "SecurePass123",
       "role": "LABOR"
     }'
   ```

2. **Login**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "phone": "+1234567890",
       "password": "SecurePass123"
     }'
   ```

3. **Use Token in Requests**
   ```bash
   curl -X GET http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer <your_token_here>"
   ```

### JWT Token Structure
- Expires in: 7 days (configurable via `JWT_EXPIRY`)
- Contains: User ID and Role
- Used for all protected endpoints

---

## File Upload System

### Upload Directories
- `/attendance` - Selfie photos for attendance
- `/progress` - Site progress photos
- `/driver-activity` - Vehicle and meter photos

### File Constraints
- **Allowed Types**: JPG, JPEG, PNG, GIF, WebP
- **Max Size**: 5MB (configurable)
- **Storage**: Local filesystem (ready for AWS S3 migration)

### Example Upload with cURL
```bash
curl -X POST http://localhost:5000/api/attendance/check-in \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/selfie.jpg" \
  -F "siteId=<site_id>" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"
```

---

## Geofence Validation

### How It Works
The system uses the Haversine formula to calculate distance between:
- Site center coordinates (latitude, longitude)
- Worker's current location (latitude, longitude)
- Allowed radius (default: 100 meters, max: 5000 meters)

### Implementation
```javascript
const { validateWorkerLocation } = require('./utils/geofence');

const site = await Site.findById(siteId);
const result = validateWorkerLocation(site, workerLat, workerLon);

// Result contains:
// - isInside: boolean
// - distance: number (in meters)
// - status: 'INSIDE' or 'OUTSIDE'
```

### Accuracy
- Accurate within 0.5-2 meters for most implementations
- Suitable for construction site geofencing (typically 50-200m radius)

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "errors": [
    { "field": "name", "message": "Field-specific error" }
  ]
}
```

### Common Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### Error Handling Middleware
All errors are caught globally and formatted consistently.

---

## API Usage Examples

### 1. Create a Site
```bash
curl -X POST http://localhost:5000/api/sites \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Site",
    "address": "123 Construction Ave",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 150
  }'
```

### 2. Assign Worker to Site
```bash
curl -X POST http://localhost:5000/api/sites/<site_id>/assign-worker \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "userId": "<worker_user_id>" }'
```

### 3. Worker Check-In
```bash
curl -X POST http://localhost:5000/api/attendance/check-in \
  -H "Authorization: Bearer <token>" \
  -F "file=@selfie.jpg" \
  -F "siteId=<site_id>" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"
```

### 4. Get Daily Attendance Report
```bash
curl -X GET "http://localhost:5000/api/reports/attendance/daily?siteId=<site_id>&date=2025-01-15" \
  -H "Authorization: Bearer <token>"
```

---

## Validation Rules

### User Registration
- **Name**: Min 2, Max 100 characters
- **Phone**: Valid phone format, unique
- **Password**: Min 6 characters, must include uppercase, lowercase, numbers
- **Role**: Must be one of: OWNER, SUPERVISOR, LABOR, DRIVER

### Site Creation
- **Name**: Min 3, Max 100 characters
- **Address**: Min 5, Max 200 characters
- **Latitude**: Between -90 and 90
- **Longitude**: Between -180 and 180
- **Radius**: Min 10m, Max 5000m

### Attendance
- **Photo**: Required (JPG, PNG, GIF, WebP)
- **Latitude/Longitude**: Required valid coordinates
- **Site**: Must exist and worker must be assigned

---

## Testing the API

### Using Postman
1. Import `postman_collection.json` into Postman
2. Set variables:
   - `base_url`: http://localhost:5000/api
   - `token`: (Update after login)
3. Run requests from collections

### Using cURL
See examples above

### Using Insomnia
1. Import collection
2. Configure environment variables
3. Execute requests

---

## Performance Optimization

### Database Queries
- Indexes on frequently queried fields
- Pagination support (default 10 items per page)
- Population optimization with `.select()`

### File Uploads
- In-memory storage for multer (efficient)
- Configurable max file size
- File type validation

### Response Caching
- Ready for Redis integration
- Short TTL for reports

---

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
JWT_SECRET=<long_random_string>
MONGO_URI=<production_mongodb_uri>
CORS_ORIGIN=https://yourdomain.com
```

### Deployment Options

#### 1. Heroku
```bash
heroku create construction-backend
git push heroku main
heroku config:set MONGO_URI=<mongodb_uri>
```

#### 2. AWS EC2
- Use PM2 for process management
- Configure Nginx as reverse proxy
- Set up SSL with Let's Encrypt

#### 3. Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/app.js"]
```

---

## Future AWS S3 Migration

### Storage Abstraction Layer
The project is designed for easy AWS S3 migration:

```javascript
// Current implementation uses local storage
const photoPath = saveFile(file, 'attendance');

// Future S3 implementation would use:
const photoPath = await saveFileS3(file, 'attendance');
```

### Migration Steps
1. Set up AWS S3 bucket
2. Install AWS SDK: `npm install aws-sdk`
3. Implement S3 functions in `utils/storage.js`
4. Update environment variables
5. Update middleware to handle S3 URLs

---

## Troubleshooting

### MongoDB Connection Error
- Verify MongoDB is running
- Check `MONGO_URI` in `.env`
- Ensure network access (if using MongoDB Atlas)

### File Upload Issues
- Check upload directory permissions
- Verify file size under 5MB
- Ensure file type is allowed (JPG, PNG, GIF, WebP)

### Authentication Errors
- Verify JWT token is valid
- Check token expiry
- Ensure Authorization header format is correct: `Bearer <token>`

### Geofence Validation
- Verify latitude/longitude format (decimal degrees)
- Ensure coordinates are within valid ranges
- Check site radius configuration

---

## Development Workflow

### 1. Feature Development
1. Create feature branch
2. Make changes
3. Test API endpoints
4. Create pull request

### 2. Database Migration
1. Update schema in models/
2. Create index if needed
3. Test with data

### 3. API Changes
1. Update controller
2. Update validation schema
3. Update documentation
4. Test with Postman

---

## Next Steps

### Phase 1 (Complete)
- ✓ Core backend implementation
- ✓ Authentication & authorization
- ✓ Attendance tracking with geofence
- ✓ Progress monitoring
- ✓ Driver activities
- ✓ Reports

### Phase 2 (Next)
- [ ] Email/SMS notifications
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics dashboard
- [ ] Audit logging
- [ ] Rate limiting

### Phase 3
- [ ] AWS S3 integration
- [ ] Redis caching
- [ ] Advanced search
- [ ] Data encryption

---

## Support & Resources

- **API Documentation**: See `API_DOCUMENTATION.md`
- **Postman Collection**: `postman_collection.json`
- **GitHub Issues**: Report bugs and feature requests

---

## License

MIT License - See LICENSE file for details

---

## Contributors

- Lead Backend Engineer: [Your Name]
- Architecture: Production-ready monolithic design

---

## Quick Reference

### Useful Commands
```bash
# Start development server
npm run dev

# Start production server
npm start

# Seed database (create test data)
npm run seed

# View logs
tail -f debug.log
```

### API Health Check
```bash
curl http://localhost:5000/health
```

### Common Port Issues
```bash
# If port 5000 is in use
lsof -i :5000
kill -9 <PID>
```

---

**Last Updated**: January 15, 2025
**Version**: 1.0.0
