# 🤖 FTS Backend AI Agent Responsibilities

## 🎯 AGENT OVERVIEW

**Nama**: FTS Backend Development Agent  
**Role**: Professional Backend Developer  
**Spesialisasi**: Node.js + TypeScript RESTful API Development  
**Tujuan**: Membangun backend system yang robust, secure, dan maintainable untuk Fujiyama Technology Solutions Company Profile
**Database**: PostgreSQL Railway (sudah setup)
**Storage**: Cloudinary untuk image storage
**Default Admin**: admin@fts.biz.id / adminmas123

## 📋 CORE RESPONSIBILITIES

### **1. Project Setup & Configuration**

- Membuat initial Node.js project structure sesuai `proc.md`
- Mengkonfigurasi TypeScript dengan proper compiler options
- Setup Express.js server dengan basic middleware
- Menginstall dan mengkonfigurasi semua dependencies dari tech stack
- Membuat environment configuration dengan proper validation

### **2. Database Implementation**

- Menulis Prisma schema sesuai database design di `proc.md`
- Membuat database migrations untuk semua tables
- Implementasi database seeding untuk initial data
- Setup database connection dan error handling
- Membuat database indexes untuk performance optimization

### **3. Authentication System**

- Implementasi JWT-based authentication system
- Membuat user registration dan login endpoints
- Setup password hashing dengan bcrypt
- Implementasi token refresh mechanism
- Membuat authentication middleware untuk protected routes

### **4. API Development**

- Membuat semua RESTful API endpoints sesuai `proc.md`
- Implementasi proper HTTP status codes dan response formats
- Setup request validation dengan Zod schemas
- Membuat error handling middleware yang consistent
- Implementasi rate limiting untuk security

### **5. File Upload System**

- Setup multer untuk file upload handling
- Implementasi image processing dengan Sharp
- Membuat file validation (type, size, dimensions)
- Setup file storage system (Cloudinary dengan folder organization)
- Membuat file serving endpoints

### **6. Project Management Features**

- CRUD operations untuk projects
- Implementasi search dan filtering
- Setup pagination untuk large datasets
- Membuat project image management
- Activity logging untuk audit trails

## 🔧 TECHNICAL IMPLEMENTATION STANDARDS

### **Code Quality Standards**

- Selalu menulis komentar sebelum setiap fungsi (sesuai `.kilocode/rules`)
- Mengikuti clean code principles: readable, maintainable, reusable
- Tidak ada duplikasi code (DRY principle)
- Consistent naming conventions (camelCase untuk variables, PascalCase untuk classes)
- Proper error handling dengan try-catch blocks

### **TypeScript Standards**

- Strict typing untuk semua variables dan functions
- Interface definitions untuk semua data structures
- Proper type annotations untuk API responses
- Generic types untuk reusable functions
- Avoid `any` type kecuali absolutely necessary

### **Security Standards**

- Input validation untuk semua API endpoints
- SQL injection prevention dengan Prisma ORM
- XSS prevention dengan proper sanitization
- Rate limiting untuk prevent brute force attacks
- Secure password hashing dengan bcrypt

### **API Design Standards**

- RESTful design principles
- Consistent response format untuk semua endpoints
- Proper HTTP status codes usage
- Versioning untuk API endpoints
- Comprehensive error messages

## 📁 FILE CREATION RESPONSIBILITIES

### **Must-Create Files (sesuai proc.md)**

```
src/
├── app.ts                    # Express app setup
├── server.ts                 # Server bootstrap
├── controllers/
│   ├── authController.ts     # Auth endpoints
│   ├── projectController.ts  # Project CRUD
│   └── uploadController.ts   # File upload
├── middleware/
│   ├── auth.ts              # JWT middleware
│   ├── validation.ts        # Input validation
│   ├── errorHandler.ts      # Error handling
│   └── rateLimiter.ts       # Rate limiting
├── routes/
│   ├── auth.ts              # Auth routes
│   ├── projects.ts          # Project routes
│   └── upload.ts            # Upload routes
├── services/
│   ├── authService.ts       # Auth business logic
│   ├── projectService.ts    # Project logic
│   └── uploadService.ts     # Upload logic
├── types/
│   ├── auth.ts              # Auth types
│   ├── project.ts           # Project types
│   └── api.ts               # API response types
├── utils/
│   ├── logger.ts            # Winston logger
│   ├── validation.ts        # Validation helpers
│   ├── response.ts          # Response helpers
│   └── constants.ts         # App constants
├── config/
│   ├── database.ts          # Database config (Railway PostgreSQL)
│   └── cloudinary.ts        # Cloud storage config (WAJIB)
└── tests/
    ├── auth.test.ts         # Auth tests
    ├── projects.test.ts     # Project tests
    └── upload.test.ts       # Upload tests
```

### **Configuration Files**

- `package.json` dengan proper dependencies dan scripts
- `tsconfig.json` dengan strict TypeScript configuration
- `.env.example` dengan semua environment variables
- `prisma/schema.prisma` dengan complete database schema
- `jest.config.js` untuk testing configuration

## 🔄 WORKFLOW IMPLEMENTATION

### **Development Workflow**

1. **Setup Phase**: Initialize project, install dependencies, basic configuration
2. **Database Phase**: Setup Prisma, create migrations, seed initial data
3. **Auth Phase**: Implement authentication system dengan JWT
4. **Core API Phase**: Create basic CRUD operations untuk projects
5. **Upload Phase**: Implement file upload system dengan image processing
6. **Testing Phase**: Write unit dan integration tests
7. **Deployment Phase**: Setup Railway deployment configuration

### **Code Review Standards**

- Setiap file harus mengikuti structure dari `proc.md`
- Semua functions harus memiliki komentar sebelum implementasi
- Error handling harus comprehensive dan consistent
- Type safety harus terjaga di seluruh codebase
- Security best practices harus diimplementasikan

### **Testing Responsibilities**

- Unit tests untuk semua service functions
- Integration tests untuk API endpoints
- Error scenario testing
- Performance testing untuk file uploads
- Security testing untuk authentication

## 🚀 DEPLOYMENT RESPONSIBILITIES

### **Railway Deployment Setup**

- Membuat `railway.toml` configuration file
- Setup proper start scripts untuk production
- Configure environment variables untuk Railway
- Setup database connection untuk Railway PostgreSQL
- Configure Cloudinary integration
- Implement health check endpoints

### **Production Readiness**

- Error logging yang comprehensive
- Performance monitoring setup
- Security headers configuration
- Rate limiting untuk production
- Proper CORS configuration

## 📊 QUALITY ASSURANCE

### **Code Quality Metrics**

- Minimum 80% test coverage
- Zero TypeScript errors
- ESLint compliance
- Proper error handling coverage
- Security vulnerability scan

### **Performance Standards**

- API response time < 200ms untuk simple endpoints
- File upload processing < 5 seconds
- Database query optimization
- Proper indexing implementation
- Memory usage optimization

## 🛡️ SECURITY IMPLEMENTATION

### **Authentication Security**

- Secure password hashing (bcrypt dengan salt rounds 12)
- JWT token security (proper expiration, refresh mechanism)
- Rate limiting untuk login attempts
- Session management yang proper
- Secure cookie configuration

### **API Security**

- Input validation untuk semua endpoints
- SQL injection prevention
- XSS prevention
- CORS configuration
- Request size limits

### **File Upload Security**

- File type validation
- File size limits
- Malware scanning (jika possible)
- Secure Cloudinary file storage
- Access control untuk uploaded files
- Folder organization untuk project images

## 📝 DOCUMENTATION RESPONSIBILITIES

### **Code Documentation**

- JSDoc comments untuk semua functions
- Type definitions yang clear
- README dengan setup instructions
- API documentation dengan examples
- Deployment guide

### **Technical Documentation**

- Database schema documentation
- API endpoint documentation
- Security implementation details
- Performance optimization notes
- Troubleshooting guide

## 🎯 SUCCESS CRITERIA

### **Functional Requirements**

- ✅ All authentication flows working properly
- ✅ Complete CRUD operations untuk projects
- ✅ File upload system dengan image processing
- ✅ Proper error handling dan logging
- ✅ Security measures implemented

### **Technical Requirements**

- ✅ Type-safe codebase dengan TypeScript
- ✅ 80%+ test coverage
- ✅ Railway deployment successful
- ✅ Performance benchmarks met
- ✅ Security audit passed

### **Quality Requirements**

- ✅ Clean code principles followed
- ✅ No duplicated code
- ✅ Consistent error handling
- ✅ Proper documentation
- ✅ Maintainable architecture

## 🔄 COMMUNICATION PROTOCOL

### **Progress Reporting**

- Update status setiap major milestone
- Report blockers atau issues immediately
- Provide code examples untuk complex implementations
- Suggest improvements atau optimizations
- Ask for clarification ketika requirements tidak clear

### **Problem Solving**

- Analyze issues systematically
- Provide multiple solution options
- Recommend best practices
- Consider security implications
- Think about scalability and maintainability

---

## 📋 AGENT CHECKLIST

### **Before Starting**

- [ ] Baca dan pahami `proc.md` completely
- [ ] Review `.kilocode/rules` untuk compliance
- [ ] Understand project requirements dan constraints
- [ ] Plan implementation approach
- [ ] Prepare development environment

### **During Development**

- [ ] Follow coding standards dari rules
- [ ] Write comments sebelum setiap fungsi
- [ ] Implement proper error handling
- [ ] Maintain type safety
- [ ] Test thoroughly

### **Before Completion**

- [ ] Review code quality
- [ ] Check test coverage
- [ ] Verify security implementation
- [ ] Test deployment readiness
- [ ] Document properly

---

---

## 🎨 FRONTEND INTEGRATION RESPONSIBILITIES

### **Admin Layout Integration**

- Pastikan semua admin pages menggunakan AdminLayout component
- Integrasi sidebar navigation dengan backend routes
- Implementasi proper active state untuk navigation items
- Pastikan responsive design berfungsi di mobile dan desktop

### **Frontend Pages Configuration**

- **Dashboard.tsx**: Main dashboard dengan stats cards dan project list
- **ProjectForm.tsx**: Form untuk add/edit projects dengan file upload
- **ActivityLogs.tsx**: Activity tracking dengan filtering dan export
- **UserManagement.tsx**: User management dengan CRUD operations

### **Frontend Route Structure**

- `/admin` → AdminLayout dengan nested routes
- `/admin/dashboard` → Dashboard page
- `/admin/projects` → Project management
- `/admin/projects/new` → Add new project
- `/admin/projects/edit/:id` → Edit project
- `/admin/users` → User management
- `/admin/activity-logs` → Activity tracking

### **Frontend-Backend Integration Points**

- **Authentication**: JWT token management untuk protected routes
- **Project CRUD**: API integration untuk project operations
- **File Upload**: Backend integration untuk Cloudinary uploads
- **Activity Logging**: Backend integration untuk audit trail
- **User Management**: Backend integration untuk admin user CRUD

### **Frontend Tech Stack Knowledge**

- **React 18**: Hooks, useEffect, useState untuk state management
- **React Router**: Routes, Link, useNavigate untuk navigation
- **Framer Motion**: Animations dan transitions
- **shadcn/ui**: Components untuk forms, buttons, cards
- **Tailwind CSS**: Styling dan responsive design
- **TypeScript**: Type safety untuk API responses

### **API Integration Standards**

- Semua API calls menggunakan proper error handling
- Loading states untuk async operations
- Proper TypeScript types untuk API responses
- Consistent error messages untuk user feedback
- Proper authentication token management

---

## 🚀 FINAL BACKEND DEVELOPMENT READINESS

### **Frontend Integration Status**

- ✅ **AdminLayout Component**: Responsive sidebar navigation dengan 4 mode theme
- ✅ **Admin Pages**: Dashboard, ProjectForm, ActivityLogs, UserManagement
- ✅ **Route Configuration**: Proper routing dengan AdminLayout wrapper
- ✅ **Clean Components**: Tidak ada duplikasi navigasi elements
- ✅ **Type Safety**: Semua TypeScript errors telah diperbaiki
- ✅ **UI Consistency**: Design yang konsisten di seluruh admin interface

### **Backend Development Checklist**

- ✅ **Database Schema**: PostgreSQL dengan Prisma ORM (Railway)
- ✅ **Authentication**: JWT-based authentication dengan default admin account
- ✅ **File Storage**: Cloudinary integration dengan folder organization
- ✅ **API Endpoints**: Complete API structure untuk admin operations
- ✅ **Security**: Rate limiting, input validation, password hashing
- ✅ **Documentation**: Complete documentation di proc.md dan agent.md

### **Default Admin Credentials**

- **Email**: admin@fts.biz.id
- **Password**: adminmas123
- **Role**: super_admin
- **Status**: Active

### **Frontend-Backend Integration Points**

- **Authentication**: `/api/auth/*` endpoints dengan JWT tokens
- **Projects**: `/api/projects/*` endpoints dengan CRUD operations
- **Users**: `/api/admin/users` endpoint untuk user management
- **Activity Logs**: `/api/admin/logs` endpoint untuk audit trail
- **File Upload**: `/api/upload/*` endpoints dengan Cloudinary integration

### **Development Workflow**

1. **Setup Phase**: Initialize Node.js project dengan TypeScript
2. **Database Phase**: Setup Prisma dengan Railway PostgreSQL
3. **Auth Phase**: Implement JWT authentication dengan default admin seeding
4. **Core API Phase**: Create CRUD operations untuk projects dan users
5. **Upload Phase**: Implement file upload dengan Cloudinary integration
6. **Testing Phase**: Unit dan integration tests
7. **Deployment Phase**: Railway deployment dengan proper configuration

### **Environment Configuration**

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
- [ ] Create default admin account seeding (admin@fts.biz.id)
- [ ] Implement project CRUD operations
- [ ] Setup file upload dengan Cloudinary integration
- [ ] Implement activity logging middleware
- [ ] Create user management endpoints
- [ ] Add rate limiting dan security middleware
- [ ] Write unit dan integration tests
- [ ] Configure Railway deployment
- [ ] Test production deployment

### **Priority Implementation Order**

1. **Authentication System** (JWT dengan default admin seeding)
2. **Database Setup** (Prisma dengan Railway PostgreSQL)
3. **Project CRUD** (Core functionality)
4. **File Upload** (Cloudinary integration)
5. **Activity Logging** (Audit trail)
6. **User Management** (Admin user CRUD)
7. **Testing & Deployment** (Quality assurance)

---

**Catatan**: Agent ini dirancang untuk professional backend development dengan focus pada clean architecture, security, dan maintainability. Selalu prioritaskan code quality dan best practices dalam setiap implementasi. Frontend sudah siap untuk backend integration dengan AdminLayout yang konsisten dan responsive. Backend development dapat dimulai dengan mengikuti implementation checklist di atas.
