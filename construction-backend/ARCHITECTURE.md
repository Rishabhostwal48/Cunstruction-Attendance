# Construction Workforce Proof-of-Presence Platform - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Client Applications                            │
│     (Web, Mobile, Desktop) or Third-party Services              │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────────┐
│                    API Gateway                                   │
│              (CORS, Rate Limiting, Auth)                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                  Express.js Server                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Request Pipeline                            │  │
│  │  Middleware → Route → Controller → Model → Response     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Core Modules                                 │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐   │   │
│  │  │   Auth       │  │   Sites      │  │ Attendance  │   │   │
│  │  │ (JWT, Roles) │  │ (Management) │  │ (Geofence)  │   │   │
│  │  └──────────────┘  └──────────────┘  └─────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐   │   │
│  │  │  Progress    │  │   Drivers    │  │  Reports    │   │   │
│  │  │ (Monitoring) │  │ (Activities) │  │ (Analytics) │   │   │
│  │  └──────────────┘  └──────────────┘  └─────────────┘   │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Utilities & Services                            │   │
│  │  Geofence │ Auth Utils │ Storage │ Response │ Validation    │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Mongoose ODM
┌─────────────────────▼───────────────────────────────────────────┐
│                  MongoDB Database                                │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────┐     │
│  │  Users   │  │  Sites   │  │ Attendance  │  │ Progress │     │
│  │          │  │          │  │             │  │          │     │
│  │ (5 fields)  (10 fields)  (11 fields)  (8 fields)    │
│  └──────────┘  └──────────┘  └─────────────┘  └──────────┘     │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────────────────────┐     │
│  │ DriverActivity   │  │ Indexes & Optimization           │     │
│  │ (9 fields)      │  │ - Composite indexes               │     │
│  └──────────────────┘  │ - Query optimization             │     │
│                        │ - TTL support                    │     │
│                        └──────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│              File Storage Layer                                  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Storage Abstraction                           │   │
│  │                                                          │   │
│  │  Local Storage (Current)    →    AWS S3 (Future)       │   │
│  │  /uploads/attendance/           s3://bucket/attendance  │   │
│  │  /uploads/progress/             s3://bucket/progress    │   │
│  │  /uploads/driver-activity/      s3://bucket/driver/     │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Attendance Check-In Flow

```
┌─────────────┐
│   Worker    │
│  App/Web    │
└─────┬───────┘
      │ 1. POST /api/attendance/check-in
      │    + Selfie photo
      │    + GPS coordinates
      │    + Site ID
      ▼
┌─────────────────────────────────────┐
│   Express Route Handler             │
│  - Validate file                    │
│  - Validate coordinates             │
└─────┬───────────────────────────────┘
      │ 2. Call Controller
      ▼
┌─────────────────────────────────────┐
│   AttendanceController.checkIn()    │
│  - Verify site exists               │
│  - Check worker assignment          │
└─────┬───────────────────────────────┘
      │ 3. Geofence Validation
      ▼
┌─────────────────────────────────────┐
│   GeofenceValidator                 │
│  - Calculate distance (Haversine)   │
│  - Compare with radius              │
│  - Return INSIDE/OUTSIDE status     │
└─────┬───────────────────────────────┘
      │ 4. Save File
      ▼
┌─────────────────────────────────────┐
│   StorageHandler                    │
│  - Save photo locally               │
│  - Return file path                 │
└─────┬───────────────────────────────┘
      │ 5. Save to Database
      ▼
┌─────────────────────────────────────┐
│   Attendance Model                  │
│  - User, Site, Type                 │
│  - Photo path, Coordinates          │
│  - Geofence status, Distance        │
└─────┬───────────────────────────────┘
      │ 6. Return Response
      ▼
┌─────────────┐
│   Worker    │
│   Success   │
│   + Geofence│
│   Details   │
└─────────────┘
```

### 2. Progress Approval Flow

```
┌──────────────────┐
│   Supervisor     │
│   Uploads        │
│   Progress       │
└────────┬─────────┘
         │
         ▼
   ┌─────────────────────────────┐
   │  POST /api/progress         │
   │  + Photos                   │
   │  + Site ID                  │
   │  + Work notes               │
   │  + Progress %               │
   └────────┬────────────────────┘
            │
            ▼
   ┌─────────────────────────────┐
   │  Progress Model Created     │
   │  Status: PENDING            │
   └────────┬────────────────────┘
            │
     ┌──────▼─────────────────────────────┐
     │  Owner/Supervisor Reviews          │
     │  PUT /api/progress/:id/approve     │
     │  or                                │
     │  PUT /api/progress/:id/reject      │
     └──────┬─────────────────────────────┘
            │
      ┌─────▼──────────────────┐
      │ Update Progress Status │
      │ + Approval Notes       │
      │ + Approved By User ID  │
      └─────┬──────────────────┘
            │
      ┌─────▼──────────────────┐
      │ Status: APPROVED       │
      │ or REJECTED            │
      │                        │
      │ Notify Supervisor      │
      └────────────────────────┘
```

### 3. Driver Activity Flow

```
┌─────────────┐
│   Driver    │
│  Starts     │
│   Duty      │
└────────┬────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ POST /api/driver-activities/ │
   │       start-duty             │
   │ + Vehicle photo              │
   │ + Vehicle number             │
   │ + Start meter reading        │
   └────────┬─────────────────────┘
            │
            ▼
   ┌──────────────────────────────┐
   │ DriverActivity Created       │
   │ Status: ACTIVE               │
   │ Start Time: Now              │
   └────────┬─────────────────────┘
            │
   ┌────────▼─────────────────────┐
   │  Driver Works               │
   │  (Duration varies)          │
   └────────┬─────────────────────┘
            │
            ▼
   ┌──────────────────────────────┐
   │ POST /api/driver-activities/ │
   │       end-duty               │
   │ + Vehicle photo              │
   │ + End meter reading          │
   └────────┬─────────────────────┘
            │
            ▼
   ┌──────────────────────────────┐
   │ Calculate Distance           │
   │ endMeter - startMeter        │
   └────────┬─────────────────────┘
            │
            ▼
   ┌──────────────────────────────┐
   │ Update DriverActivity        │
   │ Status: COMPLETED            │
   │ Distance: X km               │
   │ Duration: Y hours            │
   └──────────────────────────────┘
```

---

## Authentication & Authorization Flow

```
┌──────────────────┐
│  User Request    │
│  + Credentials   │
└────────┬─────────┘
         │
         ▼
   ┌─────────────────────────────┐
   │ Authentication Middleware   │
   │ - Check if endpoint requires auth
   │ - Extract JWT from header   │
   │ - Verify signature          │
   │ - Check expiration          │
   └────────┬────────────────────┘
            │
       ┌────▼─────────────┐
       │ Valid JWT?       │
       ├─────┬────────────┤
       │Yes  │ No         │
       ▼     ▼            │
   ┌────┐ ┌─────────────┐ │
   │Cont│ │Return 401   │ │
   │    │ │Unauthorized │ │
   └─┬──┘ └─────────────┘ │
     │                     │
     ▼                     │
 ┌────────────────────┐    │
 │Get User from DB    │    │
 │(based on JWT ID)   │    │
 └────┬───────────────┘    │
      │                    │
      ▼                    │
 ┌────────────────────────┐ │
 │Authorization           │ │
 │Middleware              │ │
 │Check user.role         │ │
 │allowed_roles = [...]   │ │
 └────┬───────────────────┘ │
      │                     │
  ┌───▼──────────────┐      │
  │Role Match?       │      │
  ├────┬─────────────┤      │
  │Yes │ No          │      │
  ▼    ▼             │      │
┌──┐ ┌──────────────┐│      │
│OK│ │Return 403    ││      │
│  │ │Forbidden     ││      │
└─▼┘ └──────────────┘│      │
  │                  │      │
  ▼                  │      │
 Process             │      │
 Request             │      │
                     │      │
                     └──────┘
```

---

## Database Relationships

```
┌──────────────────────────────────────────────────────────────────┐
│                    Users (Central)                                │
│                                                                   │
│  _id, name, phone, password, role, assignedSites[], lastLogin    │
│                    │                                             │
│        ┌───────────┼───────────┬──────────────┐                │
│        │           │           │              │                │
│        ▼           ▼           ▼              ▼                │
│    ┌─────────┐ ┌────────┐ ┌───────────┐ ┌──────────────┐     │
│    │  Sites  │ │Attend. │ │ Progress  │ │DriverActvty  │     │
│    │(owned)  │ │(user)  │ │(uploaded) │ │(driver)      │     │
│    └─────────┘ └────────┘ └───────────┘ └──────────────┘     │
│        │           │           │              │                │
│        ▼           ▼           ▼              ▼                │
│    ┌──────────────────────────────────────────────────┐       │
│    │  Many Relationships                              │       │
│    │                                                   │       │
│    │  User.role determines what operations allowed   │       │
│    │  Site.assignedWorkers references multiple Users │       │
│    │  Attendance.user references attending User      │       │
│    │  Progress.uploadedBy references User            │       │
│    │  DriverActivity.driver references Driver User   │       │
│    └──────────────────────────────────────────────────┘       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## API Request/Response Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Request                              │
│                                                              │
│  POST /api/attendance/check-in                             │
│  Authorization: Bearer <token>                             │
│  Content-Type: multipart/form-data                         │
│  Body: { file, siteId, latitude, longitude }               │
│                                                              │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│              Express Middleware Chain                       │
│                                                             │
│  1. CORS Middleware        → Allow cross-origin           │
│  2. Body Parser            → Parse request                │
│  3. Multer (uploadSingle)  → Handle file                  │
│  4. Authentication         → Verify JWT                   │
│  5. Validation             → Validate input               │
│                                                             │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│          Route Handler & Controller                         │
│                                                             │
│  attendanceController.checkIn(req, res, next)            │
│  │                                                         │
│  ├─ Validate file size and type                          │
│  ├─ Get site details from database                       │
│  ├─ Verify worker is assigned to site                    │
│  ├─ Calculate geofence distance                          │
│  ├─ Save file to storage                                 │
│  ├─ Create Attendance record                             │
│  ├─ Populate references                                  │
│  └─ Return response                                       │
│                                                             │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│          Response                                          │
│                                                             │
│  Status: 201 Created                                       │
│  Content-Type: application/json                            │
│                                                             │
│  {                                                          │
│    "success": true,                                        │
│    "message": "Check-in successful",                       │
│    "data": {                                               │
│      "attendance": { ... },                                │
│      "geofence": {                                         │
│        "isInside": true,                                   │
│        "distance": 45,                                     │
│        "radius": 150                                       │
│      }                                                     │
│    }                                                       │
│  }                                                          │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Geofence Validation Algorithm (Haversine Formula)

```
Input:  Site: (lat1, lon1, radius)
        Worker: (lat2, lon2)

Steps:
1. Convert degrees to radians
   lat1_rad = lat1 * π / 180
   lon1_rad = lon1 * π / 180
   lat2_rad = lat2 * π / 180
   lon2_rad = lon2 * π / 180

2. Calculate differences
   Δlat = lat2_rad - lat1_rad
   Δlon = lon2_rad - lon1_rad

3. Apply Haversine formula
   a = sin²(Δlat/2) + cos(lat1_rad) × cos(lat2_rad) × sin²(Δlon/2)
   c = 2 × asin(√a)
   distance = R × c    (R = Earth radius ≈ 6371 km)

4. Convert to meters
   distance_m = distance × 1000

5. Compare with radius
   if distance_m ≤ radius:
      status = "INSIDE"
   else:
      status = "OUTSIDE"

Output: {
  isInside: boolean,
  distance: number (meters),
  status: "INSIDE" | "OUTSIDE"
}
```

---

## Module Responsibilities

### Authentication Module
- User registration and login
- JWT token generation and verification
- Password hashing and comparison
- Role-based access control
- Token expiration management

### Site Management Module
- Create, read, update, delete sites
- Assign and remove workers
- Manage site status
- Store geofence coordinates and radius

### Attendance Module
- Check-in and check-out functionality
- Selfie photo capture and storage
- GPS coordinate validation
- Geofence validation
- Attendance record persistence
- Daily summary reports

### Progress Monitoring Module
- Photo upload and storage
- Progress notes recording
- Progress percentage tracking
- Approval workflow
- Timeline visualization

### Driver Activity Module
- Start/end duty management
- Meter reading recording
- Vehicle photo capture
- Distance calculation
- Activity history and statistics

### Reports Module
- Daily attendance reports
- Site progress reports
- Driver activity reports
- Comprehensive analytics
- Export functionality

---

## Scalability Considerations

### Current Architecture (Single Node)
- Supports: 20-100 users
- Response time: < 200ms
- Throughput: 100+ req/s
- Database: Single instance

### Phase 2: Horizontal Scaling
- Multiple Node instances
- Load balancer (nginx)
- MongoDB replication
- Redis caching
- AWS S3 storage

### Phase 3: Vertical Scaling
- Increased server resources
- Database optimization
- Query caching
- Async processing

---

## Security Layers

```
┌──────────────────────────────────────┐
│  Layer 1: Transport Security         │
│  - HTTPS/TLS                         │
│  - Certificate validation            │
└──────────────────────────────────────┘
                 │
┌────────────────▼──────────────────────┐
│  Layer 2: API Security               │
│  - CORS validation                   │
│  - Rate limiting                     │
│  - Request validation                │
└────────────────┬──────────────────────┘
                 │
┌────────────────▼──────────────────────┐
│  Layer 3: Authentication             │
│  - JWT token verification            │
│  - Token expiration check            │
│  - User validation                   │
└────────────────┬──────────────────────┘
                 │
┌────────────────▼──────────────────────┐
│  Layer 4: Authorization              │
│  - Role-based access control         │
│  - Resource ownership check          │
│  - Permission validation             │
└────────────────┬──────────────────────┘
                 │
┌────────────────▼──────────────────────┐
│  Layer 5: Data Security              │
│  - Password hashing (bcrypt)         │
│  - Input sanitization                │
│  - NoSQL injection prevention        │
│  - Output encoding                   │
└────────────────┬──────────────────────┘
                 │
┌────────────────▼──────────────────────┐
│  Layer 6: Application Security       │
│  - Error handling                    │
│  - Logging and monitoring            │
│  - Vulnerability scanning            │
│  - Dependency management             │
└──────────────────────────────────────┘
```

---

## Deployment Architecture

```
                ┌──────────────┐
                │   Internet   │
                └──────┬───────┘
                       │
            ┌──────────▼──────────┐
            │  DNS / Load Balancer │
            │  (yourdomain.com)    │
            └──────────┬───────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ Node #1 │  │ Node #2 │  │ Node #3 │
    │:5000    │  │:5001    │  │:5002    │
    └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │
         └────────────┼────────────┘
                      │
         ┌────────────▼────────────┐
         │   Nginx Reverse Proxy   │
         │   (Port 80/443)         │
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │  MongoDB Cluster        │
         │  (Primary + Replicas)   │
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │  S3 Storage / CDN       │
         │  (File Storage)         │
         └────────────────────────┘
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: January 15, 2025  
**Status**: Production Ready
