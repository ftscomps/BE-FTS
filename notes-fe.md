# 📝 Frontend Integration Notes

## 🔗 Backend-Frontend Connection Guide

Guide lengkap untuk team frontend dalam mengintegrasikan Frontend React dengan Backend API FTS.

## 🌐 API Endpoints Configuration

### Base URL Configuration

Frontend harus mengkonfigurasi API base URL sesuai environment:

```javascript
// config/api.js
export const API_CONFIG = {
	development: {
		baseURL: 'http://localhost:3000/api/v1',
		timeout: 10000,
	},
	staging: {
		baseURL: 'https://fts-staging.up.railway.app/api/v1',
		timeout: 15000,
	},
	production: {
		baseURL: 'https://fts-production.up.railway.app/api/v1',
		timeout: 15000,
	},
};

export const getApiConfig = () => {
	const env = process.env.NODE_ENV || 'development';
	return API_CONFIG[env];
};
```

### Environment Variables

Frontend harus memiliki environment variables berikut:

```bash
# .env.development
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
REACT_APP_FRONTEND_URL=http://localhost:5173

# .env.production
REACT_APP_API_BASE_URL=https://fts-production.up.railway.app/api/v1
REACT_APP_FRONTEND_URL=https://your-frontend-domain.com
```

## 🔐 Authentication Implementation

### 1. Authentication Service

```javascript
// services/authService.js
import { getApiConfig } from '../config/api';

class AuthService {
	constructor() {
		this.baseURL = getApiConfig().baseURL;
		this.accessToken = localStorage.getItem('fts_access_token');
		this.refreshToken = localStorage.getItem('fts_refresh_token');
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
				const error = await response.json();
				throw new Error(error.error || 'Login failed');
			}

			const data = await response.json();
			this.setTokens(data.tokens);
			return data.user;
		} catch (error) {
			console.error('Login error:', error);
			throw error;
		}
	}

	async register(userData) {
		try {
			const response = await fetch(`${this.baseURL}/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(userData),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Registration failed');
			}

			const data = await response.json();
			this.setTokens(data.tokens);
			return data.user;
		} catch (error) {
			console.error('Registration error:', error);
			throw error;
		}
	}

	async logout() {
		try {
			if (this.accessToken) {
				await fetch(`${this.baseURL}/auth/logout`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${this.accessToken}`,
					},
				});
			}
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			this.clearTokens();
		}
	}

	async refreshAccessToken() {
		try {
			if (!this.refreshToken) {
				throw new Error('No refresh token available');
			}

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
				throw new Error('Token refresh failed');
			}

			const data = await response.json();
			this.accessToken = data.accessToken;
			localStorage.setItem('fts_access_token', this.accessToken);
			return this.accessToken;
		} catch (error) {
			console.error('Token refresh error:', error);
			this.clearTokens();
			throw error;
		}
	}

	async getProfile() {
		try {
			const response = await fetch(`${this.baseURL}/auth/profile`, {
				headers: this.getAuthHeaders(),
			});

			if (!response.ok) {
				throw new Error('Failed to get profile');
			}

			return response.json();
		} catch (error) {
			console.error('Get profile error:', error);
			throw error;
		}
	}

	setTokens(tokens) {
		this.accessToken = tokens.accessToken;
		this.refreshToken = tokens.refreshToken;
		localStorage.setItem('fts_access_token', this.accessToken);
		localStorage.setItem('fts_refresh_token', this.refreshToken);
	}

	clearTokens() {
		this.accessToken = null;
		this.refreshToken = null;
		localStorage.removeItem('fts_access_token');
		localStorage.removeItem('fts_refresh_token');
	}

	getAuthHeaders() {
		return {
			Authorization: `Bearer ${this.accessToken}`,
			'Content-Type': 'application/json',
		};
	}

	isAuthenticated() {
		return !!this.accessToken;
	}
}

export default new AuthService();
```

### 2. React Context Provider

```javascript
// context/AuthContext.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const initAuth = async () => {
			try {
				if (authService.isAuthenticated()) {
					const userData = await authService.getProfile();
					setUser(userData);
				}
			} catch (error) {
				console.error('Auth initialization error:', error);
				authService.clearTokens();
			} finally {
				setLoading(false);
			}
		};

		initAuth();
	}, []);

	const login = async (email, password) => {
		setLoading(true);
		try {
			const userData = await authService.login(email, password);
			setUser(userData);
			return userData;
		} catch (error) {
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		setLoading(true);
		try {
			await authService.logout();
			setUser(null);
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			setLoading(false);
		}
	};

	const register = async (userData) => {
		setLoading(true);
		try {
			const newUser = await authService.register(userData);
			setUser(newUser);
			return newUser;
		} catch (error) {
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const value = {
		user,
		login,
		logout,
		register,
		loading,
		isAuthenticated: authService.isAuthenticated(),
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

### 3. Protected Route Component

```javascript
// components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				}}
			>
				<CircularProgress />
			</div>
		);
	}

	return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
```

## 📊 Project Management Integration

### Project Service

```javascript
// services/projectService.js
import { getApiConfig } from '../config/api';

class ProjectService {
	constructor() {
		this.baseURL = getApiConfig().baseURL;
	}

	async getProjects(params = {}) {
		const queryParams = new URLSearchParams(params);
		const response = await fetch(`${this.baseURL}/projects?${queryParams}`, {
			headers: this.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error('Failed to fetch projects');
		}

		return response.json();
	}

	async getProject(id) {
		const response = await fetch(`${this.baseURL}/projects/${id}`, {
			headers: this.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error('Failed to fetch project');
		}

		return response.json();
	}

	async createProject(projectData) {
		const response = await fetch(`${this.baseURL}/projects`, {
			method: 'POST',
			headers: this.getAuthHeaders(),
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
			headers: this.getAuthHeaders(),
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
			headers: this.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error('Failed to delete project');
		}

		return true;
	}

	getAuthHeaders() {
		const token = localStorage.getItem('fts_access_token');
		return {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		};
	}
}

export default new ProjectService();
```

### Project Hooks

```javascript
// hooks/useProjects.js
import { useState, useEffect } from 'react';
import projectService from '../services/projectService';

export const useProjects = (params = {}) => {
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const fetchProjects = async (queryParams = {}) => {
		setLoading(true);
		setError(null);
		try {
			const data = await projectService.getProjects({ ...params, ...queryParams });
			setProjects(data.projects);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProjects(params);
	}, [JSON.stringify(params)]);

	const refetch = () => fetchProjects(params);

	return { projects, loading, error, refetch };
};

export const useProject = (id) => {
	const [project, setProject] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (id) {
			fetchProject(id);
		}
	}, [id]);

	const fetchProject = async (projectId) => {
		setLoading(true);
		setError(null);
		try {
			const data = await projectService.getProject(projectId);
			setProject(data);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return { project, loading, error, refetch: fetchProject };
};
```

## 📤 File Upload Integration

### Upload Service

```javascript
// services/uploadService.js
import { getApiConfig } from '../config/api';

class UploadService {
	constructor() {
		this.baseURL = getApiConfig().baseURL;
	}

	async uploadSingleImage(file) {
		const formData = new FormData();
		formData.append('image', file);

		const response = await fetch(`${this.baseURL}/upload/single`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.getAccessToken()}`,
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
				Authorization: `Bearer ${this.getAccessToken()}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Upload failed');
		}

		return response.json();
	}

	async deleteFile(filename) {
		const response = await fetch(`${this.baseURL}/upload/${filename}`, {
			method: 'DELETE',
			headers: this.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error('Failed to delete file');
		}

		return true;
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

	getAccessToken() {
		return localStorage.getItem('fts_access_token');
	}

	getAuthHeaders() {
		return {
			Authorization: `Bearer ${this.getAccessToken()}`,
		};
	}
}

export default new UploadService();
```

### Upload Hook

```javascript
// hooks/useUpload.js
import { useState } from 'react';
import uploadService from '../services/uploadService';

export const useUpload = () => {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState(null);
	const [progress, setProgress] = useState(0);

	const uploadImage = async (file) => {
		setUploading(true);
		setError(null);
		setProgress(0);

		try {
			// Validate file
			uploadService.validateImageFile(file);

			// Simulate progress (since we don't have actual progress from backend)
			const progressInterval = setInterval(() => {
				setProgress((prev) => {
					if (prev >= 90) {
						clearInterval(progressInterval);
						return prev;
					}
					return prev + 10;
				});
			}, 100);

			const result = await uploadService.uploadSingleImage(file);

			clearInterval(progressInterval);
			setProgress(100);
			return result;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setUploading(false);
		}
	};

	const uploadMultipleImages = async (files) => {
		setUploading(true);
		setError(null);
		setProgress(0);

		try {
			// Validate all files
			files.forEach((file) => uploadService.validateImageFile(file));

			const result = await uploadService.uploadMultipleImages(files);
			setProgress(100);
			return result;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setUploading(false);
		}
	};

	const reset = () => {
		setUploading(false);
		setError(null);
		setProgress(0);
	};

	return {
		uploadImage,
		uploadMultipleImages,
		uploading,
		error,
		progress,
		reset,
	};
};
```

## 🔄 API Client with Error Handling

### Centralized API Client

```javascript
// services/apiClient.js
import { getApiConfig } from '../config/api';

class ApiClient {
	constructor() {
		this.baseURL = getApiConfig().baseURL;
		this.timeout = getApiConfig().timeout;
	}

	async request(endpoint, options = {}) {
		const url = `${this.baseURL}${endpoint}`;
		const config = {
			headers: {
				'Content-Type': 'application/json',
				...this.getAuthHeaders(),
			},
			...options,
		};

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.timeout);

			let response = await fetch(url, {
				...config,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			// Handle 401 Unauthorized - try refresh token
			if (response.status === 401) {
				const refreshSuccess = await this.refreshToken();
				if (refreshSuccess) {
					config.headers = {
						...config.headers,
						...this.getAuthHeaders(),
					};
					response = await fetch(url, config);
				}
			}

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				throw new ApiError(error.error || `HTTP ${response.status}`, response.status);
			}

			return response.json();
		} catch (error) {
			if (error.name === 'AbortError') {
				throw new ApiError('Request timeout', 408);
			}
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError('Network error occurred', 0);
		}
	}

	async refreshToken() {
		try {
			const refreshToken = localStorage.getItem('fts_refresh_token');
			if (!refreshToken) {
				return false;
			}

			const response = await fetch(`${this.baseURL}/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ refreshToken }),
			});

			if (!response.ok) {
				this.clearTokens();
				return false;
			}

			const data = await response.json();
			localStorage.setItem('fts_access_token', data.accessToken);
			return true;
		} catch (error) {
			this.clearTokens();
			return false;
		}
	}

	clearTokens() {
		localStorage.removeItem('fts_access_token');
		localStorage.removeItem('fts_refresh_token');
		// Trigger logout in app
		window.location.href = '/login';
	}

	getAuthHeaders() {
		const token = localStorage.getItem('fts_access_token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	}

	get(endpoint, params = {}) {
		const queryString = new URLSearchParams(params).toString();
		const url = queryString ? `${endpoint}?${queryString}` : endpoint;
		return this.request(url);
	}

	post(endpoint, data) {
		return this.request(endpoint, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	put(endpoint, data) {
		return this.request(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	delete(endpoint) {
		return this.request(endpoint, {
			method: 'DELETE',
		});
	}
}

class ApiError extends Error {
	constructor(message, status) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

export default new ApiClient();
```

## 🎨 React Components Examples

### Login Form Component

```javascript
// components/LoginForm.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';

const LoginForm = () => {
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		if (error) setError('');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			await login(formData.email, formData.password);
			// Navigation will be handled by AuthContext
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
			<Typography variant="h5" gutterBottom>
				Login to FTS Admin
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			<TextField
				fullWidth
				label="Email"
				name="email"
				type="email"
				value={formData.email}
				onChange={handleChange}
				margin="normal"
				required
				disabled={loading}
			/>

			<TextField
				fullWidth
				label="Password"
				name="password"
				type="password"
				value={formData.password}
				onChange={handleChange}
				margin="normal"
				required
				disabled={loading}
			/>

			<Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
				{loading ? <CircularProgress size={24} /> : 'Login'}
			</Button>
		</Box>
	);
};

export default LoginForm;
```

### Project Form Component

```javascript
// components/ProjectForm.js
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useProject } from '../hooks/useProjects';

const ProjectForm = ({ projectId, onSuccess, onCancel }) => {
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		imageUrl: '',
		liveUrl: '',
		githubUrl: '',
		tags: [],
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const { project, loading: projectLoading } = useProject(projectId);

	useEffect(() => {
		if (project && projectId) {
			setFormData({
				title: project.title || '',
				description: project.description || '',
				imageUrl: project.imageUrl || '',
				liveUrl: project.liveUrl || '',
				githubUrl: project.githubUrl || '',
				tags: project.tags || [],
			});
		}
	}, [project, projectId]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		if (error) setError('');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			// Implementation would depend on your project service
			console.log('Project data:', formData);
			onSuccess?.();
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	if (projectLoading && projectId) {
		return (
			<Box display="flex" justifyContent="center" p={4}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box component="form" onSubmit={handleSubmit}>
			<Typography variant="h5" gutterBottom>
				{projectId ? 'Edit Project' : 'Create New Project'}
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			<TextField
				fullWidth
				label="Project Title"
				name="title"
				value={formData.title}
				onChange={handleChange}
				margin="normal"
				required
				disabled={loading}
			/>

			<TextField
				fullWidth
				label="Description"
				name="description"
				value={formData.description}
				onChange={handleChange}
				margin="normal"
				multiline
				rows={4}
				required
				disabled={loading}
			/>

			<TextField
				fullWidth
				label="Image URL"
				name="imageUrl"
				value={formData.imageUrl}
				onChange={handleChange}
				margin="normal"
				disabled={loading}
			/>

			<TextField
				fullWidth
				label="Live URL"
				name="liveUrl"
				value={formData.liveUrl}
				onChange={handleChange}
				margin="normal"
				disabled={loading}
			/>

			<TextField
				fullWidth
				label="GitHub URL"
				name="githubUrl"
				value={formData.githubUrl}
				onChange={handleChange}
				margin="normal"
				disabled={loading}
			/>

			<Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
				<Button type="submit" variant="contained" disabled={loading}>
					{loading ? <CircularProgress size={24} /> : projectId ? 'Update' : 'Create'}
				</Button>

				{onCancel && (
					<Button variant="outlined" onClick={onCancel} disabled={loading}>
						Cancel
					</Button>
				)}
			</Box>
		</Box>
	);
};

export default ProjectForm;
```

## 🔧 Development Setup

### 1. Install Dependencies

```bash
npm install axios react-router-dom @mui/material @emotion/react @emotion/styled
```

### 2. Environment Setup

Create `.env` file in root directory:

```bash
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
REACT_APP_FRONTEND_URL=http://localhost:5173
```

### 3. App.js Setup

```javascript
// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';

const theme = createTheme({
	palette: {
		mode: 'light',
	},
});

function App() {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<AuthProvider>
				<Router>
					<Routes>
						<Route path="/login" element={<Login />} />
						<Route path="/" element={<Navigate to="/dashboard" replace />} />
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/projects"
							element={
								<ProtectedRoute>
									<Projects />
								</ProtectedRoute>
							}
						/>
					</Routes>
				</Router>
			</AuthProvider>
		</ThemeProvider>
	);
}

export default App;
```

## 🚀 Deployment Notes

### Environment Variables for Production

```bash
# .env.production
REACT_APP_API_BASE_URL=https://fts-production.up.railway.app/api/v1
REACT_APP_FRONTEND_URL=https://your-frontend-domain.com
```

### Build and Deploy

```bash
# Build for production
npm run build

# Deploy to your hosting service
# (Netlify, Vercel, AWS Amplify, etc.)
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**

   - Ensure backend CORS is configured for your frontend domain
   - Check `ALLOWED_ORIGINS` environment variable in backend

2. **Authentication Issues**

   - Check if tokens are being stored correctly
   - Verify token refresh mechanism is working
   - Check browser console for authentication errors

3. **API Connection Issues**

   - Verify API base URL is correct for environment
   - Check if backend is running and accessible
   - Test API endpoints with tools like Postman

4. **File Upload Issues**
   - Check file size limits (max 5MB)
   - Verify file types (JPEG, PNG, WebP only)
   - Ensure Cloudinary is configured in backend

### Debug Tips

1. **Enable Debug Logging**

   ```javascript
   // In development
   console.log('API Request:', { url, options });
   console.log('API Response:', response);
   ```

2. **Network Tab**

   - Use browser DevTools Network tab to inspect requests
   - Check request/response headers and status codes

3. **Local Testing**
   - Test API endpoints with Postman or curl
   - Verify authentication flow manually

---

## 📞 Support

For frontend integration issues:

1. **Backend Team**: Contact backend developers for API issues
2. **Documentation**: Refer to backend README.md for API documentation
3. **Slack/Teams**: Use project communication channels
4. **GitHub Issues**: Create issues for bugs or feature requests

---

**Happy Coding! 🎉**
