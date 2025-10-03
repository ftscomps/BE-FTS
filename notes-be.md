# 📝 Backend API Requirements for FTS Frontend Integration

## 🔍 Current Issues Found

### ❌ **Response Format Issues**

**Problem**: Backend API responses tidak konsisten dengan format yang diharapkan frontend.

**Current Issue**:

- `GET /api/v1/projects` returns data yang tidak berupa array
- Frontend expects: `{ success: true, data: [...] }`
- Backend might return: `{ data: [...] }` or direct array `[]`

## 🛠️ **Required Backend Endpoints**

### **1. Authentication Endpoints** ✅ (Working)

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@fts.biz.id",
  "password": "adminmas123"
}

Expected Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@fts.biz.id",
      "name": "Admin FTS",
      "role": "super_admin",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

```http
GET /api/v1/auth/profile
Authorization: Bearer {accessToken}

Expected Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@fts.biz.id",
    "name": "Admin FTS",
    "role": "super_admin",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### **2. Projects Endpoints** ⚠️ (Needs Fix)

```http
GET /api/v1/projects
Authorization: Bearer {accessToken}

Expected Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Project Title",
      "description": "Project description",
      "tags": ["tag1", "tag2"],
      "imageUrl": "https://cloudinary-url.com/image.jpg",
      "liveUrl": "https://project-demo.com",
      "githubUrl": "https://github.com/user/repo",
      "createdBy": "user_uuid",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

```http
POST /api/v1/projects
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "New Project",
  "description": "Project description",
  "tags": ["tag1", "tag2"],
  "imageUrl": "https://cloudinary-url.com/image.jpg",
  "liveUrl": "https://project-demo.com",
  "githubUrl": "https://github.com/user/repo"
}

Expected Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "New Project",
    "description": "Project description",
    "tags": ["tag1", "tag2"],
    "imageUrl": "https://cloudinary-url.com/image.jpg",
    "liveUrl": "https://project-demo.com",
    "githubUrl": "https://github.com/user/repo",
    "createdBy": "user_uuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

```http
PUT /api/v1/projects/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Updated Project",
  "description": "Updated description",
  "tags": ["tag1", "tag2"],
  "imageUrl": "https://cloudinary-url.com/image.jpg",
  "liveUrl": "https://project-demo.com",
  "githubUrl": "https://github.com/user/repo"
}

Expected Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated Project",
    "description": "Updated description",
    "tags": ["tag1", "tag2"],
    "imageUrl": "https://cloudinary-url.com/image.jpg",
    "liveUrl": "https://project-demo.com",
    "githubUrl": "https://github.com/user/repo",
    "createdBy": "user_uuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

```http
DELETE /api/v1/projects/{id}
Authorization: Bearer {accessToken}

Expected Response:
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### **3. File Upload Endpoints** ⚠️ (Needs Implementation)

```http
POST /api/v1/upload/single
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

FormData:
- image: [file]

Expected Response:
{
  "success": true,
  "data": {
    "url": "https://cloudinary-url.com/image.jpg",
    "filename": "image_filename.jpg"
  }
}
```

```http
POST /api/v1/upload/multiple
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

FormData:
- images: [file1, file2, ...]

Expected Response:
{
  "success": true,
  "data": [
    {
      "url": "https://cloudinary-url.com/image1.jpg",
      "filename": "image1_filename.jpg"
    },
    {
      "url": "https://cloudinary-url.com/image2.jpg",
      "filename": "image2_filename.jpg"
    }
  ]
}
```

### **4. Admin Endpoints** ⚠️ (Needs Implementation)

```http
GET /api/v1/admin/users
Authorization: Bearer {accessToken}

Expected Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "admin@fts.biz.id",
      "name": "Admin FTS",
      "role": "super_admin",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "lastLoginAt": "2024-01-15T09:00:00Z",
      "isActive": true
    }
  ]
}
```

```http
POST /api/v1/admin/users
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "New User",
  "email": "user@fts.biz.id",
  "password": "password123",
  "role": "admin"
}

Expected Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@fts.biz.id",
    "name": "New User",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "isActive": true
  }
}
```

```http
PUT /api/v1/admin/users/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Updated User",
  "email": "user@fts.biz.id",
  "role": "admin"
}

Expected Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@fts.biz.id",
    "name": "Updated User",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "isActive": true
  }
}
```

```http
DELETE /api/v1/admin/users/{id}
Authorization: Bearer {accessToken}

Expected Response:
{
  "success": true,
  "message": "User deleted successfully"
}
```

```http
GET /api/v1/admin/logs
Authorization: Bearer {accessToken}

Expected Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user_uuid",
      "userName": "Admin FTS",
      "userEmail": "admin@fts.biz.id",
      "action": "CREATE",
      "resourceType": "project",
      "resourceId": "project_uuid",
      "resourceName": "Project Name",
      "details": { "title": "Project Name" },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

```http
GET /api/v1/admin/stats
Authorization: Bearer {accessToken}

Expected Response:
{
  "success": true,
  "data": {
    "totalProjects": 10,
    "totalUsers": 5,
    "totalTags": 25,
    "recentProjects": 3,
    "recentActivity": 15
  }
}
```

## 🔧 **Critical Backend Fixes Needed**

### **1. Response Format Standardization**

**Issue**: Backend responses tidak konsisten

**Solution**: Standardize semua responses ke format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### **2. Projects Endpoint Fix**

**Current Issue**: `GET /api/v1/projects` tidak 返回 array yang diharapkan

**Required Fix**: Pastikan response berupa:

```json
{
	"success": true,
	"data": [
		{
			"id": "uuid",
			"title": "Project Title",
			"description": "Project description",
			"tags": ["tag1", "tag2"],
			"imageUrl": "https://cloudinary-url.com/image.jpg",
			"liveUrl": "https://project-demo.com",
			"githubUrl": "https://github.com/user/repo",
			"createdBy": "user_uuid",
			"createdAt": "2024-01-01T00:00:00Z",
			"updatedAt": "2024-01-01T00:00:00Z"
		}
	]
}
```

### **3. Missing Endpoints Implementation**

**Priority Order**:

1. **File Upload** - `/api/v1/upload/single` dan `/api/v1/upload/multiple`
2. **Admin Users** - `/api/v1/admin/users` CRUD operations
3. **Activity Logs** - `/api/v1/admin/logs`
4. **Dashboard Stats** - `/api/v1/admin/stats`

## 🧪 **Testing Endpoints**

### **Quick Test Commands**

```bash
# Test login
curl -X POST https://be-fts-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fts.biz.id", "password": "adminmas123"}'

# Test projects (dengan token dari login)
curl -X GET https://be-fts-production.up.railway.app/api/v1/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📋 **Implementation Checklist**

### **Backend Team Tasks**

- [ ] **Fix Projects Response Format**: Pastikan `GET /api/v1/projects`返回 array yang benar
- [ ] **Implement File Upload**: `/api/v1/upload/single` dan `/api/v1/upload/multiple`
- [ ] **Implement Admin Users**: `/api/v1/admin/users` CRUD
- [ ] **Implement Activity Logs**: `/api/v1/admin/logs`
- [ ] **Implement Dashboard Stats**: `/api/v1/admin/stats`
- [ ] **Standardize Response Format**: Semua endpoints gunakan format yang konsisten

### **Frontend Status**

- [x] Authentication system working
- [x] Dashboard with client-side stats calculation
- [x] Error handling for missing endpoints
- [x] Robust API response handling
- [x] Loading states and user feedback

## 🚀 **Deployment Notes**

### **Environment Variables**

```bash
# Backend (.env)
DATABASE_URL="postgresql://username:password@host:5432/database"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_FOLDER="projects"
NODE_ENV=production
PORT=3000
```

### **Frontend Configuration**

```bash
# Frontend (.env.production)
VITE_API_BASE_URL=https://be-fts-production.up.railway.app/api/v1
```

---

## 📞 **Contact & Support**

**Backend URL**: https://be-fts-production.up.railway.app  
**Health Check**: https://be-fts-production.up.railway.app/health  
**Admin Login**: admin@fts.biz.id / adminmas123

**Priority**: Fix projects response format first, then implement missing endpoints in priority order.

---

🎯 **Goal**: Frontend integration yang smooth dan fully functional dengan backend yang robust!
