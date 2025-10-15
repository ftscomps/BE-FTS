/**
 * Category Service
 * Business logic untuk category CRUD operations
 */

import prisma from '../config/database';
import { logger } from '../utils/logger';
import { Category, CategoryWithBlogCount } from '../types/blog';

/**
 * Category Service class
 */
export class CategoryService {
	constructor() {}

	/**
	 * Generate slug dari name
	 */
	private generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim();
	}

	/**
	 * Validate category data
	 */
	private validateCategoryData(data: { name: string; description?: string }): void {
		if (!data.name || data.name.trim().length === 0) {
			throw new Error('Category name is required');
		}

		if (data.name.length < 2) {
			throw new Error('Category name must be at least 2 characters long');
		}

		if (data.name.length > 100) {
			throw new Error('Category name must not exceed 100 characters');
		}

		if (data.description && data.description.length > 500) {
			throw new Error('Category description must not exceed 500 characters');
		}
	}

	/**
	 * Create new category
	 */
	async createCategory(data: { name: string; description?: string }): Promise<Category> {
		try {
			// Validate input
			this.validateCategoryData(data);

			// Generate slug
			const slug = this.generateSlug(data.name);

			// Check if category with same name or slug already exists
			const existingCategory = await (prisma as any).category.findFirst({
				where: {
					OR: [{ name: data.name }, { slug }],
				},
			});

			if (existingCategory) {
				throw new Error('Category with this name or slug already exists');
			}

			// Create category
			const newCategory = await (prisma as any).category.create({
				data: {
					name: data.name,
					slug,
					description: data.description || null,
				},
			});

			logger.info(`✅ New category created: ${newCategory.name}`);

			return newCategory;
		} catch (error) {
			logger.error('❌ Create category error:', error);
			throw error;
		}
	}

	/**
	 * Get all categories
	 */
	async getCategories(
		includeBlogCount: boolean = false
	): Promise<Category[] | CategoryWithBlogCount[]> {
		try {
			const categories = await (prisma as any).category.findMany({
				orderBy: { name: 'asc' },
				...(includeBlogCount && {
					include: {
						_count: {
							select: {
								blogs: true,
							},
						},
					},
				}),
			});

			return categories;
		} catch (error) {
			logger.error('❌ Get categories error:', error);
			throw error;
		}
	}

	/**
	 * Get single category by ID atau slug
	 */
	async getCategoryById(idOrSlug: string): Promise<Category | null> {
		try {
			const category = await (prisma as any).category.findFirst({
				where: {
					OR: [{ id: idOrSlug }, { slug: idOrSlug }],
				},
			});

			return category;
		} catch (error) {
			logger.error('❌ Get category by ID error:', error);
			throw error;
		}
	}

	/**
	 * Get category with blog count
	 */
	async getCategoryWithBlogCount(idOrSlug: string): Promise<CategoryWithBlogCount | null> {
		try {
			const category = await (prisma as any).category.findFirst({
				where: {
					OR: [{ id: idOrSlug }, { slug: idOrSlug }],
				},
				include: {
					_count: {
						select: {
							blogs: true,
						},
					},
				},
			});

			return category;
		} catch (error) {
			logger.error('❌ Get category with blog count error:', error);
			throw error;
		}
	}

	/**
	 * Update category
	 */
	async updateCategory(
		id: string,
		data: { name?: string; description?: string }
	): Promise<Category> {
		try {
			// Check if category exists
			const existingCategory = await (prisma as any).category.findUnique({
				where: { id },
			});

			if (!existingCategory) {
				throw new Error('Category not found');
			}

			// Validate input
			if (data.name) {
				this.validateCategoryData({
					name: data.name,
					...(data.description && { description: data.description }),
				});
			}

			// Generate slug if name is updated
			let slug = undefined;
			if (data.name && data.name !== existingCategory.name) {
				slug = this.generateSlug(data.name);

				// Check if new slug already exists
				const existingSlugCategory = await (prisma as any).category.findUnique({
					where: { slug },
				});

				if (existingSlugCategory) {
					throw new Error('Category with this slug already exists');
				}
			}

			// Update category
			const updatedCategory = await (prisma as any).category.update({
				where: { id },
				data: {
					...data,
					...(slug && { slug }),
				},
			});

			logger.info(`✅ Category updated: ${updatedCategory.name}`);

			return updatedCategory;
		} catch (error) {
			logger.error('❌ Update category error:', error);
			throw error;
		}
	}

	/**
	 * Delete category
	 */
	async deleteCategory(id: string): Promise<void> {
		try {
			// Check if category exists
			const existingCategory = await (prisma as any).category.findUnique({
				where: { id },
				include: {
					_count: {
						select: {
							blogs: true,
						},
					},
				},
			});

			if (!existingCategory) {
				throw new Error('Category not found');
			}

			// Check if category has blogs
			if (existingCategory._count.blogs > 0) {
				throw new Error(
					'Cannot delete category that has blogs. Please move or delete the blogs first.'
				);
			}

			// Delete category
			await (prisma as any).category.delete({
				where: { id },
			});

			logger.info(`✅ Category deleted: ${existingCategory.name}`);
		} catch (error) {
			logger.error('❌ Delete category error:', error);
			throw error;
		}
	}

	/**
	 * Get categories with blog count
	 */
	async getCategoriesWithBlogCount(): Promise<CategoryWithBlogCount[]> {
		try {
			const categories = await (prisma as any).category.findMany({
				include: {
					_count: {
						select: {
							blogs: true,
						},
					},
				},
				orderBy: { name: 'asc' },
			});

			return categories;
		} catch (error) {
			logger.error('❌ Get categories with blog count error:', error);
			throw error;
		}
	}

	/**
	 * Get popular categories (with most blogs)
	 */
	async getPopularCategories(limit: number = 10): Promise<CategoryWithBlogCount[]> {
		try {
			const categories = await (prisma as any).category.findMany({
				include: {
					_count: {
						select: {
							blogs: true,
						},
					},
				},
				orderBy: {
					blogs: {
						_count: 'desc',
					},
				},
				take: limit,
			});

			return categories;
		} catch (error) {
			logger.error('❌ Get popular categories error:', error);
			throw error;
		}
	}

	/**
	 * Search categories
	 */
	async searchCategories(query: string): Promise<Category[]> {
		try {
			const categories = await (prisma as any).category.findMany({
				where: {
					OR: [
						{ name: { contains: query, mode: 'insensitive' } },
						{ description: { contains: query, mode: 'insensitive' } },
					],
				},
				orderBy: { name: 'asc' },
			});

			return categories;
		} catch (error) {
			logger.error('❌ Search categories error:', error);
			throw error;
		}
	}
}
