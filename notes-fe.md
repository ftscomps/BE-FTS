# 📝 FTS Frontend Integration Guide

## 🌐 API Configuration

### Base URL

```
Production: https://be-fts-production.up.railway.app/api/v1
Development: http://localhost:3000/api/v1
```

### Environment Variables

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000/api/v1

# .env.production
VITE_API_BASE_URL=https://be-fts-production.up.railway.app/api/v1
```

## 🔐 Authentication

### Default Admin Account

```
Email: admin@fts.biz.id
Password: adminmas123
```

### Login Endpoint

```javascript
POST /api/auth/login
{
  "email": "admin@fts.biz.id",
  "password": "adminmas123"
}

Response:
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "..." },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Token Usage

```javascript
// Include di header untuk protected routes
headers: {
  "Authorization": `Bearer ${accessToken}`,
  "Content-Type": "application/json"
}
```

## 📊 API Endpoints

### Authentication

```
POST   /api/auth/login        # Login
POST   /api/auth/logout       # Logout
POST   /api/auth/refresh      # Refresh token
GET    /api/auth/profile      # Get user profile
```

### Projects

```
GET    /api/projects          # Get all projects
POST   /api/projects          # Create project
GET    /api/projects/:id      # Get single project
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
```

### File Upload

```
POST   /api/upload/single     # Upload single image
POST   /api/upload/multiple   # Upload multiple images
DELETE /api/upload/:filename  # Delete file
```

### Admin

```
GET    /api/admin/users       # Get all users
GET    /api/admin/logs        # Get activity logs
GET    /api/admin/stats       # Get dashboard stats
```

## 📤 File Upload

### Supported Formats

- JPEG, PNG, WebP
- Max size: 5MB

### Upload Example

```javascript
const formData = new FormData();
formData.append('image', file);

fetch('/api/upload/single', {
	method: 'POST',
	headers: {
		Authorization: `Bearer ${token}`,
	},
	body: formData,
});
```

## 🎨 Frontend Components

### Auth Context Example

```javascript
// context/AuthContext.js
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);

	const login = async (email, password) => {
		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
		});

		const data = await response.json();
		localStorage.setItem('token', data.tokens.accessToken);
		setUser(data.user);
	};

	const logout = () => {
		localStorage.removeItem('token');
		setUser(null);
	};

	return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
```

### API Service Example

```javascript
// services/api.js
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const apiClient = async (endpoint, options = {}) => {
	const token = localStorage.getItem('token');

	const response = await fetch(`${API_BASE}${endpoint}`, {
		headers: {
			'Content-Type': 'application/json',
			...(token && { Authorization: `Bearer ${token}` }),
			...options.headers,
		},
		...options,
	});

	if (!response.ok) {
		throw new Error(`API Error: ${response.status}`);
	}

	return response.json();
};

// Projects API
export const projectsApi = {
	getAll: () => apiClient('/projects'),
	getById: (id) => apiClient(`/projects/${id}`),
	create: (data) => apiClient('/projects', { method: 'POST', body: JSON.stringify(data) }),
	update: (id, data) => apiClient(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
	delete: (id) => apiClient(`/projects/${id}`, { method: 'DELETE' }),
};
```

## 🔧 React Hooks Example

```javascript
// hooks/useProjects.js
import { useState, useEffect } from 'react';
import { projectsApi } from '../services/api';

export const useProjects = () => {
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(false);

	const fetchProjects = async () => {
		setLoading(true);
		try {
			const data = await projectsApi.getAll();
			setProjects(data);
		} catch (error) {
			console.error('Failed to fetch projects:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProjects();
	}, []);

	return { projects, loading, refetch: fetchProjects };
};
```

## 🛡️ Error Handling

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (token expired/invalid)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

### Error Response Format

```javascript
{
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Create .env file
echo "VITE_API_BASE_URL=https://be-fts-production.up.railway.app/api/v1" > .env.production
echo "VITE_API_BASE_URL=http://localhost:3000/api/v1" > .env.development
```

### 2. Install Dependencies

```bash
npm install axios react-router-dom
```

### 3. Basic App Structure

```javascript
// App.jsx
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/projects" element={<Projects />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}
```

## 📱 Responsive Design

### Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Admin Layout

- Sidebar navigation (desktop)
- Mobile menu toggle (mobile)
- Theme integration (4 modes)

## 🐛 Troubleshooting

### Common Issues

1. **CORS Error** - Check backend CORS configuration
2. **401 Unauthorized** - Token expired, need to refresh
3. **404 Not Found** - Wrong endpoint or base URL
4. **Network Error** - Backend not running or wrong URL

### Debug Tips

```javascript
// Add to your API client for debugging
console.log('API Request:', endpoint, options);
console.log('API Response:', response);
```

## 📞 Support

For backend issues:

- Check this documentation first
- Test endpoints with Postman/curl
- Contact backend team for API issues

---

**Backend URL**: https://be-fts-production.up.railway.app  
**Health Check**: https://be-fts-production.up.railway.app/health  
**Admin Login**: admin@fts.biz.id / adminmas123

🎉 Happy coding!
