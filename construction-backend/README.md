# Construction Workforce Proof-of-Presence Platform - Backend

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: January 15, 2025

---

## 📋 Overview

A production-ready backend for a Construction Workforce Proof-of-Presence Platform that provides verifiable proof of worker presence at construction sites. The system captures attendance with selfie verification, GPS coordinates, geofence validation, progress updates, and driver activities.

### Key Capabilities
✅ JWT-based authentication with 4 user roles  
✅ Geofence validation using Haversine formula  
✅ Attendance tracking with selfie verification  
✅ Progress monitoring with photo uploads  
✅ Driver activity tracking with meter readings  
✅ Comprehensive reporting and analytics  
✅ Role-based access control  
✅ Production-ready error handling  
✅ File upload abstraction layer for AWS S3 migration  
✅ Clean, maintainable monolithic architecture  

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB v4.4+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd construction-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Seed test data (optional)**
   ```bash
   npm run seed
   ```

Server runs at: `http://localhost:5000`

---

## 📚 Documentation

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Setup, architecture, and deployment
- **[Postman Collection](./postman_collection.json)** - Import for testing

---

## 🏗️ Architecture

### Technology Stack
```
Frontend: (Future)
Backend:  Node.js + Express.js
Database: MongoDB + Mongoose
Auth:     JWT + Bcryptjs
Storage:  Local (Ready for AWS S3)
Upload:   Multer
Validation: Joi
```

### System Design
```
┌─────────────────────────────────────────────────────────┐
│                   Client Application                     │
└────────────────────┬────────────────────────────────────┘
                     │ REST API (JWT Auth)
┌────────────────────▼────────────────────────────────────┐
│                  Express.js Server                       │
├─────────────────────────────────────────────────────────┤
│  Routes → Controllers → Models ← Middleware              │
│  │                                                        │
│  ├─ Auth Module         (JWT, Role-based Access)        │
│  ├─ Site Management     (Create, Assign, Update)        │
│  ├─ Attendance Module   (Check-in/out, Geofence)        │
│  ├─ Progress Module     (Photo upload, Approval)        │
│  ├─ Driver Module       (Start/End duty, Meter)         │
│  └─ Reports Module      (Comprehensive analytics)       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              MongoDB Database                            │
├─────────────────────────────────────────────────────────┤
│  Users │ Sites │ Attendance │ Progress │ DriverActivity  │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles

### 1. **OWNER**
- Create and manage sites
- Create and manage users
- Assign workers to sites
- View all attendance and progress
- Approve/reject progress updates
- Generate reports
- Access driver statistics

### 2. **SUPERVISOR**
- Check in/out at assigned sites
- Upload progress photos and notes
- View assigned workers
- Approve/reject progress updates
- View site attendance

### 3. **LABOR (Workers)**
- Check in/out with selfie
- Submit attendance from assigned sites
- View their own records
- View assigned site information

### 4. **DRIVER**
- Start/end duty with vehicle photos
- Record meter readings
- Calculate distance traveled
- View activity logs

---

## 🔑 Key Features

### 1. Authentication & Authorization
```javascript
// Register
POST /api/auth/register
Body: { name, phone, password, role }

// Login
POST /api/auth/login
Body: { phone, password }

// Protected Routes - Require JWT token
Authorization: Bearer <token>
```

### 2. Site Management
```javascript
// Owner creates site
POST /api/sites
Body: { name, address, latitude, longitude, radius }

// Assign worker to site
POST /api/sites/:id/assign-worker
Body: { userId }
```

### 3. Geofence Validation
- Uses Haversine formula
- Calculates distance in meters
- Marks check-in as INSIDE/OUTSIDE
- Tracks geofence violations
- Default radius: 100m, Max: 5000m

### 4. Attendance Tracking
```javascript
// Check in with selfie
POST /api/attendance/check-in
FormData: { file, siteId, latitude, longitude }

// Check out with selfie
POST /api/attendance/check-out
FormData: { file, latitude, longitude }
```

### 5. Progress Monitoring
```javascript
// Upload progress with photos
POST /api/progress
FormData: { files[], siteId, note, progressPercentage }

// Approve progress
PUT /api/progress/:id/approve
Body: { approvalNotes }
```

### 6. Driver Activities
```javascript
// Start duty
POST /api/driver-activities/start-duty
FormData: { file, vehicleNumber, startMeter }

// End duty
POST /api/driver-activities/end-duty
FormData: { file, endMeter }
```

### 7. Reports
- Daily attendance reports
- Site progress reports
- Driver activity reports
- Comprehensive site reports
- Export as JSON

---

## 📁 Project Structure

```
src/
├── app.js                          # Express app setup
├── config/
│   ├── db.js                       # MongoDB connection
│   └── multer.js                   # File upload config
├── controllers/                    # Business logic
│   ├── authController.js           # Auth logic
│   ├── siteController.js           # Site management
│   ├── attendanceController.js     # Attendance tracking
│   ├── progressController.js       # Progress monitoring
│   ├── driverActivityController.js # Driver tracking
│   └── reportController.js         # Report generation
├── models/                         # Mongoose schemas
│   ├── User.js
│   ├── Site.js
│   ├── Attendance.js
│   ├── Progress.js
│   └── DriverActivity.js
├── routes/                         # API endpoints
│   ├── authRoutes.js
│   ├── siteRoutes.js
│   ├── attendanceRoutes.js
│   ├── progressRoutes.js
│   ├── driverActivityRoutes.js
│   └── reportRoutes.js
├── middleware/                     # Express middleware
│   ├── authMiddleware.js           # JWT verification
│   └── errorMiddleware.js          # Error handling
├── utils/                          # Utility functions
│   ├── geofence.js                 # Geofence validation
│   ├── auth.js                     # JWT + password utils
│   ├── response.js                 # Response helpers
│   └── storage.js                  # File storage abstraction
├── validations/                    # Input validation
│   └── schemas.js                  # Joi validation schemas
└── uploads/                        # User files
    ├── attendance/
    ├── progress/
    └── driver-activity/
```

---

## 🔧 Configuration

### Environment Variables
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/construction-backend

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=7d

# File Upload
UPLOAD_DIR=./src/uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

---

## 🧪 Testing

### Using Postman
1. Import `postman_collection.json`
2. Set environment variables:
   - `base_url`: http://localhost:5000/api
   - `token`: (obtained after login)
3. Execute requests

### Using cURL
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","phone":"+1234567890","password":"Pass@123","role":"LABOR"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","password":"Pass@123"}'

# Get profile
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Seed Test Data
```bash
npm run seed
```

Test users created:
- **Owner**: +1234567890 / Owner@123
- **Supervisor**: +1234567891 / Supervisor@123
- **Worker**: +1234567892 / Labor@123
- **Driver**: +1234567894 / Driver@123

---

## 📊 API Endpoints Summary

| Module | Endpoints |
|--------|-----------|
| **Auth** | Register, Login, Profile, Change Password, List/Update Users |
| **Sites** | Create, Read, Update, Delete, Assign Workers |
| **Attendance** | Check-in, Check-out, Get Records, Daily Summary, Stats |
| **Progress** | Upload, Get, Approve, Reject, Timeline, Stats |
| **Drivers** | Start Duty, End Duty, Get Activities, Daily Summary, Stats |
| **Reports** | Attendance, Progress, Driver, Comprehensive, Export |

---

## 🗄️ Database Schema

### Users
- ID, Name, Phone (unique), Password (hashed), Role, Assigned Sites, Last Login, Profile Photo

### Sites
- ID, Name, Address, Latitude, Longitude, Radius, Owner, Assigned Workers, Status, Description

### Attendance
- ID, User, Site, Type (CHECKIN/CHECKOUT), Photo, Latitude, Longitude, Timestamp, Geofence Status, Distance

### Progress
- ID, Site, Uploaded By, Images[], Note, Work Description, Progress %, Status, Approved By, Approval Notes

### Driver Activity
- ID, Driver, Vehicle Number, Start/End Time, Start/End Meter, Photos, Distance Traveled, Route, Status

---

## 🔐 Security Features

✅ Password hashing with bcryptjs  
✅ JWT authentication with expiry  
✅ Role-based access control (RBAC)  
✅ Input validation with Joi  
✅ CORS protection  
✅ Helmet.js security headers  
✅ Error handling without exposing stack traces (production)  
✅ Rate limiting ready  
✅ SQL injection protection (MongoDB)  
✅ File upload validation  

---

## 📈 Performance

- **Database Indexing**: On frequently queried fields
- **Pagination**: Default 10 items/page
- **File Storage**: Memory-efficient multer
- **Query Optimization**: Populated relations only when needed
- **Compression**: Response compression enabled
- **Logging**: Morgan HTTP logger

---

## 🔄 Future Enhancements (Roadmap)

### Phase 2
- Email/SMS notifications
- Real-time WebSocket updates
- Advanced analytics dashboard
- Audit logging
- Rate limiting

### Phase 3
- AWS S3 integration
- Redis caching
- Advanced search and filtering
- Data encryption at rest
- Backup automation

### Phase 4
- Multi-site project management
- Team collaboration tools
- Mobile app integration
- API rate limiting per user
- Advanced permission matrix

---

## 🚨 Error Handling

All errors return consistent JSON:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": [{ "field": "name", "message": "Specific error" }]
}
```

**Common Status Codes**:
- 200 - Success
- 201 - Created
- 400 - Bad Request (validation)
- 401 - Unauthorized
- 403 - Forbidden (insufficient permissions)
- 404 - Not Found
- 500 - Internal Server Error

---

## 📦 Dependencies

### Core
- express: Web framework
- mongoose: MongoDB ODM
- jsonwebtoken: JWT authentication
- bcryptjs: Password hashing

### File Handling
- multer: File upload middleware

### Validation
- joi: Input validation

### Middleware
- cors: CORS support
- helmet: Security headers
- compression: Response compression
- morgan: HTTP logging
- dotenv: Environment variables

---

## 🛠️ Development Workflow

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Make changes** to controllers/routes/models

3. **Test with Postman** or cURL

4. **Check database** with MongoDB Compass

5. **Review logs** in terminal

---

## 📝 API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "attendance": { ... },
    "geofence": {
      "isInside": true,
      "distance": 45,
      "radius": 150
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Phone is required" }
  ]
}
```

---

## 🌐 Deployment

### Heroku
```bash
heroku create construction-backend
git push heroku main
heroku config:set MONGO_URI=<mongodb_uri>
```

### Docker
```bash
docker build -t construction-backend .
docker run -p 5000:5000 -e MONGO_URI=<uri> construction-backend
```

### AWS EC2
- Use PM2 for process management
- Configure Nginx as reverse proxy
- Use SSL with Let's Encrypt

---

## 📞 Support

- **Issues**: Create GitHub issue
- **Email**: [your-email@example.com]
- **Documentation**: See docs folder

---

## 📄 License

MIT License - Open source and free to use

---

## ✅ Checklist for Production

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET`
- [ ] Configure production `MONGO_URI`
- [ ] Set appropriate CORS origins
- [ ] Enable HTTPS/SSL
- [ ] Set up error logging/monitoring
- [ ] Configure file storage (AWS S3)
- [ ] Set up automated backups
- [ ] Configure rate limiting
- [ ] Review security headers

---

**Ready to build! Start with `npm run dev`** 🚀

---

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

For development setup and architecture, see [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
