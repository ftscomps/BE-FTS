# Blog Management System - Backend Requirements

## 📋 Overview

Sistem manajemen blog untuk FTS Company Profile yang terdiri dari:

- **Admin Panel**: CRUD operations, file upload, rich text editing
- **Public Blog**: Blog listing, detail view, search, categories
- **SEO Optimization**: Meta tags, structured data, sitemap
- **Performance**: Image optimization, caching, pagination

---

## 🗄️ Database Schema

### Tables Required

#### 1. **blogs** (Main blog table)

```sql
CREATE TABLE blogs (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) UNIQUE NOT NULL,
    excerpt TEXT NOT NULL,
    content LONGTEXT NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    featured_image VARCHAR(500),
    is_published BOOLEAN DEFAULT FALSE,
    read_time INT DEFAULT 0,
    views INT DEFAULT 0,
    author_id VARCHAR(36) NOT NULL,
    seo_title VARCHAR(200),
    seo_description TEXT,
    seo_keywords TEXT,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_slug (slug),
    INDEX idx_published_at (published_at),
    INDEX idx_is_published (is_published),
    INDEX idx_category_id (category_id)
);
```

#### 2. **categories** (Blog categories)

```sql
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. **tags** (Blog tags)

```sql
CREATE TABLE tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. **blog_tags** (Many-to-many relationship)

```sql
CREATE TABLE blog_tags (
    blog_id VARCHAR(36) NOT NULL,
    tag_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (blog_id, tag_id),
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

#### 5. **blog_views** (Optional - for detailed analytics)

```sql
CREATE TABLE blog_views (
    id VARCHAR(36) PRIMARY KEY,
    blog_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    INDEX idx_blog_id (blog_id),
    INDEX idx_viewed_at (viewed_at)
);
```

---

## 🔌 API Endpoints

### Admin Endpoints (Protected)

#### Blog Management

```
GET    /api/admin/blogs                    # List all blogs with filters
POST   /api/admin/blogs                    # Create new blog
GET    /api/admin/blogs/:id                # Get single blog
PUT    /api/admin/blogs/:id                # Update blog
DELETE /api/admin/blogs/:id                # Delete blog
POST   /api/admin/blogs/:id/publish        # Publish blog
POST   /api/admin/blogs/:id/unpublish      # Unpublish blog
POST   /api/admin/blogs/bulk-action        # Bulk operations
```

#### File Upload

```
POST   /api/admin/blogs/upload-image       # Upload image to Cloudinary
DELETE /api/admin/blogs/images/:publicId   # Delete image from Cloudinary
```

#### Statistics & Analytics

```
GET    /api/admin/blogs/stats              # Get blog statistics
GET    /api/admin/blogs/analytics          # Get detailed analytics
```

### Public Endpoints (Open)

#### Blog Listing & Search

```
GET    /api/blogs                          # Public blog list with pagination
GET    /api/blogs/:slug                    # Get blog by slug
GET    /api/blogs/search                   # Search blogs
GET    /api/blogs/related/:id              # Get related blogs
```

#### Categories & Tags

```
GET    /api/blogs/categories               # Get all categories
GET    /api/blogs/tags                     # Get all tags
GET    /api/blogs/category/:slug           # Get blogs by category
GET    /api/blogs/tag/:slug                # Get blogs by tag
```

#### SEO & Sitemap

```
GET    /api/blogs/sitemap                  # Generate sitemap
GET    /api/blogs/feed                     # RSS feed
```

---

## 📝 Request/Response Examples

### Create Blog (POST /api/admin/blogs)

```json
// Request
{
  "title": "The Future of Web Development",
  "slug": "future-web-development-trends-2024",
  "excerpt": "Explore the latest trends in web development...",
  "content": "<h2>Introduction</h2><p>The web development landscape...</p>",
  "category_id": "cat-123",
  "tags": ["Web Development", "AI", "Performance"],
  "featured_image": "https://res.cloudinary.com/.../image.jpg",
  "is_published": true,
  "seo_title": "Future of Web Development 2024 | FTS",
  "seo_description": "Discover the latest web development trends...",
  "seo_keywords": "web development, trends, 2024, technology"
}

// Response
{
  "success": true,
  "data": {
    "id": "blog-456",
    "title": "The Future of Web Development",
    "slug": "future-web-development-trends-2024",
    "excerpt": "Explore the latest trends in web development...",
    "content": "<h2>Introduction</h2><p>The web development landscape...</p>",
    "category": {
      "id": "cat-123",
      "name": "Technology",
      "slug": "technology"
    },
    "tags": [
      {"id": "tag-1", "name": "Web Development", "slug": "web-development"},
      {"id": "tag-2", "name": "AI", "slug": "ai"}
    ],
    "featured_image": "https://res.cloudinary.com/.../image.jpg",
    "is_published": true,
    "read_time": 8,
    "views": 0,
    "author": {
      "id": "user-789",
      "name": "FTS Admin",
      "role": "Administrator",
      "avatar": "./images/admin.webp"
    },
    "published_at": "2024-01-15T10:00:00Z",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### Blog List (GET /api/blogs)

```json
// Request Query Parameters
?page=1&limit=20&category=technology&search=web&sort=published_at&order=desc

// Response
{
  "success": true,
  "data": {
    "blogs": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    },
    "filters": {
      "categories": [...],
      "tags": [...]
    }
  }
}
```

### Upload Image (POST /api/admin/blogs/upload-image)

```json
// Request (multipart/form-data)
FormData: {
  "image": File,
  "folder": "fts-blogs",
  "transformation": "w_800,h_600,c_fill,q_auto,f_webp"
}

// Response
{
  "success": true,
  "data": {
    "public_id": "fts-blogs/blog-image-123",
    "secure_url": "https://res.cloudinary.com/.../image.webp",
    "width": 800,
    "height": 600,
    "format": "webp",
    "size": 245760,
    "original_format": "jpg",
    "converted": true
  }
}
```

---

## 🔒 Authentication & Authorization

### Required Middleware

- **Authentication**: JWT token validation
- **Authorization**: Role-based access (admin, super_admin)
- **Rate Limiting**: 100 requests/minute for uploads
- **CSRF Protection**: For state-changing operations
- **Author Auto-Assignment**: Auto-assign author_id from authenticated user

### Role Permissions

```javascript
// Admin permissions
const adminPermissions = {
	'blogs:read': true,
	'blogs:create': true,
	'blogs:update': true,
	'blogs:delete': true,
	'blogs:publish': true,
	'blogs:upload': true,
};

// Super Admin permissions
const superAdminPermissions = {
	...adminPermissions,
	'blogs:bulk_delete': true,
	'blogs:analytics': true,
	'blogs:export': true,
};
```

### Author Management System

```javascript
// Auto-assign author from authenticated user
const assignAuthor = (req, res, next) => {
	if (req.user && req.user.id) {
		req.body.author_id = req.user.id;
		req.body.author = {
			name: req.user.name || req.user.username,
			role: req.user.role,
			avatar: req.user.avatar || './images/default-avatar.png',
		};
	}
	next();
};

// Validate author permissions
const validateAuthor = (req, res, next) => {
	const { author_id } = req.body;
	const userId = req.user.id;

	// Check if user can only edit their own blogs (unless super admin)
	if (req.user.role !== 'super_admin' && author_id !== userId) {
		return res.status(403).json({
			success: false,
			message: 'You can only manage your own blog posts',
		});
	}

	next();
};
```

---

## ✅ Validation Rules

### Blog Validation

```javascript
const blogValidation = {
	title: {
		required: true,
		minLength: 10,
		maxLength: 200,
		pattern: /^[a-zA-Z0-9\s\-.,!?]+$/,
	},
	slug: {
		required: true,
		unique: true,
		pattern: /^[a-z0-9\-]+$/,
		minLength: 5,
		maxLength: 250,
	},
	excerpt: {
		required: true,
		minLength: 50,
		maxLength: 500,
	},
	content: {
		required: true,
		minLength: 100,
		sanitize: true, // Remove dangerous HTML
	},
	category_id: {
		required: true,
		exists: 'categories.id',
	},
	tags: {
		maxItems: 10,
		each: {
			maxLength: 50,
			pattern: /^[a-zA-Z0-9\s\-]+$/,
		},
	},
	featured_image: {
		url: true,
		maxLength: 500,
	},
};
```

### File Upload Validation

```javascript
const uploadValidation = {
	file: {
		required: true,
		maxSize: 5 * 1024 * 1024, // 5MB
		allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
		allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
	},
};
```

---

## 🔧 Business Logic

### Auto-Generated Fields

```javascript
// Auto-generate slug from title
const generateSlug = (title) => {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
};

// Auto-calculate read time
const calculateReadTime = (content) => {
	const textContent = content.replace(/<[^>]*>/g, '');
	const wordCount = textContent.split(/\s+/).length;
	return Math.ceil(wordCount / 200); // 200 words per minute
};

// Auto-generate SEO fields
const generateSEO = (title, excerpt) => {
	return {
		seo_title: title.length > 60 ? title.substring(0, 57) + '...' : title,
		seo_description: excerpt.length > 160 ? excerpt.substring(0, 157) + '...' : excerpt,
		seo_keywords: extractKeywords(title, excerpt),
	};
};
```

### View Tracking

```javascript
// Increment view count
const trackView = async (blogId, ipAddress, userAgent) => {
	await db.blogs.increment('views', { where: { id: blogId } });

	// Optional: Store detailed view data
	await db.blog_views.create({
		blog_id: blogId,
		ip_address: ipAddress,
		user_agent: userAgent,
	});
};
```

### Related Blogs Algorithm

```javascript
const getRelatedBlogs = async (blogId, limit = 3) => {
	const blog = await db.blogs.findByPk(blogId);

	return await db.blogs.findAll({
		where: {
			id: { [Op.ne]: blogId },
			is_published: true,
			[Op.or]: [
				{ category_id: blog.category_id },
				{ '$tags.id$': { [Op.in]: blog.tags.map((t) => t.id) } },
			],
		},
		include: ['category', 'tags'],
		order: [['published_at', 'DESC']],
		limit,
	});
};
```

---

## ☁️ Third-Party Integrations

### Cloudinary Configuration

```javascript
const cloudinaryConfig = {
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true,
};

// Image transformations with WebP auto-conversion
const imageTransformations = {
	thumbnail: 'w_300,h_200,c_fill,q_auto,f_webp',
	medium: 'w_600,h_400,c_fill,q_auto,f_webp',
	large: 'w_1200,h_800,c_fill,q_auto,f_webp',
	hero: 'w_1920,h_1080,c_fill,q_auto,f_webp',
	// Auto-convert all uploads to WebP
	default: 'q_auto,f_webp',
};

// Auto-convert to WebP configuration
const webpConversion = {
	format: 'webp',
	quality: 'auto',
	optimization: true,
	fallback: 'jpg', // Fallback format if WebP not supported
};
```

### Search Integration

```javascript
// Full-text search implementation
const searchBlogs = async (query, filters = {}) => {
	return await db.blogs.findAll({
		where: {
			is_published: true,
			[Op.and]: [
				{
					[Op.or]: [
						{ title: { [Op.like]: `%${query}%` } },
						{ excerpt: { [Op.like]: `%${query}%` } },
						{ content: { [Op.like]: `%${query}%` } },
					],
				},
				...buildFilters(filters),
			],
		},
		include: ['category', 'tags', 'author'],
		order: [['published_at', 'DESC']],
	});
};
```

---

## 🚀 Performance Requirements

### Caching Strategy

```javascript
// Redis caching configuration
const cacheConfig = {
	'blogs:list': { ttl: 300 }, // 5 minutes
	'blogs:popular': { ttl: 600 }, // 10 minutes
	'blogs:categories': { ttl: 1800 }, // 30 minutes
	'blogs:tags': { ttl: 1800 }, // 30 minutes
	'blogs:stats': { ttl: 300 }, // 5 minutes
};

// Cache invalidation
const invalidateCache = async (pattern) => {
	const keys = await redis.keys(pattern);
	if (keys.length > 0) {
		await redis.del(...keys);
	}
};
```

### Database Optimization

```sql
-- Indexes for performance
CREATE INDEX idx_blogs_published_category ON blogs(is_published, category_id, published_at);
CREATE INDEX idx_blogs_search ON blogs(is_published, title, excerpt);
CREATE INDEX idx_blog_tags_tag_id ON blog_tags(tag_id);
CREATE INDEX idx_blog_views_blog_date ON blog_views(blog_id, viewed_at);
```

### Pagination

```javascript
const paginationConfig = {
	defaultLimit: 20,
	maxLimit: 100,
	defaultPage: 1,
};

const paginate = (page, limit) => {
	const offset = (page - 1) * limit;
	return { offset, limit };
};
```

---

## 🔐 Security Requirements

### Input Sanitization

```javascript
const sanitizeContent = (content) => {
	// Remove dangerous HTML tags and attributes
	const allowedTags = [
		'p',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'strong',
		'em',
		'u',
		'br',
		'ul',
		'ol',
		'li',
		'a',
		'img',
	];
	const allowedAttributes = {
		a: ['href', 'title'],
		img: ['src', 'alt', 'width', 'height'],
	};

	return sanitizeHtml(content, {
		allowedTags,
		allowedAttributes,
		allowedSchemes: ['http', 'https', 'mailto'],
	});
};
```

### Rate Limiting

```javascript
const rateLimits = {
	'blog:create': { window: 900000, max: 10 }, // 10 per 15 minutes
	'blog:upload': { window: 900000, max: 20 }, // 20 per 15 minutes
	'blog:view': { window: 60000, max: 100 }, // 100 per minute
};
```

---

## 📈 SEO Requirements

### Meta Tags Generation

```javascript
const generateMetaTags = (blog) => {
	return {
		title: blog.seo_title || blog.title,
		description: blog.seo_description || blog.excerpt,
		keywords: blog.seo_keywords,
		canonical: `${process.env.BASE_URL}/blogs/${blog.slug}`,
		openGraph: {
			title: blog.title,
			description: blog.excerpt,
			image: blog.featured_image,
			url: `${process.env.BASE_URL}/blogs/${blog.slug}`,
			type: 'article',
			publishedTime: blog.published_at,
		},
		twitter: {
			card: 'summary_large_image',
			title: blog.title,
			description: blog.excerpt,
			image: blog.featured_image,
		},
	};
};
```

### Structured Data (JSON-LD)

```javascript
const generateStructuredData = (blog) => {
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: blog.title,
		description: blog.excerpt,
		image: blog.featured_image,
		author: {
			'@type': 'Person',
			name: blog.author.name,
		},
		publisher: {
			'@type': 'Organization',
			name: 'Fujiyama Technology Solutions',
			logo: {
				'@type': 'ImageObject',
				url: `${process.env.BASE_URL}/logo.png`,
			},
		},
		datePublished: blog.published_at,
		dateModified: blog.updated_at,
	};
};
```

### Sitemap Generation

```javascript
const generateSitemap = async () => {
	const blogs = await db.blogs.findAll({
		where: { is_published: true },
		attributes: ['slug', 'updated_at'],
		order: [['updated_at', 'DESC']],
	});

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${blogs
		.map(
			(blog) => `
    <url>
      <loc>${process.env.BASE_URL}/blogs/${blog.slug}</loc>
      <lastmod>${blog.updated_at}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `
		)
		.join('')}
</urlset>`;

	return sitemap;
};
```

---

## 📝 Activity Logs Integration

### Blog Action Tracking

```javascript
// Activity logs for blog actions
const logBlogAction = async (action, blogId, userId, details = {}) => {
	const activityLog = {
		action: `blog_${action}`,
		entity_type: 'blog',
		entity_id: blogId,
		user_id: userId,
		timestamp: new Date(),
		details: {
			...details,
			ip_address: req.ip,
			user_agent: req.get('User-Agent'),
		},
	};

	await db.activity_logs.create(activityLog);
};

// Blog action middleware
const trackBlogAction = (action) => {
	return async (req, res, next) => {
		const originalSend = res.send;

		res.send = function (data) {
			// Log the action after successful response
			if (res.statusCode >= 200 && res.statusCode < 300) {
				logBlogAction(action, req.params.id || req.body.id, req.user.id, {
					blog_title: req.body.title,
					action_details: req.body,
				});
			}

			originalSend.call(this, data);
		};

		next();
	};
};
```

### Tracked Blog Actions

```javascript
// All blog actions that should be logged
const blogActions = {
	CREATE: 'blog_created',
	UPDATE: 'blog_updated',
	DELETE: 'blog_deleted',
	PUBLISH: 'blog_published',
	UNPUBLISH: 'blog_unpublished',
	VIEW: 'blog_viewed',
	UPLOAD_IMAGE: 'blog_image_uploaded',
	DELETE_IMAGE: 'blog_image_deleted',
};

// Apply tracking to all blog routes
app.post('/api/admin/blogs', trackBlogAction('CREATE'));
app.put('/api/admin/blogs/:id', trackBlogAction('UPDATE'));
app.delete('/api/admin/blogs/:id', trackBlogAction('DELETE'));
app.post('/api/admin/blogs/:id/publish', trackBlogAction('PUBLISH'));
app.post('/api/admin/blogs/:id/unpublish', trackBlogAction('UNPUBLISH'));
app.get('/api/blogs/:slug', trackBlogAction('VIEW'));
app.post('/api/admin/blogs/upload-image', trackBlogAction('UPLOAD_IMAGE'));
```

---

## 📊 Analytics & Monitoring

### View Tracking

```javascript
const trackBlogView = async (blogId, req) => {
	// Increment view count
	await db.blogs.increment('views', { where: { id: blogId } });

	// Store detailed analytics
	await db.blog_views.create({
		blog_id: blogId,
		ip_address: req.ip,
		user_agent: req.get('User-Agent'),
		referer: req.get('Referer'),
		viewed_at: new Date(),
	});
};
```

### Popular Blogs Algorithm

```javascript
const getPopularBlogs = async (limit = 10, days = 30) => {
	const dateThreshold = new Date();
	dateThreshold.setDate(dateThreshold.getDate() - days);

	return await db.blogs.findAll({
		where: {
			is_published: true,
			published_at: { [Op.gte]: dateThreshold },
		},
		order: [['views', 'DESC']],
		limit,
		include: ['category', 'tags'],
	});
};
```

---

## 🧪 Testing Requirements

### Unit Tests

- Blog CRUD operations
- Validation rules
- Business logic functions
- File upload handling

### Integration Tests

- API endpoints
- Database operations
- Cloudinary integration
- Authentication/Authorization

### Performance Tests

- Load testing for blog listing
- Image upload performance
- Search functionality
- Caching effectiveness

---

## 📋 Implementation Checklist

### Phase 1: Core Functionality

- [ ] Database schema setup
- [ ] Basic CRUD operations
- [ ] Authentication/Authorization
- [ ] File upload to Cloudinary with WebP auto-conversion
- [ ] Author auto-assignment system
- [ ] Basic validation
- [ ] Activity logs integration

### Phase 2: Advanced Features

- [ ] Rich text editor integration
- [ ] Search functionality
- [ ] Related blogs algorithm
- [ ] SEO optimization
- [ ] Analytics tracking

### Phase 3: Performance & Security

- [ ] Caching implementation
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] Performance optimization
- [ ] Security hardening

### Phase 4: Monitoring & Analytics

- [ ] View tracking
- [ ] Popular blogs
- [ ] Search analytics
- [ ] Performance monitoring
- [ ] Error tracking

---

## 🔗 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fts_company_profile
DB_USER=root
DB_PASSWORD=password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_AUTO_WEBP=true
CLOUDINARY_QUALITY=auto

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=password

# Application
BASE_URL=https://fts-company-profile.com
JWT_SECRET=your_jwt_secret
UPLOAD_MAX_SIZE=5242880
```

---

## 📞 Support & Documentation

### API Documentation

- Swagger/OpenAPI documentation
- Postman collection
- Code examples
- Error handling guide

### Monitoring

- Health check endpoints
- Performance metrics
- Error tracking
- Log aggregation

### Maintenance

- Database backup strategy
- Cache management
- Image cleanup
- Log rotation

---

## 🚨 **CRITICAL BUGS FOUND & FIXED**

### **Bug #1: Prisma groupBy() Validation Error**

**Error Location**: `src/services/blogService.ts` - `getBlogStats()` method  
**Error Type**: `PrismaClientValidationError`  
**Error Message**: `Please either use 'include' or 'select', but not both at the same time.`

**Root Cause**:

- Menggunakan `include` dan `_count` bersamaan di `groupBy()` query
- Prisma tidak mengizinkan penggunaan `select`/`include` dengan `_count` bersamaan

**Affected Code**:

```javascript
// ❌ WRONG - Causes error
(prisma as any).blog.groupBy({
  by: ['categoryId'],
  _count: { id: true },
  include: { category: true }, // ❌ This causes error
}),

// ❌ WRONG - Causes error
(prisma as any).blog.groupBy({
  by: ['authorId'],
  _count: { id: true },
  include: { author: { select: {...} } }, // ❌ This causes error
}),

// ❌ WRONG - Causes error
(prisma as any).blogTag.groupBy({
  by: ['tagId'],
  _count: { blogId: true },
  include: { tag: true }, // ❌ This causes error
}),
```

**Solution Applied**:

```javascript
// ✅ FIXED - Remove include from groupBy
(prisma as any).blog.groupBy({
  by: ['categoryId'],
  _count: { id: true },
}),

(prisma as any).blog.groupBy({
  by: ['authorId'],
  _count: { id: true },
}),

(prisma as any).blogTag.groupBy({
  by: ['tagId'],
  _count: { blogId: true },
}),
```

**Impact**:

- ✅ Fixed `/api/v1/blogs/stats` endpoint
- ✅ Blog statistics now working correctly
- ✅ No breaking changes to API response format

**Status**: ✅ **FIXED** - Deployed to Railway

---

## 📋 **Testing Checklist for Team Backend**

### **Critical Endpoints to Test**:

- [ ] `GET /api/v1/blogs/stats` - Blog statistics
- [ ] `GET /api/v1/blogs` - Blog listing
- [ ] `GET /api/v1/blogs/:id` - Single blog
- [ ] `GET /api/v1/blogs/search` - Search functionality
- [ ] `GET /api/v1/categories` - Categories
- [ ] `GET /api/v1/tags` - Tags

### **Admin Endpoints to Test**:

- [ ] `POST /api/v1/blogs` - Create blog (requires auth)
- [ ] `PUT /api/v1/blogs/:id` - Update blog (requires auth)
- [ ] `DELETE /api/v1/blogs/:id` - Delete blog (requires auth)
- [ ] `POST /api/v1/blogs/:id/publish` - Publish blog (requires auth)

### **Authentication Test**:

- [ ] Login with: `admin@fts.biz.id` / `adminmas123`
- [ ] Test JWT token generation
- [ ] Test protected endpoints

---

_This document serves as a comprehensive guide for implementing the Blog Management System backend. All requirements should be implemented according to the specifications above to ensure compatibility with the frontend application._
