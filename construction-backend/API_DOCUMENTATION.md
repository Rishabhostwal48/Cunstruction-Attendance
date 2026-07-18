# Construction Workforce Proof-of-Presence Platform - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "password": "SecurePass123",
  "role": "LABOR"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "LABOR",
      "createdAt": "2025-01-15T10:30:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 2. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "phone": "+1234567890",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

### 3. Get Current Profile
**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "LABOR",
      "assignedSites": ["site_id_1", "site_id_2"],
      "lastLogin": "2025-01-15T10:30:00Z"
    }
  }
}
```

### 4. Update Profile
**PUT** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "profilePhoto": "/uploads/photo.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { "user": { ... } }
}
```

### 5. Change Password
**POST** `/auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 6. List All Users (Owner Only)
**GET** `/auth/users?role=LABOR&isActive=true&page=1&limit=10`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved",
  "data": {
    "users": [ ... ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

---

## Site Management Endpoints

### 1. Create Site (Owner Only)
**POST** `/sites`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Downtown Construction",
  "address": "123 Main St, City, State",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 150,
  "description": "Main construction site",
  "projectCode": "PROJ001"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Site created successfully",
  "data": {
    "site": {
      "_id": "site_id",
      "name": "Downtown Construction",
      "address": "123 Main St, City, State",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "radius": 150,
      "owner": "owner_id",
      "assignedWorkers": [],
      "status": "ACTIVE",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  }
}
```

### 2. Get All Sites
**GET** `/sites?status=ACTIVE&page=1&limit=10`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Sites retrieved",
  "data": {
    "sites": [ ... ],
    "pagination": { ... }
  }
}
```

### 3. Get Site by ID
**GET** `/sites/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Site retrieved",
  "data": { "site": { ... } }
}
```

### 4. Update Site (Owner Only)
**PUT** `/sites/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Site Name",
  "radius": 200,
  "status": "INACTIVE"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Site updated successfully",
  "data": { "site": { ... } }
}
```

### 5. Delete Site (Owner Only)
**DELETE** `/sites/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Site deleted successfully"
}
```

### 6. Assign Worker to Site (Owner Only)
**POST** `/sites/:id/assign-worker`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "userId": "worker_user_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Worker assigned successfully",
  "data": { "site": { ... } }
}
```

### 7. Remove Worker from Site (Owner Only)
**POST** `/sites/:id/remove-worker`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "userId": "worker_user_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Worker removed successfully",
  "data": { "site": { ... } }
}
```

---

## Attendance Endpoints

### 1. Check In
**POST** `/attendance/check-in`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**
- `file`: Selfie image (required)
- `siteId`: Site ID (required)
- `latitude`: Worker's latitude (required)
- `longitude`: Worker's longitude (required)

**Response (201):**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "attendance": {
      "_id": "attendance_id",
      "user": { "name": "John", "phone": "+1234567890", "role": "LABOR" },
      "site": { "name": "Downtown Construction", "address": "123 Main St" },
      "type": "CHECKIN",
      "photo": "/uploads/attendance/photo.jpg",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2025-01-15T10:30:00Z",
      "geofenceStatus": "INSIDE",
      "distance": 45
    },
    "geofence": {
      "isInside": true,
      "distance": 45,
      "radius": 150
    }
  }
}
```

### 2. Check Out
**POST** `/attendance/check-out`

**Headers:** Same as Check In

**Request Body (Form Data):**
- `file`: Selfie image (required)
- `latitude`: Worker's latitude (required)
- `longitude`: Worker's longitude (required)

**Response (201):** Same structure as Check In

### 3. Get Attendance Records
**GET** `/attendance?userId=user_id&siteId=site_id&type=CHECKIN&fromDate=2025-01-01&toDate=2025-01-31&page=1&limit=10`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Attendance records retrieved",
  "data": [ ... ],
  "pagination": { ... }
}
```

### 4. Get Daily Attendance Summary
**GET** `/attendance/summary/daily?date=2025-01-15`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Daily attendance summary retrieved",
  "data": {
    "date": "Mon Jan 15 2025",
    "checkIns": 2,
    "checkOuts": 1,
    "hoursWorked": 5.5,
    "records": [ ... ]
  }
}
```

### 5. Get Attendance Statistics (Owner Only)
**GET** `/attendance/stats?fromDate=2025-01-01&toDate=2025-01-31`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Attendance statistics retrieved",
  "data": {
    "stats": [
      {
        "_id": "user_id",
        "totalCheckIns": 20,
        "totalCheckOuts": 18,
        "insideGeofence": 35,
        "outsideGeofence": 3,
        "user": [ ... ]
      }
    ]
  }
}
```

---

## Progress Monitoring Endpoints

### 1. Upload Progress
**POST** `/progress`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**
- `files`: Progress photos (optional, multiple)
- `siteId`: Site ID (required)
- `note`: Work note (required)
- `workDescription`: Detailed work description (optional)
- `progressPercentage`: Progress percentage 0-100 (optional)

**Response (201):**
```json
{
  "success": true,
  "message": "Progress uploaded successfully",
  "data": {
    "progress": {
      "_id": "progress_id",
      "site": { "name": "Downtown Construction" },
      "uploadedBy": { "name": "Supervisor", "phone": "+1234567890", "role": "SUPERVISOR" },
      "images": [
        {
          "filename": "photo.jpg",
          "url": "/uploads/progress/photo.jpg",
          "uploadedAt": "2025-01-15T10:30:00Z"
        }
      ],
      "note": "Foundation work completed",
      "progressPercentage": 25,
      "status": "PENDING",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  }
}
```

### 2. Get Progress Records
**GET** `/progress?siteId=site_id&uploadedBy=user_id&status=APPROVED&page=1&limit=10`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Progress records retrieved",
  "data": [ ... ],
  "pagination": { ... }
}
```

### 3. Approve Progress (Owner/Supervisor Only)
**PUT** `/progress/:id/approve`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "approvalNotes": "Good work, approved"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Progress approved successfully",
  "data": { "progress": { ... } }
}
```

### 4. Reject Progress (Owner/Supervisor Only)
**PUT** `/progress/:id/reject`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "approvalNotes": "Needs revision - quality issues"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Progress rejected",
  "data": { "progress": { ... } }
}
```

### 5. Get Site Timeline
**GET** `/progress/site/:siteId/timeline?page=1&limit=20`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Site timeline retrieved",
  "data": [ ... ],
  "pagination": { ... }
}
```

### 6. Get Site Progress Statistics
**GET** `/progress/site/:siteId/stats`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Progress statistics retrieved",
  "data": {
    "totalUpdates": 15,
    "averageProgress": 45.5,
    "statusBreakdown": [
      {
        "_id": "APPROVED",
        "count": 10,
        "avgProgressPercentage": 50
      },
      {
        "_id": "PENDING",
        "count": 5,
        "avgProgressPercentage": 35
      }
    ]
  }
}
```

---

## Driver Activity Endpoints

### 1. Start Duty
**POST** `/driver-activities/start-duty`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**
- `file`: Vehicle photo (required)
- `vehicleNumber`: Vehicle registration number (required)
- `startMeter`: Starting meter reading (required)

**Response (201):**
```json
{
  "success": true,
  "message": "Duty started successfully",
  "data": {
    "activity": {
      "_id": "activity_id",
      "driver": { "name": "Driver Name", "phone": "+1234567890" },
      "vehicleNumber": "ABC-1234",
      "startTime": "2025-01-15T08:00:00Z",
      "startMeter": 50000,
      "startPhoto": {
        "filename": "vehicle.jpg",
        "url": "/uploads/driver-activity/vehicle.jpg",
        "uploadedAt": "2025-01-15T08:00:00Z"
      },
      "status": "ACTIVE"
    }
  }
}
```

### 2. End Duty
**POST** `/driver-activities/end-duty`

**Headers:** Same as Start Duty

**Request Body (Form Data):**
- `file`: Vehicle photo (required)
- `endMeter`: Ending meter reading (required)

**Response (200):**
```json
{
  "success": true,
  "message": "Duty ended successfully",
  "data": {
    "activity": {
      "_id": "activity_id",
      "driver": { ... },
      "vehicleNumber": "ABC-1234",
      "startTime": "2025-01-15T08:00:00Z",
      "endTime": "2025-01-15T17:00:00Z",
      "startMeter": 50000,
      "endMeter": 50120,
      "distanceTravelled": 120,
      "endPhoto": { ... },
      "status": "COMPLETED"
    }
  }
}
```

### 3. Get Driver Activities
**GET** `/driver-activities?driverId=user_id&vehicleNumber=ABC&status=COMPLETED&fromDate=2025-01-01&toDate=2025-01-31&page=1&limit=10`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Driver activities retrieved",
  "data": [ ... ],
  "pagination": { ... }
}
```

### 4. Get Daily Summary
**GET** `/driver-activities/summary/daily?date=2025-01-15`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Daily summary retrieved",
  "data": {
    "date": "Mon Jan 15 2025",
    "totalActivities": 3,
    "totalDistance": 320,
    "totalDutyHours": 8.5,
    "activities": [ ... ]
  }
}
```

### 5. Get Driver Statistics (Owner Only)
**GET** `/driver-activities/stats?fromDate=2025-01-01&toDate=2025-01-31`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Driver statistics retrieved",
  "data": {
    "stats": [
      {
        "_id": "driver_user_id",
        "totalTrips": 25,
        "totalDistance": 5000,
        "avgDistance": 200,
        "driver": [ ... ]
      }
    ]
  }
}
```

### 6. Cancel Activity
**POST** `/driver-activities/:id/cancel`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "notes": "Emergency cancellation"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Activity cancelled",
  "data": { "activity": { ... } }
}
```

---

## Reports Endpoints

### 1. Daily Attendance Report
**GET** `/reports/attendance/daily?siteId=site_id&date=2025-01-15`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Daily attendance report",
  "data": {
    "date": "Mon Jan 15 2025",
    "site": { "_id": "site_id", "name": "Downtown Construction" },
    "totalWorkers": 5,
    "report": [
      {
        "worker": { "name": "John Doe", "phone": "+1234567890" },
        "checkInTime": "08:00:00",
        "checkOutTime": "17:00:00",
        "hoursWorked": 8.5,
        "geofenceViolations": 0
      }
    ]
  }
}
```

### 2. Site Progress Report
**GET** `/reports/progress/site?siteId=site_id&fromDate=2025-01-01&toDate=2025-01-31`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Site progress report",
  "data": {
    "site": { "_id": "site_id", "name": "Downtown Construction" },
    "statistics": {
      "total": 20,
      "approved": 15,
      "rejected": 2,
      "pending": 3,
      "avgProgressPercentage": 55
    },
    "updates": [ ... ]
  }
}
```

### 3. Driver Activity Report
**GET** `/reports/driver-activities?driverId=user_id&vehicleNumber=ABC&fromDate=2025-01-01&toDate=2025-01-31`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Driver activity report",
  "data": {
    "summary": {
      "totalTrips": 25,
      "totalDistance": 5000,
      "avgDistancePerTrip": 200
    },
    "byVehicle": {
      "ABC-1234": {
        "vehicle": "ABC-1234",
        "trips": 15,
        "totalDistance": 3000,
        "activities": [ ... ]
      }
    },
    "activities": [ ... ]
  }
}
```

### 4. Comprehensive Site Report
**GET** `/reports/site/comprehensive?siteId=site_id&fromDate=2025-01-01&toDate=2025-01-31`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Comprehensive site report",
  "data": {
    "site": {
      "id": "site_id",
      "name": "Downtown Construction",
      "address": "123 Main St",
      "owner": { ... },
      "totalAssignedWorkers": 10
    },
    "period": {
      "from": "2025-01-01",
      "to": "2025-01-31"
    },
    "attendance": {
      "total": 250,
      "checkIns": 125,
      "checkOuts": 125,
      "uniqueWorkers": 10,
      "geofenceViolations": 5
    },
    "progress": {
      "total": 20,
      "approved": 15,
      "rejected": 2,
      "pending": 3
    }
  }
}
```

### 5. Export Report
**GET** `/reports/export/:reportType?siteId=site_id&date=2025-01-15`

**Parameters:**
- `reportType`: `attendance`, `progress`, `driver-activities`

**Response:** JSON file download

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Invalid phone format" }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "statusCode": 403,
  "message": "This action requires one of these roles: OWNER"
}
```

### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Site not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal Server Error"
}
```

---

## Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Filtering
- `status`: Filter by status
- `role`: Filter by user role
- `isActive`: Filter by active status (true/false)
- `fromDate`: Start date (ISO format)
- `toDate`: End date (ISO format)

### Sorting
- `sort`: Sort field (e.g., `createdAt`, `-timestamp`)

---

## File Upload

### Allowed File Types
- JPG
- JPEG
- PNG
- GIF

### Maximum File Size
- 5MB per file

### Upload Structure
Files are stored in `/src/uploads/` with subfolders:
- `/attendance` - Attendance selfies
- `/progress` - Progress photos
- `/driver-activity` - Vehicle photos

---

## Development Roadmap

### Phase 1 (Current) - Core Implementation
- ✓ Authentication & authorization
- ✓ Site management
- ✓ Attendance tracking with geofence validation
- ✓ Progress monitoring
- ✓ Driver activities
- ✓ Reports generation

### Phase 2 - Enhancements
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Real-time location tracking
- [ ] Advanced analytics dashboard
- [ ] Audit logging
- [ ] Mobile app integration

### Phase 3 - Scaling
- [ ] AWS S3 integration for file storage
- [ ] Caching layer (Redis)
- [ ] Search optimization
- [ ] Database sharding

### Phase 4 - Enterprise
- [ ] Multi-site project management
- [ ] Team collaboration tools
- [ ] Advanced reporting
- [ ] API rate limiting
- [ ] Data encryption
