# 📝 FTS Frontend Integration Guide - Blog Management System

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

### Token Usage

```javascript
headers: {
  "Authorization": `Bearer ${accessToken}`,
  "Content-Type": "application/json"
}
```

## 📊 Blog Management API Endpoints

### Public Blog Endpoints

```
GET    /api/v1/blogs              # Get all published blogs
GET    /api/v1/blogs/:id          # Get single blog by ID/slug
GET    /api/v1/blogs/search       # Search blogs
GET    /api/v1/blogs/stats        # Get blog statistics
GET    /api/v1/categories         # Get all categories
GET    /api/v1/tags               # Get all tags
```

### Admin Blog Endpoints (Require Authentication)

```
POST   /api/v1/blogs              # Create new blog
PUT    /api/v1/blogs/:id          # Update blog
DELETE /api/v1/blogs/:id          # Delete blog
POST   /api/v1/blogs/:id/publish  # Publish/unpublish blog
GET    /api/v1/blogs/admin/all    # Get all blogs (including drafts)

POST   /api/v1/categories         # Create category
PUT    /api/v1/categories/:id     # Update category
DELETE /api/v1/categories/:id     # Delete category

POST   /api/v1/tags               # Create tag
POST   /api/v1/tags/bulk          # Create multiple tags
PUT    /api/v1/tags/:id           # Update tag
DELETE /api/v1/tags/:id           # Delete tag
```

## 📝 Blog Data Structure

### Blog Object

```javascript
{
  "id": "uuid",
  "title": "Blog Title",
  "slug": "blog-title",
  "excerpt": "Blog excerpt...",
  "content": "<p>Blog content...</p>",
  "featuredImage": "https://cloudinary.com/image.jpg",
  "isPublished": true,
  "readTime": 5,
  "views": 150,
  "seoTitle": "SEO Title",
  "seoDescription": "SEO Description",
  "seoKeywords": "keyword1, keyword2",
  "publishedAt": "2024-01-01T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "category": {
    "id": "uuid",
    "name": "Technology",
    "slug": "technology"
  },
  "author": {
    "id": "uuid",
    "name": "Author Name",
    "email": "author@example.com"
  },
  "tags": [
    {
      "id": "uuid",
      "name": "JavaScript",
      "slug": "javascript"
    }
  ]
}
```

### Category Object

```javascript
{
  "id": "uuid",
  "name": "Technology",
  "slug": "technology",
  "description": "Technology related posts",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Tag Object

```javascript
{
  "id": "uuid",
  "name": "JavaScript",
  "slug": "javascript",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## 🎨 Frontend Components Examples

### Blog API Service

```javascript
// services/blogApi.js
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const blogApi = {
	// Public endpoints
	getAll: (params = {}) => apiClient('/blogs', { params }),
	getById: (id) => apiClient(`/blogs/${id}`),
	search: (query) => apiClient(`/blogs/search?q=${query}`),
	getStats: () => apiClient('/blogs/stats'),

	// Admin endpoints
	create: (data) => apiClient('/blogs', { method: 'POST', body: JSON.stringify(data) }),
	update: (id, data) => apiClient(`/blogs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
	delete: (id) => apiClient(`/blogs/${id}`, { method: 'DELETE' }),
	publish: (id, isPublished) =>
		apiClient(`/blogs/${id}/publish`, {
			method: 'POST',
			body: JSON.stringify({ isPublished }),
		}),
	getAllAdmin: (params = {}) => apiClient('/blogs/admin/all', { params }),
};

export const categoryApi = {
	getAll: () => apiClient('/categories'),
	getById: (id) => apiClient(`/categories/${id}`),
	create: (data) => apiClient('/categories', { method: 'POST', body: JSON.stringify(data) }),
	update: (id, data) =>
		apiClient(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
	delete: (id) => apiClient(`/categories/${id}`, { method: 'DELETE' }),
};

export const tagApi = {
	getAll: () => apiClient('/tags'),
	getById: (id) => apiClient(`/tags/${id}`),
	create: (data) => apiClient('/tags', { method: 'POST', body: JSON.stringify(data) }),
	createBulk: (names) =>
		apiClient('/tags/bulk', { method: 'POST', body: JSON.stringify({ names }) }),
	update: (id, data) => apiClient(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
	delete: (id) => apiClient(`/tags/${id}`, { method: 'DELETE' }),
};
```

### React Hooks

```javascript
// hooks/useBlogs.js
import { useState, useEffect } from 'react';
import { blogApi } from '../services/blogApi';

export const useBlogs = (params = {}) => {
	const [blogs, setBlogs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState({});

	const fetchBlogs = async () => {
		setLoading(true);
		try {
			const data = await blogApi.getAll(params);
			setBlogs(data.data.blogs);
			setPagination(data.data.pagination);
		} catch (error) {
			console.error('Failed to fetch blogs:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchBlogs();
	}, [params]);

	return { blogs, loading, pagination, refetch: fetchBlogs };
};

// hooks/useBlog.js
export const useBlog = (id) => {
	const [blog, setBlog] = useState(null);
	const [loading, setLoading] = useState(false);

	const fetchBlog = async () => {
		if (!id) return;
		setLoading(true);
		try {
			const data = await blogApi.getById(id);
			setBlog(data.data);
		} catch (error) {
			console.error('Failed to fetch blog:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchBlog();
	}, [id]);

	return { blog, loading, refetch: fetchBlog };
};
```

### Blog Form Component

```javascript
// components/BlogForm.jsx
import { useState, useEffect } from 'react';
import { blogApi, categoryApi, tagApi } from '../services/blogApi';

export const BlogForm = ({ blog, onSubmit, onCancel }) => {
	const [formData, setFormData] = useState({
		title: '',
		excerpt: '',
		content: '',
		categoryId: '',
		tags: [],
		featuredImage: '',
		seoTitle: '',
		seoDescription: '',
		seoKeywords: '',
	});
	const [categories, setCategories] = useState([]);
	const [tags, setTags] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		// Load categories and tags
		const loadData = async () => {
			const [categoriesData, tagsData] = await Promise.all([categoryApi.getAll(), tagApi.getAll()]);
			setCategories(categoriesData.data);
			setTags(tagsData.data);
		};
		loadData();

		// Pre-fill form if editing
		if (blog) {
			setFormData({
				title: blog.title,
				excerpt: blog.excerpt,
				content: blog.content,
				categoryId: blog.categoryId,
				tags: blog.tags.map((tag) => tag.name),
				featuredImage: blog.featuredImage,
				seoTitle: blog.seoTitle,
				seoDescription: blog.seoDescription,
				seoKeywords: blog.seoKeywords,
			});
		}
	}, [blog]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			await blogApi[blog ? 'update' : 'create'](blog?.id, formData);
			onSubmit();
		} catch (error) {
			console.error('Failed to save blog:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<label>Title</label>
				<input
					type="text"
					value={formData.title}
					onChange={(e) => setFormData({ ...formData, title: e.target.value })}
					required
				/>
			</div>

			<div>
				<label>Excerpt</label>
				<textarea
					value={formData.excerpt}
					onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
					required
				/>
			</div>

			<div>
				<label>Content</label>
				<textarea
					value={formData.content}
					onChange={(e) => setFormData({ ...formData, content: e.target.value })}
					required
				/>
			</div>

			<div>
				<label>Category</label>
				<select
					value={formData.categoryId}
					onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
					required
				>
					<option value="">Select Category</option>
					{categories.map((cat) => (
						<option key={cat.id} value={cat.id}>
							{cat.name}
						</option>
					))}
				</select>
			</div>

			<div>
				<label>Tags</label>
				<input
					type="text"
					value={formData.tags.join(', ')}
					onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(', ') })}
					placeholder="JavaScript, Node.js, React"
				/>
			</div>

			<div className="flex gap-4">
				<button type="submit" disabled={loading}>
					{loading ? 'Saving...' : 'Save Blog'}
				</button>
				<button type="button" onClick={onCancel}>
					Cancel
				</button>
			</div>
		</form>
	);
};
```

## 📤 File Upload for Blog Images

### Upload Service

```javascript
// services/uploadApi.js
export const uploadApi = {
	uploadImage: async (file) => {
const formData = new FormData();
formData.append('image', file);

		const response = await fetch(`${API_BASE}/upload/single`, {
	method: 'POST',
	headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
	},
	body: formData,
});

		return response.json();
	},
};
```

## 🔍 Search & Filtering

### Search Implementation

```javascript
// components/BlogSearch.jsx
export const BlogSearch = ({ onSearch }) => {
	const [query, setQuery] = useState('');
	const [filters, setFilters] = useState({
		category: '',
		tag: '',
		sortBy: 'newest',
	});

	const handleSearch = async () => {
		const params = new URLSearchParams();
		if (query) params.append('q', query);
		if (filters.category) params.append('category', filters.category);
		if (filters.tag) params.append('tag', filters.tag);
		if (filters.sortBy) params.append('sortBy', filters.sortBy);

		const data = await blogApi.search(params.toString());
		onSearch(data);
	};

	return (
		<div className="search-filters">
			<input
				type="text"
				placeholder="Search blogs..."
				value={query}
				onChange={(e) => setQuery(e.target.value)}
			/>
			<select
				value={filters.category}
				onChange={(e) => setFilters({ ...filters, category: e.target.value })}
			>
				<option value="">All Categories</option>
				{/* Render categories */}
			</select>
			<button onClick={handleSearch}>Search</button>
		</div>
	);
};
```

## 🛡️ Error Handling

### Common Error Responses

```javascript
// 400 Bad Request
{
  "error": "Bad Request",
  "message": "Title must be at least 10 characters long"
}

// 401 Unauthorized
{
  "error": "Unauthorized",
  "message": "User not authenticated"
}

// 404 Not Found
{
  "error": "Not Found",
  "message": "Blog not found"
}

// 409 Conflict
{
  "error": "Conflict",
  "message": "Category already exists"
}
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install axios react-router-dom
```

### 2. Setup API Client

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
```

### 3. Basic App Structure

```javascript
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BlogList } from './pages/BlogList';
import { BlogDetail } from './pages/BlogDetail';
import { AdminBlogs } from './pages/AdminBlogs';

function App() {
	return (
			<BrowserRouter>
				<Routes>
				<Route path="/blogs" element={<BlogList />} />
				<Route path="/blogs/:id" element={<BlogDetail />} />
				<Route path="/admin/blogs" element={<AdminBlogs />} />
				</Routes>
			</BrowserRouter>
	);
}
```

## 📊 Analytics & SEO

### View Tracking

```javascript
// Track blog views automatically
useEffect(() => {
	if (blog?.id) {
		// View tracking is handled by backend middleware
		// No additional frontend code needed
	}
}, [blog?.id]);
```

### SEO Meta Tags

```javascript
// components/SEOHead.jsx
export const SEOHead = ({ blog }) => {
	useEffect(() => {
		if (blog) {
			document.title = blog.seoTitle || blog.title;

			// Meta description
			const metaDescription = document.querySelector('meta[name="description"]');
			if (metaDescription) {
				metaDescription.setAttribute('content', blog.seoDescription || blog.excerpt);
			}

			// Open Graph tags
			const ogTitle = document.querySelector('meta[property="og:title"]');
			if (ogTitle) ogTitle.setAttribute('content', blog.title);

			const ogDescription = document.querySelector('meta[property="og:description"]');
			if (ogDescription) ogDescription.setAttribute('content', blog.excerpt);

			const ogImage = document.querySelector('meta[property="og:image"]');
			if (ogImage && blog.featuredImage) {
				ogImage.setAttribute('content', blog.featuredImage);
			}
		}
	}, [blog]);

	return null;
};
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Error** - Check backend CORS configuration
2. **401 Unauthorized** - Token expired, need to refresh
3. **404 Not Found** - Wrong endpoint or blog not found
4. **400 Bad Request** - Validation errors (check required fields)

### Debug Tips

```javascript
// Add to your API client for debugging
console.log('API Request:', endpoint, options);
console.log('API Response:', response);
```

---

**Backend URL**: https://be-fts-production.up.railway.app  
**Health Check**: https://be-fts-production.up.railway.app/health  
**Admin Login**: admin@fts.biz.id / adminmas123

🎉 Happy coding!
