/**
 * Blog Middleware
 * Middleware untuk blog-specific features seperti SEO, view tracking, dan content sanitization
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { BlogService } from '../services/blogService';
import { SEOMetaTags, StructuredData } from '../types/blog';

/**
 * Middleware untuk track blog views
 */
export const trackBlogView = async (
	req: Request,
	_res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const { id } = req.params;

		// Only track views for GET requests to specific blog
		if (req.method === 'GET' && id && !req.query['admin']) {
			const blogService = new BlogService();

			// Track view asynchronously (don't wait for it)
			blogService.trackView(id, req.ip, req.get('User-Agent')).catch((error) => {
				logger.error('❌ Failed to track blog view:', error);
			});
		}

		next();
	} catch (error) {
		logger.error('❌ Blog view tracking middleware error:', error);
		// Don't block the request if tracking fails
		next();
	}
};

/**
 * Middleware untuk generate SEO meta tags
 */
export const generateSEOMetaTags = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const { id } = req.params;

		// Only for GET requests to specific blog
		if (req.method === 'GET' && id && !req.query['admin']) {
			const blogService = new BlogService();
			const blog = await blogService.getBlogById(id);

			if (blog && blog.isPublished) {
				// Generate SEO meta tags
				const metaTags: SEOMetaTags = {
					title: blog.seoTitle || blog.title,
					description: blog.seoDescription || blog.excerpt,
					keywords: blog.seoKeywords,
					canonical: `${process.env['BASE_URL'] || 'http://localhost:3000'}/blogs/${blog.slug}`,
					openGraph: {
						title: blog.title,
						description: blog.excerpt,
						image: blog.featuredImage || '',
						url: `${process.env['BASE_URL'] || 'http://localhost:3000'}/blogs/${blog.slug}`,
						type: 'article',
						publishedTime: blog.publishedAt?.toISOString() || null,
					},
					twitter: {
						card: 'summary_large_image',
						title: blog.title,
						description: blog.excerpt,
						image: blog.featuredImage || '',
					},
				};

				// Generate structured data
				const structuredData: StructuredData = {
					'@context': 'https://schema.org',
					'@type': 'Article',
					headline: blog.title,
					description: blog.excerpt,
					image: blog.featuredImage,
					author: {
						'@type': 'Person',
						name: blog.author.name,
					},
					publisher: {
						'@type': 'Organization',
						name: 'Fujiyama Technology Solutions',
						logo: {
							'@type': 'ImageObject',
							url: `${process.env['BASE_URL'] || 'http://localhost:3000'}/logo.png`,
						},
					},
					datePublished: blog.publishedAt?.toISOString() || null,
					dateModified: blog.updatedAt.toISOString(),
				};

				// Attach to response locals for frontend to use
				res.locals['seoMetaTags'] = metaTags;
				res.locals['structuredData'] = structuredData;
			}
		}

		next();
	} catch (error) {
		logger.error('❌ SEO meta tags middleware error:', error);
		// Don't block the request if SEO generation fails
		next();
	}
};

/**
 * Middleware untuk content sanitization
 */
export const sanitizeContent = (req: Request, _res: Response, next: NextFunction): void => {
	try {
		// Only sanitize content for blog creation/update
		if ((req.method === 'POST' || req.method === 'PUT') && req.body.content) {
			// Basic HTML sanitization - remove dangerous tags and attributes
			const sanitizedContent = req.body.content
				.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
				.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
				.replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
				.replace(/javascript:/gi, '') // Remove javascript: protocols
				.replace(/data:/gi, '') // Remove data: protocols
				.replace(/vbscript:/gi, ''); // Remove vbscript: protocols

			req.body.content = sanitizedContent;
		}

		next();
	} catch (error) {
		logger.error('❌ Content sanitization middleware error:', error);
		next();
	}
};

/**
 * Middleware untuk blog-specific rate limiting
 */
export const blogRateLimit = (req: Request, _res: Response, next: NextFunction): void => {
	try {
		// Different rate limits for different blog operations
		const endpoint = req.path;

		// Rate limiting is handled by express-rate-limit middleware
		// This middleware just sets different limits based on endpoint
		if (endpoint.includes('/search')) {
			// More lenient rate limit for search
			(req as any).rateLimit = {
				windowMs: 60000, // 1 minute
				max: 30, // 30 requests per minute
			};
		} else if (endpoint.includes('/admin')) {
			// Stricter rate limit for admin operations
			(req as any).rateLimit = {
				windowMs: 900000, // 15 minutes
				max: 50, // 50 requests per 15 minutes
			};
		} else {
			// Default rate limit for public blog operations
			(req as any).rateLimit = {
				windowMs: 60000, // 1 minute
				max: 60, // 60 requests per minute
			};
		}

		next();
	} catch (error) {
		logger.error('❌ Blog rate limit middleware error:', error);
		next();
	}
};

/**
 * Middleware untuk blog analytics
 */
export const blogAnalytics = async (
	req: Request,
	_res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		// Log blog-related requests for analytics
		if (
			req.path.includes('/blogs') ||
			req.path.includes('/categories') ||
			req.path.includes('/tags')
		) {
			const analyticsData = {
				endpoint: req.path,
				method: req.method,
				ip: req.ip,
				userAgent: req.get('User-Agent'),
				timestamp: new Date().toISOString(),
				query: req.query,
			};

			logger.info('📊 Blog Analytics:', analyticsData);
		}

		next();
	} catch (error) {
		logger.error('❌ Blog analytics middleware error:', error);
		next();
	}
};

/**
 * Middleware untuk blog caching headers
 */
export const blogCacheHeaders = (req: Request, res: Response, next: NextFunction): void => {
	try {
		const endpoint = req.path;

		if (endpoint.includes('/blogs') && req.method === 'GET') {
			// Set cache headers for blog content
			if (endpoint.includes('/search') || endpoint.includes('/stats')) {
				// Short cache for dynamic content
				res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
			} else if (endpoint.includes('/admin')) {
				// No cache for admin endpoints
				res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
			} else {
				// Medium cache for public blog content
				res.set('Cache-Control', 'public, max-age=1800'); // 30 minutes
			}
		}

		next();
	} catch (error) {
		logger.error('❌ Blog cache headers middleware error:', error);
		next();
	}
};

/**
 * Middleware untuk blog content validation
 */
export const validateBlogContent = (req: Request, res: Response, next: NextFunction): void => {
	try {
		// Only validate for blog creation/update
		if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
			const { title, content, excerpt } = req.body;

			// Validate title
			if (title && (title.length < 10 || title.length > 200)) {
				res.status(400).json({
					error: 'Bad Request',
					message: 'Title must be between 10 and 200 characters',
				});
				return;
			}

			// Validate content
			if (content && (content.length < 100 || content.length > 50000)) {
				res.status(400).json({
					error: 'Bad Request',
					message: 'Content must be between 100 and 50000 characters',
				});
				return;
			}

			// Validate excerpt
			if (excerpt && (excerpt.length < 50 || excerpt.length > 500)) {
				res.status(400).json({
					error: 'Bad Request',
					message: 'Excerpt must be between 50 and 500 characters',
				});
				return;
			}

			// Check for potentially harmful content
			const harmfulPatterns = [
				/<script/i,
				/javascript:/i,
				/vbscript:/i,
				/onload/i,
				/onerror/i,
				/onclick/i,
			];

			const contentToCheck = `${title || ''} ${content || ''} ${excerpt || ''}`;

			for (const pattern of harmfulPatterns) {
				if (pattern.test(contentToCheck)) {
					res.status(400).json({
						error: 'Bad Request',
						message: 'Content contains potentially harmful elements',
					});
					return;
				}
			}
		}

		next();
	} catch (error) {
		logger.error('❌ Blog content validation middleware error:', error);
		next();
	}
};

/**
 * Middleware untuk blog slug generation
 */
export const generateBlogSlug = (req: Request, _res: Response, next: NextFunction): void => {
	try {
		// Only for blog creation/update
		if ((req.method === 'POST' || req.method === 'PUT') && req.body.title && !req.body.slug) {
			// Generate slug from title
			const slug = req.body.title
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
				.trim();

			req.body.slug = slug;
		}

		next();
	} catch (error) {
		logger.error('❌ Blog slug generation middleware error:', error);
		next();
	}
};

/**
 * Middleware untuk blog read time calculation
 */
export const calculateReadTime = (req: Request, _res: Response, next: NextFunction): void => {
	try {
		// Only for blog creation/update
		if ((req.method === 'POST' || req.method === 'PUT') && req.body.content) {
			// Calculate read time (200 words per minute)
			const textContent = req.body.content.replace(/<[^>]*>/g, '');
			const wordCount = textContent.split(/\s+/).length;
			const readTime = Math.ceil(wordCount / 200);

			req.body.readTime = readTime;
		}

		next();
	} catch (error) {
		logger.error('❌ Blog read time calculation middleware error:', error);
		next();
	}
};
