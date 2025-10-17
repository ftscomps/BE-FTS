/**
 * Blog Service
 * Business logic untuk blog CRUD operations dan analytics
 */

import prisma from '../config/database';
import { logger } from '../utils/logger';
import {
	BlogWithRelations,
	CreateBlogRequest,
	UpdateBlogRequest,
	BlogQuery,
	BlogListResponse,
	BlogStats,
	BlogSearchResult,
	RelatedBlogsResult,
	BlogValidationRules,
} from '../types/blog';

/**
 * Blog Service class
 */
export class BlogService {
	private validationRules: BlogValidationRules = {
		title: {
			minLength: 10,
			maxLength: 200,
			required: true,
		},
		slug: {
			minLength: 5,
			maxLength: 250,
			pattern: /^[a-z0-9\-]+$/,
			required: true,
		},
		excerpt: {
			minLength: 50,
			maxLength: 500,
			required: true,
		},
		content: {
			minLength: 100,
			required: true,
		},
		tags: {
			maxItems: 10,
			tagMaxLength: 50,
		},
		seoTitle: {
			maxLength: 60,
		},
		seoDescription: {
			maxLength: 160,
		},
		seoKeywords: {
			maxLength: 255,
		},
	};

	constructor() {}

	/**
	 * Generate slug dari title
	 */
	private generateSlug(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim();
	}

	/**
	 * Calculate read time dari content
	 */
	private calculateReadTime(content: string): number {
		const textContent = content.replace(/<[^>]*>/g, '');
		const wordCount = textContent.split(/\s+/).length;
		return Math.ceil(wordCount / 200); // 200 words per minute
	}

	/**
	 * Generate SEO fields
	 */
	private generateSEO(
		title: string,
		excerpt: string
	): {
		seoTitle: string;
		seoDescription: string;
		seoKeywords: string;
	} {
		return {
			seoTitle: title.length > 60 ? title.substring(0, 57) + '...' : title,
			seoDescription: excerpt.length > 160 ? excerpt.substring(0, 157) + '...' : excerpt,
			seoKeywords: this.extractKeywords(title, excerpt),
		};
	}

	/**
	 * Extract keywords dari title dan excerpt
	 */
	private extractKeywords(title: string, excerpt: string): string {
		const text = `${title} ${excerpt}`.toLowerCase();
		const words = text
			.replace(/[^\w\s]/g, '')
			.split(/\s+/)
			.filter((word) => word.length > 3);

		const wordCount: Record<string, number> = {};
		words.forEach((word) => {
			wordCount[word] = (wordCount[word] || 0) + 1;
		});

		return Object.entries(wordCount)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([word]) => word)
			.join(', ');
	}

	/**
	 * Validate blog data
	 */
	private validateBlogData(data: CreateBlogRequest | UpdateBlogRequest): void {
		// Validate title
		if (data.title !== undefined) {
			if (this.validationRules.title.required && !data.title) {
				throw new Error('Title is required');
			}
			if (data.title && data.title.length < this.validationRules.title.minLength) {
				throw new Error(
					`Title must be at least ${this.validationRules.title.minLength} characters long`
				);
			}
			if (data.title && data.title.length > this.validationRules.title.maxLength) {
				throw new Error(`Title must not exceed ${this.validationRules.title.maxLength} characters`);
			}
		}

		// Validate slug
		if (data.slug !== undefined) {
			if (data.slug && data.slug.length < this.validationRules.slug.minLength) {
				throw new Error(
					`Slug must be at least ${this.validationRules.slug.minLength} characters long`
				);
			}
			if (data.slug && data.slug.length > this.validationRules.slug.maxLength) {
				throw new Error(`Slug must not exceed ${this.validationRules.slug.maxLength} characters`);
			}
			if (data.slug && !this.validationRules.slug.pattern.test(data.slug)) {
				throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
			}
		}

		// Validate excerpt
		if (data.excerpt !== undefined) {
			if (this.validationRules.excerpt.required && !data.excerpt) {
				throw new Error('Excerpt is required');
			}
			if (data.excerpt && data.excerpt.length < this.validationRules.excerpt.minLength) {
				throw new Error(
					`Excerpt must be at least ${this.validationRules.excerpt.minLength} characters long`
				);
			}
			if (data.excerpt && data.excerpt.length > this.validationRules.excerpt.maxLength) {
				throw new Error(
					`Excerpt must not exceed ${this.validationRules.excerpt.maxLength} characters`
				);
			}
		}

		// Validate content
		if (data.content !== undefined) {
			if (this.validationRules.content.required && !data.content) {
				throw new Error('Content is required');
			}
			if (data.content && data.content.length < this.validationRules.content.minLength) {
				throw new Error(
					`Content must be at least ${this.validationRules.content.minLength} characters long`
				);
			}
		}

		// Validate tags
		if (data.tags !== undefined) {
			if (data.tags.length > this.validationRules.tags.maxItems) {
				throw new Error(`Maximum ${this.validationRules.tags.maxItems} tags allowed`);
			}
			for (const tag of data.tags) {
				if (tag.length > this.validationRules.tags.tagMaxLength) {
					throw new Error(
						`Tag "${tag}" must not exceed ${this.validationRules.tags.tagMaxLength} characters`
					);
				}
			}
		}

		// Validate SEO fields
		if (data.seoTitle && data.seoTitle.length > this.validationRules.seoTitle.maxLength) {
			throw new Error(
				`SEO title must not exceed ${this.validationRules.seoTitle.maxLength} characters`
			);
		}
		if (
			data.seoDescription &&
			data.seoDescription.length > this.validationRules.seoDescription.maxLength
		) {
			throw new Error(
				`SEO description must not exceed ${this.validationRules.seoDescription.maxLength} characters`
			);
		}
		if (data.seoKeywords && data.seoKeywords.length > this.validationRules.seoKeywords.maxLength) {
			throw new Error(
				`SEO keywords must not exceed ${this.validationRules.seoKeywords.maxLength} characters`
			);
		}
	}

	/**
	 * Create new blog
	 */
	async createBlog(data: CreateBlogRequest, authorId: string): Promise<BlogWithRelations> {
		try {
			// Validate input
			this.validateBlogData(data);

			// Generate slug if not provided
			const slug = data.slug || this.generateSlug(data.title);

			// Check if slug already exists
			const existingBlog = await (prisma as any).blog.findUnique({
				where: { slug },
			});

			if (existingBlog) {
				throw new Error('Blog with this slug already exists');
			}

			// Calculate read time
			const readTime = this.calculateReadTime(data.content);

			// Generate SEO fields if not provided
			const seoFields =
				data.seoTitle && data.seoDescription && data.seoKeywords
					? {
							seoTitle: data.seoTitle,
							seoDescription: data.seoDescription,
							seoKeywords: data.seoKeywords,
					  }
					: this.generateSEO(data.title, data.excerpt);

			// Create or find tags
			const tagConnections = await this.createOrFindTags(data.tags);

			// Determine publishedAt value
			// Priority: 1) Custom publishedAt from frontend, 2) NOW() if published, 3) null if draft
			let publishedAt: Date | null = null;
			if (data.isPublished) {
				if (data.publishedAt) {
					// Frontend provides custom date - validate dan gunakan
					publishedAt = new Date(data.publishedAt);
					// Validate bukan epoch 0 atau invalid date
					if (isNaN(publishedAt.getTime()) || publishedAt.getTime() === 0) {
						publishedAt = new Date(); // Fallback to now
					}
				} else {
					// Auto-set to current date
					publishedAt = new Date();
				}
			}

			// Create blog
			const newBlog = await (prisma as any).blog.create({
				data: {
					title: data.title,
					slug,
					excerpt: data.excerpt,
					content: data.content,
					categoryId: data.categoryId,
					featuredImage: data.featuredImage,
					isPublished: data.isPublished || false,
					readTime,
					authorId,
					publishedAt,
					...seoFields,
					tags: {
						create: tagConnections,
					},
				},
				include: {
					category: true,
					author: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
					tags: {
						include: {
							tag: true,
						},
					},
				},
			});

			// Transform tags structure
			const transformedBlog = {
				...newBlog,
				tags: newBlog.tags.map((bt: any) => ({
					id: bt.tag.id,
					name: bt.tag.name,
					slug: bt.tag.slug,
				})),
			};

			// Log activity
			await this.logActivity(authorId, 'CREATE', 'blog', newBlog.id, {
				title: newBlog.title,
				slug: newBlog.slug,
				isPublished: newBlog.isPublished,
			});

			logger.info(`✅ New blog created: ${newBlog.title} by ${authorId}`);

			return transformedBlog;
		} catch (error) {
			logger.error('❌ Create blog error:', error);
			throw error;
		}
	}

	/**
	 * Get all blogs dengan pagination dan filtering
	 */
	async getBlogs(query: BlogQuery = {}): Promise<BlogListResponse> {
		try {
			const {
				page = 1,
				limit = 10,
				search,
				category,
				tags,
				author,
				isPublished,
				sortBy = 'createdAt',
				sortOrder = 'desc',
			} = query;

			const skip = (page - 1) * limit;

			// Build where clause
			const where: any = {};

			if (search) {
				where.OR = [
					{ title: { contains: search, mode: 'insensitive' } },
					{ excerpt: { contains: search, mode: 'insensitive' } },
					{ content: { contains: search, mode: 'insensitive' } },
				];
			}

			if (category) {
				where.category = { slug: category };
			}

			if (tags && tags.length > 0) {
				where.tags = {
					some: {
						tag: {
							slug: { in: tags },
						},
					},
				};
			}

			if (author) {
				where.author = { id: author };
			}

			if (isPublished !== undefined) {
				where.isPublished = isPublished;
			}

			// Get total count
			const total = await (prisma as any).blog.count({ where });

			// Get blogs - OPTIMIZED: select only required fields, exclude large content field
			const blogs = await (prisma as any).blog.findMany({
				where,
				select: {
					// Select only fields needed for list view (NOT content!)
					id: true,
					title: true,
					slug: true,
					excerpt: true,  // Use excerpt, NOT content (much smaller)
					featuredImage: true,
					isPublished: true,
					readTime: true,
					views: true,
					publishedAt: true,
					createdAt: true,
					updatedAt: true,
					// Relations - select only needed fields
					category: {
						select: {
							id: true,
							name: true,
							slug: true,
						},
					},
					author: {
						select: {
							id: true,
							name: true,
						},
					},
					// Optimized tags loading
					tags: {
						select: {
							tag: {
								select: {
									id: true,
									name: true,
									slug: true,
								},
							},
						},
					},
				},
				orderBy: { [sortBy]: sortOrder },
				skip,
				take: limit,
			});

			// Transform tags structure untuk flatten response
			const transformedBlogs = blogs.map((blog: any) => ({
				...blog,
				tags: blog.tags.map((bt: any) => bt.tag),  // Flatten tags
			}));

			const totalPages = Math.ceil(total / limit);

			// PERFORMANCE: Removed filters loading from this endpoint
			// Filters (categories, tags) should be fetched separately via /blogs/filters endpoint
			// This reduces response time by ~100ms by avoiding 2 extra database queries

			return {
				blogs: transformedBlogs,
				pagination: {
					page,
					limit,
					total,
					totalPages,
					hasNext: page < totalPages,
					hasPrev: page > 1,
				},
			};
		} catch (error) {
			logger.error('❌ Get blogs error:', error);
			throw error;
		}
	}

	/**
	 * Get single blog by ID atau slug
	 */
	async getBlogById(idOrSlug: string): Promise<BlogWithRelations | null> {
		try {
			const blog = await (prisma as any).blog.findFirst({
				where: {
					OR: [{ id: idOrSlug }, { slug: idOrSlug }],
				},
				include: {
					category: true,
					author: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
					tags: {
						include: {
							tag: true,
						},
					},
				},
			});

			if (!blog) {
				return null;
			}

			// Validate publishedAt untuk published blogs
			// Ensure tidak return epoch 0 (Jan 1, 1970) atau invalid date
			if (blog.isPublished && blog.publishedAt) {
				const publishedDate = new Date(blog.publishedAt);
				// Check jika invalid date atau epoch 0
				if (isNaN(publishedDate.getTime()) || publishedDate.getFullYear() === 1970) {
					// Fallback to createdAt jika publishedAt invalid
					blog.publishedAt = blog.createdAt;
				}
			} else if (blog.isPublished && !blog.publishedAt) {
				// Published blog MUST have publishedAt - fallback to createdAt
				blog.publishedAt = blog.createdAt;
			}

			// Transform tags structure
			const transformedBlog = {
				...blog,
				tags: blog.tags.map((bt: any) => ({
					id: bt.tag.id,
					name: bt.tag.name,
					slug: bt.tag.slug,
				})),
			};

			return transformedBlog;
		} catch (error) {
			logger.error('❌ Get blog by ID error:', error);
			throw error;
		}
	}

	/**
	 * Update blog
	 */
	async updateBlog(
		id: string,
		data: UpdateBlogRequest,
		updatedBy: string
	): Promise<BlogWithRelations> {
		try {
			// Check if blog exists
			const existingBlog = await (prisma as any).blog.findUnique({
				where: { id },
			});

			if (!existingBlog) {
				throw new Error('Blog not found');
			}

			// Validate input
			this.validateBlogData(data);

			// Generate slug if provided and different
			let slug = data.slug;
			if (data.title && !data.slug) {
				slug = this.generateSlug(data.title);
			}

			// Check if new slug already exists
			if (slug && slug !== existingBlog.slug) {
				const existingSlugBlog = await (prisma as any).blog.findUnique({
					where: { slug },
				});

				if (existingSlugBlog) {
					throw new Error('Blog with this slug already exists');
				}
			}

			// Calculate read time if content is updated
			let readTime = existingBlog.readTime;
			if (data.content) {
				readTime = this.calculateReadTime(data.content);
			}

			// Generate SEO fields if title or excerpt is updated
			let seoFields = {};
			if (data.title || data.excerpt) {
				const title = data.title || existingBlog.title;
				const excerpt = data.excerpt || existingBlog.excerpt;
				seoFields = this.generateSEO(title, excerpt);
			}

			// Handle tags update
			let tagConnections = undefined;
			if (data.tags) {
				// Delete existing tags
				await (prisma as any).blogTag.deleteMany({
					where: { blogId: id },
				});

				// Create new tag connections
				tagConnections = await this.createOrFindTags(data.tags);
			}

			// Update blog
			const updatedBlog = await (prisma as any).blog.update({
				where: { id },
				data: {
					...data,
					...(slug && { slug }),
					...(readTime !== existingBlog.readTime && { readTime }),
					...seoFields,
					...(tagConnections && {
						tags: {
							create: tagConnections,
						},
					}),
				},
				include: {
					category: true,
					author: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
					tags: {
						include: {
							tag: true,
						},
					},
				},
			});

			// Transform tags structure
			const transformedBlog = {
				...updatedBlog,
				tags: updatedBlog.tags.map((bt: any) => ({
					id: bt.tag.id,
					name: bt.tag.name,
					slug: bt.tag.slug,
				})),
			};

			// Log activity
			await this.logActivity(updatedBy, 'UPDATE', 'blog', id, {
				title: updatedBlog.title,
				updatedFields: Object.keys(data),
			});

			logger.info(`✅ Blog updated: ${updatedBlog.title} by ${updatedBy}`);

			return transformedBlog;
		} catch (error) {
			logger.error('❌ Update blog error:', error);
			throw error;
		}
	}

	/**
	 * Delete blog
	 */
	async deleteBlog(id: string, deletedBy: string): Promise<void> {
		try {
			// Check if blog exists
			const existingBlog = await (prisma as any).blog.findUnique({
				where: { id },
			});

			if (!existingBlog) {
				throw new Error('Blog not found');
			}

			// Delete blog (cascade delete will handle tags and views)
			await (prisma as any).blog.delete({
				where: { id },
			});

			// Log activity
			await this.logActivity(deletedBy, 'DELETE', 'blog', id, {
				title: existingBlog.title,
			});

			logger.info(`✅ Blog deleted: ${existingBlog.title} by ${deletedBy}`);
		} catch (error) {
			logger.error('❌ Delete blog error:', error);
			throw error;
		}
	}

	/**
	 * Publish/Unpublish blog
	 */
	async publishBlog(
		id: string,
		isPublished: boolean,
		updatedBy: string
	): Promise<BlogWithRelations> {
		try {
			// Check if blog exists
			const existingBlog = await (prisma as any).blog.findUnique({
				where: { id },
			});

			if (!existingBlog) {
				throw new Error('Blog not found');
			}

			// Update blog
			const updatedBlog = await (prisma as any).blog.update({
				where: { id },
				data: {
					isPublished,
					publishedAt: isPublished ? new Date() : null,
				},
				include: {
					category: true,
					author: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
					tags: {
						include: {
							tag: true,
						},
					},
				},
			});

			// Transform tags structure
			const transformedBlog = {
				...updatedBlog,
				tags: updatedBlog.tags.map((bt: any) => ({
					id: bt.tag.id,
					name: bt.tag.name,
					slug: bt.tag.slug,
				})),
			};

			// Log activity
			await this.logActivity(updatedBy, isPublished ? 'PUBLISH' : 'UNPUBLISH', 'blog', id, {
				title: updatedBlog.title,
				isPublished,
			});

			logger.info(
				`✅ Blog ${isPublished ? 'published' : 'unpublished'}: ${updatedBlog.title} by ${updatedBy}`
			);

			return transformedBlog;
		} catch (error) {
			logger.error('❌ Publish blog error:', error);
			throw error;
		}
	}

	/**
	 * Track blog view - increment view counter dan store analytics data
	 */
	async trackView(blogId: string, ipAddress?: string, userAgent?: string): Promise<void> {
		try {
			// Increment view count menggunakan Prisma update dengan increment operator
			// NOTE: Prisma tidak punya method .increment() - harus pakai .update() dengan { increment: 1 }
			await (prisma as any).blog.update({
				where: { id: blogId },
				data: {
					views: {
						increment: 1,  // Increment views by 1
					},
				},
			});

			// Store detailed view data untuk analytics
			await (prisma as any).blogView.create({
				data: {
					blogId,
					ipAddress,
					userAgent,
				},
			});

			logger.info(`✅ View tracked for blog: ${blogId}`);
		} catch (error) {
			logger.error('❌ Track view error:', error);
			// Don't throw error for view tracking - non-critical feature
		}
	}

	/**
	 * Get blog statistics
	 */
	async getBlogStats(): Promise<BlogStats> {
		try {
			const [
				total,
				published,
				draft,
				totalViews,
				blogsByCategory,
				blogsByAuthor,
				blogsByTags,
				recentBlogs,
				popularBlogs,
			] = await Promise.all([
				// Total blogs
				(prisma as any).blog.count(),

				// Published blogs
				(prisma as any).blog.count({ where: { isPublished: true } }),

				// Draft blogs
				(prisma as any).blog.count({ where: { isPublished: false } }),

				// Total views
				(prisma as any).blog.aggregate({
					_sum: { views: true },
				}),

				// Blogs by category
				(prisma as any).blog.groupBy({
					by: ['categoryId'],
					_count: { id: true },
				}),

				// Blogs by author
				(prisma as any).blog.groupBy({
					by: ['authorId'],
					_count: { id: true },
				}),

				// Blogs by tags
				(prisma as any).blogTag.groupBy({
					by: ['tagId'],
					_count: { blogId: true },
				}),

				// Recent blogs
				(prisma as any).blog.findMany({
					take: 5,
					orderBy: { createdAt: 'desc' },
					include: {
						category: true,
						author: {
							select: {
								id: true,
								name: true,
								email: true,
								role: true,
							},
						},
						tags: {
							include: {
								tag: true,
							},
						},
					},
				}),

				// Popular blogs
				(prisma as any).blog.findMany({
					take: 5,
					orderBy: { views: 'desc' },
					where: { isPublished: true },
					include: {
						category: true,
						author: {
							select: {
								id: true,
								name: true,
								email: true,
								role: true,
							},
						},
						tags: {
							include: {
								tag: true,
							},
						},
					},
				}),
			]);

			// Process statistics
			const byCategory: Record<string, number> = {};
			blogsByCategory.forEach((item: any) => {
				byCategory[item.category.name] = item._count.id;
			});

			const byAuthor: Record<string, number> = {};
			blogsByAuthor.forEach((item: any) => {
				byAuthor[item.author.name] = item._count.id;
			});

			const byTags: Record<string, number> = {};
			blogsByTags.forEach((item: any) => {
				byTags[item.tag.name] = item._count.blogId;
			});

			// Transform recent and popular blogs
			const transformBlogs = (blogs: any[]) => {
				return blogs.map((blog) => ({
					...blog,
					tags: blog.tags.map((bt: any) => ({
						id: bt.tag.id,
						name: bt.tag.name,
						slug: bt.tag.slug,
					})),
				}));
			};

			return {
				total,
				published,
				draft,
				totalViews: totalViews._sum.views || 0,
				byCategory,
				byAuthor,
				byTags,
				recentBlogs: transformBlogs(recentBlogs),
				popularBlogs: transformBlogs(popularBlogs),
			};
		} catch (error) {
			logger.error('❌ Get blog stats error:', error);
			throw error;
		}
	}

	/**
	 * Search blogs - optimized untuk performance
	 */
	async searchBlogs(query: string, filters: BlogQuery = {}): Promise<BlogSearchResult> {
		try {
			const searchQuery = {
				...filters,
				search: query,
				isPublished: true, // Only search published blogs
			};

			const result = await this.getBlogs(searchQuery);

			// PERFORMANCE: filters removed untuk optimization
			return {
				blogs: result.blogs,
				total: result.pagination.total,
				query,
			};
		} catch (error) {
			logger.error('❌ Search blogs error:', error);
			throw error;
		}
	}

	/**
	 * Get related blogs
	 */
	async getRelatedBlogs(blogId: string, limit: number = 3): Promise<RelatedBlogsResult> {
		try {
			const blog = await (prisma as any).blog.findUnique({
				where: { id: blogId },
				include: {
					tags: {
						include: {
							tag: true,
						},
					},
				},
			});

			if (!blog) {
				throw new Error('Blog not found');
			}

			// Find related blogs by category and tags
			const relatedBlogs = await (prisma as any).blog.findMany({
				where: {
					id: { not: blogId },
					isPublished: true,
					OR: [
						{ categoryId: blog.categoryId },
						{
							tags: {
								some: {
									tagId: { in: blog.tags.map((bt: any) => bt.tagId) },
								},
							},
						},
					],
				},
				include: {
					category: true,
					author: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
					tags: {
						include: {
							tag: true,
						},
					},
				},
				orderBy: { publishedAt: 'desc' },
				take: limit,
			});

			// Transform tags structure
			const transformedBlogs = relatedBlogs.map((blog: any) => ({
				...blog,
				tags: blog.tags.map((bt: any) => ({
					id: bt.tag.id,
					name: bt.tag.name,
					slug: bt.tag.slug,
				})),
			}));

			return {
				blogs: transformedBlogs,
				total: relatedBlogs.length,
				basedOn: 'category',
			};
		} catch (error) {
			logger.error('❌ Get related blogs error:', error);
			throw error;
		}
	}

	/**
	 * Create or find tags
	 */
	private async createOrFindTags(tagNames: string[]): Promise<any[]> {
		const tagConnections = [];

		for (const tagName of tagNames) {
			// Generate slug for tag
			const tagSlug = this.generateSlug(tagName);

			// Find or create tag
			const tag = await (prisma as any).tag.upsert({
				where: { slug: tagSlug },
				update: {},
				create: {
					name: tagName,
					slug: tagSlug,
				},
			});

			tagConnections.push({
				tagId: tag.id,
			});
		}

		return tagConnections;
	}

	/**
	 * Log activity helper
	 */
	private async logActivity(
		userId: string,
		action: string,
		resourceType: string,
		resourceId: string,
		details: any,
		ipAddress?: string,
		userAgent?: string
	): Promise<void> {
		try {
			await (prisma as any).activityLog.create({
				data: {
					userId,
					action,
					resourceType,
					resourceId,
					details,
					ipAddress: ipAddress || '127.0.0.1',
					userAgent: userAgent || 'System',
				},
			});
		} catch (error) {
			logger.error('❌ Failed to log activity:', error);
		}
	}
}
