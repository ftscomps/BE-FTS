/**
 * Blog Controller
 * HTTP request handlers untuk blog CRUD operations (Admin & Public)
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { BlogService } from '../services/blogService';
import { CreateBlogRequest, UpdateBlogRequest, BlogQuery } from '../types/blog';

/**
 * Get all blogs dengan pagination dan filtering (Public)
 */
export const getBlogs = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
	try {
		// Parse query parameters
		const query: BlogQuery = {};

		if (req.query['page']) {
			query.page = parseInt(req.query['page'] as string);
		}

		if (req.query['limit']) {
			query.limit = parseInt(req.query['limit'] as string);
		}

		if (req.query['search']) {
			query.search = req.query['search'] as string;
		}

		if (req.query['category']) {
			query.category = req.query['category'] as string;
		}

		if (req.query['tags']) {
			query.tags = (req.query['tags'] as string).split(',');
		}

		if (req.query['author']) {
			query.author = req.query['author'] as string;
		}

		if (req.query['isPublished'] !== undefined) {
			query.isPublished = req.query['isPublished'] === 'true';
		}

		if (req.query['sortBy']) {
			query.sortBy = req.query['sortBy'] as
				| 'createdAt'
				| 'updatedAt'
				| 'publishedAt'
				| 'views'
				| 'title';
		}

		if (req.query['sortOrder']) {
			query.sortOrder = req.query['sortOrder'] as 'asc' | 'desc';
		}

		// Default to published blogs for public endpoint
		if (query.isPublished === undefined) {
			query.isPublished = true;
		}

		// Create service instance
		const blogService = new BlogService();

		// Get blogs
		const result = await blogService.getBlogs(query);

		logger.info(`✅ Retrieved ${result.blogs.length} blogs`);

		res.json({
			success: true,
			data: result,
		});
	} catch (error) {
		logger.error('❌ Get blogs controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('Invalid')) {
				res.status(400).json({
					error: 'Bad Request',
					message: error.message,
				});
				return;
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve blogs',
		});
	}
};

/**
 * Get single blog by ID atau slug (Public)
 */
export const getBlogById = async (
	req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const { id } = req.params;

		if (!id) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Blog ID or slug is required',
			});
			return;
		}

		// Create service instance
		const blogService = new BlogService();

		// Get blog
		const blog = await blogService.getBlogById(id);

		if (!blog) {
			res.status(404).json({
				error: 'Not Found',
				message: 'Blog not found',
			});
			return;
		}

		// Track view for published blogs
		if (blog.isPublished) {
			await blogService.trackView(blog.id, req.ip, req.get('User-Agent'));
		}

		logger.info(`✅ Retrieved blog: ${blog.title}`);

		res.json({
			success: true,
			data: blog,
		});
	} catch (error) {
		logger.error('❌ Get blog by ID controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve blog',
		});
	}
};

/**
 * Search blogs (Public)
 */
export const searchBlogs = async (
	req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const { q, page, limit, category, tags } = req.query;

		if (!q || typeof q !== 'string') {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Search query is required',
			});
			return;
		}

		// Create service instance
		const blogService = new BlogService();

		// Search blogs
		const query: BlogQuery = {
			page: page ? parseInt(page as string) : 1,
			limit: limit ? parseInt(limit as string) : 10,
			category: category as string,
			tags: tags ? (tags as string).split(',') : [],
		};

		const result = await blogService.searchBlogs(q, query);

		logger.info(`✅ Search blogs: "${q}" - ${result.total} results`);

		res.json({
			success: true,
			data: result,
		});
	} catch (error) {
		logger.error('❌ Search blogs controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to search blogs',
		});
	}
};

/**
 * Get related blogs (Public)
 */
export const getRelatedBlogs = async (
	req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const { id } = req.params;
		const { limit } = req.query;

		if (!id) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Blog ID is required',
			});
			return;
		}

		// Create service instance
		const blogService = new BlogService();

		// Get related blogs dari service (returns object dengan blogs array)
		const result = await blogService.getRelatedBlogs(id, limit ? parseInt(limit as string) : 3);

		logger.info(`✅ Retrieved ${result.blogs.length} related blogs for blog: ${id}`);

		// Frontend expects array directly in data field (not nested object)
		// Return blogs array directly untuk compatibility dengan frontend
		res.json({
			success: true,
			data: result.blogs || [],  // Return array directly, empty array if no blogs
		});
	} catch (error) {
		logger.error('❌ Get related blogs controller error:', error);

		if (error instanceof Error && error.message.includes('not found')) {
			res.status(404).json({
				error: 'Not Found',
				message: error.message,
			});
			return;
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve related blogs',
		});
	}
};

/**
 * Get blog statistics (Public)
 * Returns comprehensive blog stats untuk admin dashboard dan analytics
 * Frontend consume: totalBlogs, totalPublished, totalDrafts, totalViews, totalCategories, totalTags
 */
export const getBlogStats = async (
	_req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		// Create service instance
		const blogService = new BlogService();

		// Get statistics dari service
		const stats = await blogService.getBlogStats();

		logger.info(`✅ Blog statistics retrieved: ${stats.total} total blogs, ${stats.totalCategories} categories, ${stats.totalTags} tags`);

		// Transform response untuk frontend compatibility
		// Frontend expect: totalBlogs, totalPublished, totalDrafts
		// Service return: total, published, draft
		// Kita provide both untuk backward compatibility
		const response = {
			...stats,
			// Add aliases untuk frontend compatibility
			totalBlogs: stats.total,
			totalPublished: stats.published,
			totalDrafts: stats.draft,
		};

		res.json({
			success: true,
			data: response,
		});
	} catch (error) {
		logger.error('❌ Get blog stats controller error:', error);

		res.status(500).json({
			success: false,
			error: 'Internal Server Error',
			message: 'Failed to retrieve blog statistics',
		});
	}
};

/**
 * Create new blog (Admin)
 */
export const createBlog = async (
	req: AuthenticatedRequest,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
			return;
		}

		const data: CreateBlogRequest = req.body;

		// Validate input
		if (!data.title || !data.excerpt || !data.content || !data.categoryId || !data.tags) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Title, excerpt, content, categoryId, and tags are required',
			});
			return;
		}

		// Validate tags array
		if (!Array.isArray(data.tags) || data.tags.length === 0) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Tags must be a non-empty array',
			});
			return;
		}

		// Create service instance
		const blogService = new BlogService();

		// Create blog
		const newBlog = await blogService.createBlog(data, userId);

		logger.info(`✅ New blog created: ${newBlog.title} by ${userId}`);

		res.status(201).json({
			success: true,
			data: newBlog,
		});
	} catch (error) {
		logger.error('❌ Create blog controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('required') || error.message.includes('must be')) {
				res.status(400).json({
					error: 'Bad Request',
					message: error.message,
				});
				return;
			}
			if (error.message.includes('already exists')) {
				res.status(409).json({
					error: 'Conflict',
					message: error.message,
				});
				return;
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to create blog',
		});
	}
};

/**
 * Update blog (Admin)
 */
export const updateBlog = async (
	req: AuthenticatedRequest,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user?.id;
		const { id } = req.params;

		if (!userId) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
			return;
		}

		if (!id) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Blog ID is required',
			});
			return;
		}

		const data: UpdateBlogRequest = req.body;

		// Validate that at least one field is provided
		if (Object.keys(data).length === 0) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'At least one field must be provided for update',
			});
			return;
		}

		// Create service instance
		const blogService = new BlogService();

		// Update blog
		const updatedBlog = await blogService.updateBlog(id, data, userId);

		logger.info(`✅ Blog updated: ${updatedBlog.title} by ${userId}`);

		res.json({
			success: true,
			data: updatedBlog,
		});
	} catch (error) {
		logger.error('❌ Update blog controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('not found')) {
				res.status(404).json({
					error: 'Not Found',
					message: error.message,
				});
				return;
			}
			if (error.message.includes('required') || error.message.includes('must be')) {
				res.status(400).json({
					error: 'Bad Request',
					message: error.message,
				});
				return;
			}
			if (error.message.includes('already exists')) {
				res.status(409).json({
					error: 'Conflict',
					message: error.message,
				});
				return;
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to update blog',
		});
	}
};

/**
 * Delete blog (Admin)
 */
export const deleteBlog = async (
	req: AuthenticatedRequest,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user?.id;
		const { id } = req.params;

		if (!userId) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
			return;
		}

		if (!id) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Blog ID is required',
			});
			return;
		}

		// Create service instance
		const blogService = new BlogService();

		// Delete blog
		await blogService.deleteBlog(id, userId);

		logger.info(`✅ Blog deleted: ${id} by ${userId}`);

		res.json({
			success: true,
			message: 'Blog deleted successfully',
		});
	} catch (error) {
		logger.error('❌ Delete blog controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('not found')) {
				res.status(404).json({
					error: 'Not Found',
					message: error.message,
				});
				return;
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to delete blog',
		});
	}
};

/**
 * Publish/Unpublish blog (Admin)
 */
export const publishBlog = async (
	req: AuthenticatedRequest,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user?.id;
		const { id } = req.params;
		const { isPublished } = req.body;

		if (!userId) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
			return;
		}

		if (!id) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Blog ID is required',
			});
			return;
		}

		if (typeof isPublished !== 'boolean') {
			res.status(400).json({
				error: 'Bad Request',
				message: 'isPublished must be a boolean value',
			});
			return;
		}

		// Create service instance
		const blogService = new BlogService();

		// Publish/Unpublish blog
		const updatedBlog = await blogService.publishBlog(id, isPublished, userId);

		logger.info(
			`✅ Blog ${isPublished ? 'published' : 'unpublished'}: ${updatedBlog.title} by ${userId}`
		);

		res.json({
			success: true,
			data: updatedBlog,
		});
	} catch (error) {
		logger.error('❌ Publish blog controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('not found')) {
				res.status(404).json({
					error: 'Not Found',
					message: error.message,
				});
				return;
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to publish/unpublish blog',
		});
	}
};

/**
 * Get all blogs for admin (Admin)
 */
export const getAdminBlogs = async (
	req: AuthenticatedRequest,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
			return;
		}

		// Parse query parameters
		const query: BlogQuery = {};

		if (req.query['page']) {
			query.page = parseInt(req.query['page'] as string);
		}

		if (req.query['limit']) {
			query.limit = parseInt(req.query['limit'] as string);
		}

		if (req.query['search']) {
			query.search = req.query['search'] as string;
		}

		if (req.query['category']) {
			query.category = req.query['category'] as string;
		}

		if (req.query['tags']) {
			query.tags = (req.query['tags'] as string).split(',');
		}

		if (req.query['author']) {
			query.author = req.query['author'] as string;
		}

		if (req.query['isPublished'] !== undefined) {
			query.isPublished = req.query['isPublished'] === 'true';
		}

		if (req.query['sortBy']) {
			query.sortBy = req.query['sortBy'] as
				| 'createdAt'
				| 'updatedAt'
				| 'publishedAt'
				| 'views'
				| 'title';
		}

		if (req.query['sortOrder']) {
			query.sortOrder = req.query['sortOrder'] as 'asc' | 'desc';
		}

		// Create service instance
		const blogService = new BlogService();

		// Get blogs (admin can see all blogs)
		const result = await blogService.getBlogs(query);

		logger.info(`✅ Admin retrieved ${result.blogs.length} blogs`);

		res.json({
			success: true,
			data: result,
		});
	} catch (error) {
		logger.error('❌ Get admin blogs controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('Invalid')) {
				res.status(400).json({
					error: 'Bad Request',
					message: error.message,
				});
				return;
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve blogs',
		});
	}
};

/**
 * Track blog view (Public)
 * Increment view counter dan store analytics data (IP, User-Agent)
 * Called saat user membaca blog untuk tracking engagement
 */
export const trackBlogView = async (
	req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const { id } = req.params;

		if (!id) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Blog ID is required',
			});
			return;
		}

		// Create service instance
		const blogService = new BlogService();

		// Verify blog exists sebelum track view
		const blog = await blogService.getBlogById(id);
		if (!blog) {
			res.status(404).json({
				error: 'Not Found',
				message: 'Blog not found',
			});
			return;
		}

		// Track view - increment counter dan store analytics
		// Silent fail jika tracking gagal (tidak interrupt UX)
		await blogService.trackView(blog.id, req.ip, req.get('User-Agent'));

		logger.info(`✅ Blog view tracked: ${blog.title}`);

		// Return 204 No Content (standard untuk tracking endpoints)
		res.status(204).send();
	} catch (error) {
		logger.error('❌ Track blog view error:', error);

		// Even on error, return success untuk tidak interrupt frontend
		// View tracking adalah non-critical operation
		res.status(204).send();
	}
};
