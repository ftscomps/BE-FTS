# 🚀 FTS Backend Development Process & Requirements

## 📋 PROJECT OVERVIEW

**Project**: Fujiyama Technology Solutions Backend API  
**Purpose**: RESTful API untuk admin dashboard dan project management  
**Deployment**: Railway dengan Node.js + TypeScript
**Database**: PostgreSQL Railway dengan Prisma ORM
**Storage**: Cloudinary untuk image storage
**Default Admin**: admin@fts.biz.id / adminmas123

## 🛠️ TECH STACK & LIBRARIES

### **Core Framework**

- **Node.js 18+** - JavaScript runtime
- **TypeScript 5.x** - Type-safe development
- **Express.js 4.x** - Web framework (standard, tidak over-engineered)
- **Prisma 5.x** - Database ORM
- **PostgreSQL 15+** - Production database

### **Authentication & Security**

- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **helmet** - Security headers
- **cors** - CORS configuration
- **express-rate-limit** - Rate limiting

### **File Upload & Processing**

- **multer** - File upload handling
- **sharp** - Image processing (resize, compress)
- **cloudinary** - Cloud storage (optional, bisa local storage dulu)

### **Validation & Utilities**

- **zod** - Schema validation (sama seperti frontend)
- **dotenv** - Environment variables
- **winston** - Logging
- **nodemon** - Development hot-reload

### **Testing (Basic)**

- **jest** - Unit testing framework
- **supertest** - API testing

## 📁 PROJECT STRUCTURE

```
fts-backend/
├── src/
│   ├── controllers/        # Route handlers
│   │   ├── authController.ts
│   │   ├── projectController.ts
│   │   └── uploadController.ts
│   ├── middleware/         # Custom middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── models/            # Database models (Prisma generated)
│   ├── routes/            # API routes
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   └── upload.ts
│   ├── services/          # Business logic
│   │   ├── authService.ts
│   │   ├── projectService.ts
│   │   └── uploadService.ts
│   ├── types/             # TypeScript types
│   │   ├── auth.ts
│   │   ├── project.ts
│   │   └── api.ts
│   ├── utils/             # Helper functions
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── response.ts
│   ├── config/            # Configuration
│   │   ├── database.ts
│   │   └── cloudinary.ts
│   └── app.ts             # Express app setup
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── uploads/               # Temporary file uploads
├── tests/                 # Test files
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🗄️ DATABASE SCHEMA

### **Core Tables**

```sql
-- Users table untuk authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500),
  live_url VARCHAR(500),
  github_url VARCHAR(500),
  tags TEXT[], -- PostgreSQL array
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Project images untuk multiple images
CREATE TABLE project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs untuk audit trail
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  resource_type VARCHAR(100) NOT NULL, -- project, user, etc.
  resource_id UUID,
  details JSONB, -- Additional details
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 AUTHENTICATION FLOW

### **Login Process**

1. Client POST `/api/auth/login` dengan email & password
2. Server validate input dengan Zod schema
3. Cari user di database, verify password dengan bcrypt
4. Generate JWT access token (15 minutes) + refresh token (7 days)
5. Return tokens ke client
6. Client simpan tokens di httpOnly cookies atau localStorage

### **Token Refresh**

1. Client POST `/api/auth/refresh` dengan refresh token
2. Server validate refresh token
3. Generate new access token
4. Return new access token

### **Protected Routes**

1. Client include JWT token di Authorization header
2. Middleware validate token
3. Extract user info dari token
4. Continue ke controller dengan user context

## 📡 API ENDPOINTS

### **Authentication Routes**

```
POST   /api/auth/register     # Register new admin
POST   /api/auth/login        # User login
POST   /api/auth/logout       # User logout
POST   /api/auth/refresh      # Refresh access token
GET    /api/auth/profile      # Get current user profile
PUT    /api/auth/profile      # Update user profile
```

### **Project Management Routes**

```
GET    /api/projects          # Get all projects (with pagination, search, filters)
POST   /api/projects          # Create new project
GET    /api/projects/:id      # Get single project
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
GET    /api/projects/:id/images # Get project images
POST   /api/projects/:id/images # Add project image
DELETE /api/images/:id        # Delete project image
```

### **File Upload Routes**

```
POST   /api/upload/single     # Upload single image
POST   /api/upload/multiple   # Upload multiple images
DELETE /api/upload/:filename  # Delete uploaded file
GET    /api/upload/:filename  # Get uploaded file (serve)
```

### **Admin Routes**

```
GET    /api/admin/users       # Get all users (super admin only)
GET    /api/admin/logs        # Get activity logs
GET    /api/admin/stats       # Get dashboard statistics
```

## 🔄 DATA FLOW PATTERNS

### **Standard Request Flow**

1. **Request** → **Validation Middleware** → **Auth Middleware** → **Controller** → **Service** → **Database**
2. **Response** ← **Error Handler** ← **Controller** ← **Service** ← **Database**

### **File Upload Flow**

1. Client upload file ke `/api/upload/single`
2. Multer handle file upload ke temporary folder
3. Sharp process image (resize, compress, optimize)
4. Upload ke Cloudinary folder "projects"
5. Save file metadata ke database
6. Return Cloudinary URL ke client

### **Error Handling Flow**

1. Validation errors → 400 dengan detailed error messages
2. Authentication errors → 401 dengan clear message
3. Authorization errors → 403 dengan permission info
4. Not found errors → 404 dengan resource info
5. Server errors → 500 dengan generic message (log details)

## 🛡️ SECURITY IMPLEMENTATION

### **Password Security**

- Minimum 8 characters dengan mix uppercase, lowercase, numbers
- Hash dengan bcrypt (salt rounds: 12)
- Rate limiting untuk login attempts (5 attempts per 15 minutes)

### **JWT Security**

- Access token: 15 minutes expiration
- Refresh token: 7 days expiration
- Token blacklisting untuk logout
- Secure cookie settings untuk production

### **Input Validation**

- All input validated dengan Zod schemas
- SQL injection prevention dengan Prisma ORM
- XSS prevention dengan proper escaping
- File upload validation (type, size, dimensions)

### **CORS & Security Headers**

- CORS configured untuk specific origins
- Helmet.js untuk security headers
- Rate limiting untuk API endpoints
- Request size limits

## 📝 ENVIRONMENT VARIABLES

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fts_db"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp"

# Cloud Storage (WAJIB untuk production)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_FOLDER="projects" # Folder organization di Cloudinary

# CORS
FRONTEND_URL="http://localhost:5173"
ALLOWED_ORIGINS="http://localhost:5173,https://your-domain.com"

# Logging
LOG_LEVEL="info"
LOG_FILE="./logs/app.log"
```

## 🚀 DEPLOYMENT PROCESS

### **Development Setup**

1. Clone repository
2. Copy `.env.example` ke `.env`
3. Install dependencies: `npm install`
4. Setup database: `npx prisma migrate dev`
5. Seed initial data: `npm run seed`
6. Start development: `npm run dev`

### **Production Deployment (Railway)**

1. Push code ke GitHub
2. Connect repository ke Railway
3. Set environment variables di Railway dashboard
4. Railway auto-detect Node.js app
5. Database provisioning dengan Railway PostgreSQL (sudah setup)
6. Configure Cloudinary dengan environment variables
7. Run migrations: `npx prisma migrate deploy`
8. Seed production data: `npm run seed:prod`

### **Database Migrations**

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

## 🧪 TESTING STRATEGY

### **Unit Tests**

- Test service layer functions
- Test validation schemas
- Test utility functions
- Target: 80% code coverage

### **Integration Tests**

- Test API endpoints
- Test authentication flow
- Test file upload process
- Test database operations

### **Test Commands**

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 MONITORING & LOGGING

### **Logging Strategy**

- Structured logging dengan Winston
- Different log levels: error, warn, info, debug
- Log format: JSON untuk production
- Log rotation untuk file logs

### **Monitoring Points**

- API response times
- Error rates dan types
- Database query performance
- File upload success/failure rates
- Authentication events

### **Health Checks**

- `/health` endpoint untuk basic health
- `/health/detailed` endpoint untuk detailed status
- Database connection check
- File system accessibility check

## 🔄 MAINTENANCE & UPDATES

### **Regular Tasks**

- Weekly dependency updates
- Monthly security patches
- Quarterly database optimization
- Annual tech stack review

### **Backup Strategy**

- Daily database backups
- File storage backups
- Configuration backups
- Disaster recovery plan

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Core Setup**

- [ ] Initialize Node.js project dengan TypeScript
- [ ] Setup Express server dengan basic middleware
- [ ] Configure Prisma dengan PostgreSQL
- [ ] Setup basic authentication system
- [ ] Create user registration/login

### **Phase 2: Core Features**

- [ ] Implement project CRUD operations
- [ ] Setup file upload system
- [ ] Create validation schemas
- [ ] Add error handling middleware
- [ ] Implement activity logging

### **Phase 3: Advanced Features**

- [ ] Add image processing dengan Sharp
- [ ] Setup cloud storage integration
- [ ] Implement rate limiting
- [ ] Add comprehensive logging
- [ ] Create admin dashboard endpoints

### **Phase 4: Testing & Deployment**

- [ ] Write unit dan integration tests
- [ ] Setup Railway deployment
- [ ] Configure production environment
- [ ] Setup monitoring dan alerting
- [ ] Documentation completion

---

## 🎨 FRONTEND INTEGRATION

### **Admin Pages Structure**

```
src/pages/admin/
├── Dashboard.tsx          # Main dashboard dengan stats
├── ProjectForm.tsx        # Add/Edit project form
├── ActivityLogs.tsx       # Activity tracking page
└── UserManagement.tsx     # User management page
```

### **Admin Layout Component**

```
src/components/admin/
└── AdminLayout.tsx        # Sidebar navigation dengan:
    - Responsive design (mobile/desktop)
    - Theme integration (4 modes)
    - Navigation items: Dashboard, Projects, Users, Activity Logs
    - Logout functionality
    - Mobile menu toggle
```

### **Frontend Routes**

```
/admin                    # Admin portal root
├── dashboard             # Main dashboard
├── projects              # Project management
├── projects/new          # Add new project
├── projects/edit/:id     # Edit existing project
├── users                 # User management
└── activity-logs         # Activity tracking
```

### **Frontend Features**

- **Responsive Sidebar**: Desktop fixed, mobile overlay
- **Theme Integration**: 4 mode theme (light, dark, system, auto)
- **Navigation Active States**: Visual indication untuk current page
- **Mobile Menu**: Hamburger menu untuk mobile devices
- **Breadcrumb**: Page title di top navigation bar
- **Logout Functionality**: Secure logout dengan redirect ke login

### **Frontend Tech Stack**

- **React 18** dengan hooks dan TypeScript
- **React Router** untuk navigation
- **Framer Motion** untuk animations
- **shadcn/ui** components untuk UI
- **Tailwind CSS** untuk styling
- **next-themes** untuk theme management

---

## 🚀 FINAL BACKEND DEVELOPMENT READINESS

### **Frontend Integration Status**

- ✅ **AdminLayout Component**: Responsive sidebar navigation dengan 4 mode theme
- ✅ **Admin Pages**: Dashboard, ProjectForm, ActivityLogs, UserManagement
- ✅ **Route Configuration**: Proper routing dengan AdminLayout wrapper
- ✅ **Clean Components**: Tidak ada duplikasi navigasi elements
- ✅ **Type Safety**: Semua TypeScript errors telah diperbaiki
- ✅ **UI Consistency**: Design yang konsisten di seluruh admin interface

### **Backend Development Priority**

1. **Authentication System**: JWT dengan default admin account (admin@fts.biz.id)
2. **Database Setup**: Prisma dengan Railway PostgreSQL
3. **Project CRUD**: Core functionality untuk project management
4. **File Upload**: Cloudinary integration dengan folder organization
5. **Activity Logging**: Audit trail untuk system monitoring
6. **User Management**: Admin user CRUD operations
7. **Testing & Deployment**: Quality assurance dan Railway deployment

### **Default Admin Credentials**

- **Email**: admin@fts.biz.id
- **Password**: adminmas123
- **Role**: super_admin
- **Status**: Active

### **Environment Variables Template**

```bash
# Database (Railway PostgreSQL)
DATABASE_URL="postgresql://username:password@host:5432/database"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_FOLDER="projects"

# Server Configuration
NODE_ENV=production
PORT=3000
```

### **Final Implementation Checklist**

- [ ] Initialize Node.js project dengan TypeScript
- [ ] Setup Express server dengan basic middleware
- [ ] Configure Prisma dengan Railway PostgreSQL
- [ ] Implement JWT authentication system
- [ ] Create default admin account seeding
- [ ] Implement project CRUD operations
- [ ] Setup file upload dengan Cloudinary integration
- [ ] Implement activity logging middleware
- [ ] Create user management endpoints
- [ ] Add rate limiting dan security middleware
- [ ] Write unit dan integration tests
- [ ] Configure Railway deployment
- [ ] Test production deployment

### **Quick Start Commands**

```bash
# 1. Initialize project
npm init -y
npm install typescript @types/node express prisma @prisma/client
npm install jsonwebtoken bcryptjs helmet cors express-rate-limit
npm install multer sharp cloudinary zod dotenv winston

# 2. Setup TypeScript
npx tsc --init
npm install --save-dev @types/express @types/jsonwebtoken @types/bcryptjs
npm install --save-dev nodemon jest supertest

# 3. Setup Prisma
npx prisma init
npx prisma schema push

# 4. Create basic structure
mkdir -p src/{controllers,middleware,routes,services,types,utils,config,tests}

# 5. Start development
npm run dev
```

### **Database Schema Summary**

```sql
-- Users table untuk authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500),
  live_url VARCHAR(500),
  github_url VARCHAR(500),
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Project images untuk multiple images
CREATE TABLE project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs untuk audit trail
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

**Note**: Backend ini dirancang untuk robust namun tetap simple dan maintainable. Fokus pada clean architecture, proper error handling, dan security best practices tanpa over-engineering. Frontend sudah siap untuk backend integration dengan AdminLayout yang konsisten dan responsive. Backend development dapat dimulai dengan mengikuti implementation checklist di atas.
