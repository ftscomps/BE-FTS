# 🚀 FTS Backend API

**Fujiyama Technology Solutions Backend API** - RESTful API untuk admin dashboard dan project management system.

## 📋 Project Overview

Project ini adalah backend API untuk mengelola company profile dan project portfolio dari Fujiyama Technology Solutions. Backend ini dibangun dengan Node.js + TypeScript dan menggunakan PostgreSQL sebagai database utama dengan deployment di Railway.

### 🎯 Fitur Utama

- **Authentication System**: JWT-based authentication dengan role-based access control
- **Project Management**: CRUD operations untuk project portfolio
- **File Upload**: Image processing dan storage dengan Cloudinary
- **Activity Logging**: Audit trail untuk monitoring sistem
- **User Management**: Admin user management dengan super admin privileges
- **Security**: Rate limiting, input validation, dan security headers

## 🛠️ Tech Stack

### Core Framework

- **Node.js 18+** - JavaScript runtime
- **TypeScript 5.x** - Type-safe development
- **Express.js 4.x** - Web framework
- **Prisma 5.x** - Database ORM

### Database & Storage

- **PostgreSQL 15+** - Production database (Railway)
- **Cloudinary** - Cloud storage untuk images

### Authentication & Security

- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **helmet** - Security headers
- **cors** - CORS configuration
- **express-rate-limit** - Rate limiting

### File Processing & Validation

- **multer** - File upload handling
- **sharp** - Image processing
- **zod** - Schema validation

### Development & Testing

- **nodemon** - Development hot-reload
- **jest** - Unit testing framework
- **supertest** - API testing
- **winston** - Logging

## 📁 Project Structure

```
fts-backend/
├── src/
│   ├── controllers/        # Route handlers
│   │   ├── authController.ts
│   │   ├── projectController.ts
│   │   ├── uploadController.ts
│   │   ├── userController.ts
│   │   └── activityController.ts
│   ├── middleware/         # Custom middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   ├── activityLogger.ts
│   │   └── requireSuperAdmin.ts
│   ├── routes/            # API routes
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   ├── upload.ts
│   │   ├── users.ts
│   │   └── activity.ts
│   ├── services/          # Business logic
│   │   ├── authService.ts
│   │   ├── projectService.ts
│   │   ├── uploadService.ts
│   │   └── userService.ts
│   ├── types/             # TypeScript types
│   │   ├── auth.ts
│   │   ├── project.ts
│   │   ├── upload.ts
│   │   ├── user.ts
│   │   ├── env.ts
│   │   └── api.ts
│   ├── utils/             # Helper functions
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── response.ts
│   ├── config/            # Configuration
│   │   ├── database.ts
│   │   └── cloudinary.ts
│   ├── tests/             # Test files
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server bootstrap
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts            # Database seeding
├── uploads/               # Temporary file uploads
├── logs/                  # Application logs
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Railway recommended)
- Cloudinary account (for image storage)

### Installation

1. **Clone repository**

```bash
git clone <repository-url>
cd fts-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
```

4. **Configure environment variables**

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

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

# CORS
FRONTEND_URL="http://localhost:5173"
ALLOWED_ORIGINS="http://localhost:5173,https://your-domain.com"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp"

# Logging
LOG_LEVEL="info"
LOG_FILE="./logs/app.log"
```

5. **Setup database**

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed initial data (creates default admin account)
npx prisma db seed
```

6. **Start development server**

```bash
npm run dev
```

## 🔐 Default Admin Account

Setelah seeding database, default admin account akan dibuat:

- **Email**: admin@fts.biz.id
- **Password**: adminmas123
- **Role**: super_admin

## 📡 API Endpoints

### Authentication Routes

```
POST   /api/auth/register     # Register new admin
POST   /api/auth/login        # User login
POST   /api/auth/logout       # User logout
POST   /api/auth/refresh      # Refresh access token
GET    /api/auth/profile      # Get current user profile
PUT    /api/auth/profile      # Update user profile
```

### Project Management Routes

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

### File Upload Routes

```
POST   /api/upload/single     # Upload single image
POST   /api/upload/multiple   # Upload multiple images
DELETE /api/upload/:filename  # Delete uploaded file
GET    /api/upload/:filename  # Get uploaded file (serve)
```

### Admin Routes

```
GET    /api/admin/users       # Get all users (super admin only)
GET    /api/admin/logs        # Get activity logs
GET    /api/admin/stats       # Get dashboard statistics
```

### Activity Routes

```
GET    /api/activity/logs     # Get activity logs with filtering
```

## 🔄 Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Projects Table

```sql
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
```

### Project Images Table

```sql
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
```

### Activity Logs Table

```sql
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

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

- Unit tests untuk service layer functions
- Integration tests untuk API endpoints
- Authentication flow testing
- File upload process testing
- Database operations testing

## 🚀 Deployment

### Railway Deployment

1. **Push code ke GitHub**
2. **Connect repository ke Railway**
3. **Set environment variables di Railway dashboard**
4. **Railway auto-detect Node.js app**
5. **Database provisioning dengan Railway PostgreSQL**
6. **Configure Cloudinary dengan environment variables**
7. **Run migrations**: `npx prisma migrate deploy`
8. **Seed production data**: `npm run seed:prod`

### Environment Variables for Production

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

## 🔧 Frontend Integration

### API Configuration

Frontend harus mengkonfigurasi API base URL sesuai environment:

```javascript
// Environment-based API configuration
const API_CONFIG = {
	development: {
		baseURL: 'http://localhost:3000/api/v1',
		timeout: 10000,
	},
	production: {
		baseURL: 'https://your-app-name.up.railway.app/api/v1',
		timeout: 15000,
	},
};

const config = API_CONFIG[process.env.NODE_ENV || 'development'];
```

### Authentication Flow

1. **Login**: Client POST `/api/auth/login` dengan email & password
2. **Token Management**: Server returns JWT access token (15min) + refresh token (7days)
3. **Token Storage**: Simpan tokens di httpOnly cookies atau localStorage
4. **Protected Routes**: Client includes JWT token di Authorization header
5. **Token Refresh**: Client POST `/api/auth/refresh` dengan refresh token
6. **Auto Logout**: Handle token expiration dengan automatic refresh atau logout

### Authentication Service Example

```javascript
// authService.js
class AuthService {
	constructor() {
		this.baseURL = API_CONFIG[process.env.NODE_ENV].baseURL;
		this.accessToken = localStorage.getItem('accessToken');
		this.refreshToken = localStorage.getItem('refreshToken');
	}

	async login(email, password) {
		try {
			const response = await fetch(`${this.baseURL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				throw new Error('Login failed');
			}

			const data = await response.json();
			this.setTokens(data.tokens);
			return data.user;
		} catch (error) {
			throw error;
		}
	}

	async logout() {
		try {
			await fetch(`${this.baseURL}/auth/logout`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
				},
			});
		} finally {
			this.clearTokens();
		}
	}

	async refreshAccessToken() {
		try {
			const response = await fetch(`${this.baseURL}/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					refreshToken: this.refreshToken,
				}),
			});

			if (!response.ok) {
				this.clearTokens();
				throw new Error('Token refresh failed');
			}

			const data = await response.json();
			this.accessToken = data.accessToken;
			localStorage.setItem('accessToken', this.accessToken);
			return this.accessToken;
		} catch (error) {
			this.clearTokens();
			throw error;
		}
	}

	setTokens(tokens) {
		this.accessToken = tokens.accessToken;
		this.refreshToken = tokens.refreshToken;
		localStorage.setItem('accessToken', this.accessToken);
		localStorage.setItem('refreshToken', this.refreshToken);
	}

	clearTokens() {
		this.accessToken = null;
		this.refreshToken = null;
		localStorage.removeItem('accessToken');
		localStorage.removeItem('refreshToken');
	}

	getAuthHeaders() {
		return {
			Authorization: `Bearer ${this.accessToken}`,
			'Content-Type': 'application/json',
		};
	}
}
```

### Project Management Integration

```javascript
// projectService.js
class ProjectService {
	constructor(authService) {
		this.baseURL = API_CONFIG[process.env.NODE_ENV].baseURL;
		this.authService = authService;
	}

	async getProjects(params = {}) {
		const queryParams = new URLSearchParams(params);
		const response = await fetch(`${this.baseURL}/projects?${queryParams}`, {
			headers: this.authService.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error('Failed to fetch projects');
		}

		return response.json();
	}

	async getProject(id) {
		const response = await fetch(`${this.baseURL}/projects/${id}`, {
			headers: this.authService.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error('Failed to fetch project');
		}

		return response.json();
	}

	async createProject(projectData) {
		const response = await fetch(`${this.baseURL}/projects`, {
			method: 'POST',
			headers: this.authService.getAuthHeaders(),
			body: JSON.stringify(projectData),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to create project');
		}

		return response.json();
	}

	async updateProject(id, projectData) {
		const response = await fetch(`${this.baseURL}/projects/${id}`, {
			method: 'PUT',
			headers: this.authService.getAuthHeaders(),
			body: JSON.stringify(projectData),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to update project');
		}

		return response.json();
	}

	async deleteProject(id) {
		const response = await fetch(`${this.baseURL}/projects/${id}`, {
			method: 'DELETE',
			headers: this.authService.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error('Failed to delete project');
		}

		return true;
	}
}
```

### File Upload Integration

```javascript
// uploadService.js
class UploadService {
	constructor(authService) {
		this.baseURL = API_CONFIG[process.env.NODE_ENV].baseURL;
		this.authService = authService;
	}

	async uploadSingleImage(file) {
		const formData = new FormData();
		formData.append('image', file);

		const response = await fetch(`${this.baseURL}/upload/single`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.authService.accessToken}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Upload failed');
		}

		return response.json();
	}

	async uploadMultipleImages(files) {
		const formData = new FormData();
		files.forEach((file) => {
			formData.append('images', file);
		});

		const response = await fetch(`${this.baseURL}/upload/multiple`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.authService.accessToken}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Upload failed');
		}

		return response.json();
	}

	validateImageFile(file) {
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		const maxSize = 5 * 1024 * 1024; // 5MB

		if (!allowedTypes.includes(file.type)) {
			throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
		}

		if (file.size > maxSize) {
			throw new Error('File size too large. Maximum size is 5MB.');
		}

		return true;
	}
}
```

### Error Handling Best Practices

```javascript
// apiClient.js - Centralized API client with error handling
class ApiClient {
	constructor(authService) {
		this.authService = authService;
		this.baseURL = API_CONFIG[process.env.NODE_ENV].baseURL;
	}

	async request(endpoint, options = {}) {
		const url = `${this.baseURL}${endpoint}`;
		const config = {
			headers: {
				'Content-Type': 'application/json',
				...this.authService.getAuthHeaders(),
			},
			...options,
		};

		try {
			let response = await fetch(url, config);

			// Handle 401 Unauthorized - try refresh token
			if (response.status === 401 && this.authService.refreshToken) {
				await this.authService.refreshAccessToken();
				config.headers = {
					...config.headers,
					...this.authService.getAuthHeaders(),
				};
				response = await fetch(url, config);
			}

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				throw new ApiError(error.error || `HTTP ${response.status}`, response.status);
			}

			return response.json();
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError('Network error occurred', 0);
		}
	}
}

class ApiError extends Error {
	constructor(message, status) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}
```

### React Hook Example

```javascript
// hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [authService] = useState(() => new AuthService());

	useEffect(() => {
		// Check if user is already logged in
		if (authService.accessToken) {
			// Validate token by fetching user profile
			authService
				.getProfile()
				.then((userData) => setUser(userData))
				.catch(() => authService.clearTokens())
				.finally(() => setLoading(false));
		} else {
			setLoading(false);
		}
	}, []);

	const login = async (email, password) => {
		const userData = await authService.login(email, password);
		setUser(userData);
		return userData;
	};

	const logout = async () => {
		await authService.logout();
		setUser(null);
	};

	const value = {
		user,
		login,
		logout,
		loading,
		authService,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
```

## 🛡️ Security Features

- **Password Security**: Bcrypt hashing dengan salt rounds 12
- **JWT Security**: Access token (15min) + refresh token (7days)
- **Rate Limiting**: 5 login attempts per 15 minutes
- **Input Validation**: All input validated dengan Zod schemas
- **CORS Protection**: Configured untuk specific origins
- **Security Headers**: Helmet.js untuk security headers
- **File Upload Security**: File type, size, dan dimension validation

## 📊 Monitoring & Logging

### Logging Strategy

- Structured logging dengan Winston
- Different log levels: error, warn, info, debug
- Log format: JSON untuk production
- Log rotation untuk file logs

### Health Check Endpoints

- `/health` - Basic health check
- `/health/detailed` - Detailed system status

## 🔄 Maintenance

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Backup Strategy

- Daily database backups
- File storage backups
- Configuration backups

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions, please contact:

- **Email**: admin@fts.biz.id
- **Website**: https://fujiyama-technology.com

---

**Built with ❤️ by Fujiyama Technology Solutions**
