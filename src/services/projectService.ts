/**
 * Project Service
 * Business logic untuk project CRUD operations
 */

import prisma from '../config/database';
import { logger } from '../utils/logger';
import {
	ProjectWithUser,
	ProjectWithImages,
	CreateProjectRequest,
	UpdateProjectRequest,
	ProjectQuery,
	ProjectListResponse,
	ProjectStats,
	ProjectValidationRules,
} from '../types/project';

/**
 * Project Service class
 */
export class ProjectService {
	private validationRules: ProjectValidationRules = {
		title: {
			minLength: 3,
			maxLength: 255,
			required: true,
		},
		description: {
			minLength: 10,
			maxLength: 5000,
			required: true,
		},
		tags: {
			minItems: 1,
			maxItems: 10,
			tagMaxLength: 50,
		},
		urls: {
			maxLength: 500,
			pattern: /^https?:\/\/.+/,
		},
	};

	constructor() {}

	/**
	 * Validate project data
	 */
	private validateProjectData(data: CreateProjectRequest | UpdateProjectRequest): void {
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

		// Validate description
		if (data.description !== undefined) {
			if (this.validationRules.description.required && !data.description) {
				throw new Error('Description is required');
			}
			if (
				data.description &&
				data.description.length < this.validationRules.description.minLength
			) {
				throw new Error(
					`Description must be at least ${this.validationRules.description.minLength} characters long`
				);
			}
			if (
				data.description &&
				data.description.length > this.validationRules.description.maxLength
			) {
				throw new Error(
					`Description must not exceed ${this.validationRules.description.maxLength} characters`
				);
			}
		}

		// Validate tags
		if (data.tags !== undefined) {
			if (data.tags.length < this.validationRules.tags.minItems) {
				throw new Error(`At least ${this.validationRules.tags.minItems} tag is required`);
			}
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

		// Validate URLs
		const urls = ['imageUrl', 'liveUrl', 'githubUrl'] as const;
		for (const urlField of urls) {
			const url = data[urlField];
			if (url !== undefined && url !== null && url !== '') {
				if (url.length > this.validationRules.urls.maxLength) {
					throw new Error(
						`${urlField} must not exceed ${this.validationRules.urls.maxLength} characters`
					);
				}
				if (!this.validationRules.urls.pattern.test(url)) {
					throw new Error(`${urlField} must be a valid URL starting with http:// or https://`);
				}
			}
		}
	}

	/**
	 * Create new project
	 */
	async createProject(data: CreateProjectRequest, createdBy: string): Promise<ProjectWithUser> {
		try {
			// Validate input
			this.validateProjectData(data);

			// Create project
			const newProject = await (prisma as any).project.create({
				data: {
					...data,
					createdBy,
				},
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
				},
			});

			// Log activity
			await this.logActivity(createdBy, 'CREATE', 'project', newProject.id, {
				title: newProject.title,
				tags: newProject.tags,
			});

			logger.info(`✅ New project created: ${newProject.title} by ${createdBy}`);

			return newProject;
		} catch (error) {
			logger.error('❌ Create project error:', error);
			throw error;
		}
	}

	/**
	 * Get all projects dengan pagination dan filtering
	 */
	async getProjects(query: ProjectQuery = {}): Promise<ProjectListResponse> {
		try {
			const {
				page = 1,
				limit = 10,
				search,
				tags,
				createdBy,
				sortBy = 'createdAt',
				sortOrder = 'desc',
			} = query;

			const skip = (page - 1) * limit;

			// Build where clause
			const where: any = {};

			if (search) {
				where.OR = [
					{ title: { contains: search, mode: 'insensitive' } },
					{ description: { contains: search, mode: 'insensitive' } },
				];
			}

			if (tags && tags.length > 0) {
				where.tags = { hasSome: tags };
			}

			if (createdBy) {
				where.createdBy = createdBy;
			}

			// Get total count
			const total = await (prisma as any).project.count({ where });

			// Get projects
			const projects = await (prisma as any).project.findMany({
				where,
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
				},
				orderBy: { [sortBy]: sortOrder },
				skip,
				take: limit,
			});

			const totalPages = Math.ceil(total / limit);

			return {
				projects,
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
			logger.error('❌ Get projects error:', error);
			throw error;
		}
	}

	/**
	 * Get single project by ID
	 */
	async getProjectById(id: string): Promise<ProjectWithImages | null> {
		try {
			const project = await (prisma as any).project.findUnique({
				where: { id },
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
					images: true,
				},
			});

			return project;
		} catch (error) {
			logger.error('❌ Get project by ID error:', error);
			throw error;
		}
	}

	/**
	 * Update project
	 */
	async updateProject(
		id: string,
		data: UpdateProjectRequest,
		updatedBy: string
	): Promise<ProjectWithUser> {
		try {
			// Check if project exists
			const existingProject = await (prisma as any).project.findUnique({
				where: { id },
			});

			if (!existingProject) {
				throw new Error('Project not found');
			}

			// Validate input
			this.validateProjectData(data);

			// Update project
			const updatedProject = await (prisma as any).project.update({
				where: { id },
				data,
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
				},
			});

			// Log activity
			await this.logActivity(updatedBy, 'UPDATE', 'project', id, {
				title: updatedProject.title,
				updatedFields: Object.keys(data),
			});

			logger.info(`✅ Project updated: ${updatedProject.title} by ${updatedBy}`);

			return updatedProject;
		} catch (error) {
			logger.error('❌ Update project error:', error);
			throw error;
		}
	}

	/**
	 * Delete project
	 */
	async deleteProject(id: string, deletedBy: string): Promise<void> {
		try {
			// Check if project exists
			const existingProject = await (prisma as any).project.findUnique({
				where: { id },
			});

			if (!existingProject) {
				throw new Error('Project not found');
			}

			// Delete project (cascade delete will handle images)
			await (prisma as any).project.delete({
				where: { id },
			});

			// Log activity
			await this.logActivity(deletedBy, 'DELETE', 'project', id, {
				title: existingProject.title,
			});

			logger.info(`✅ Project deleted: ${existingProject.title} by ${deletedBy}`);
		} catch (error) {
			logger.error('❌ Delete project error:', error);
			throw error;
		}
	}

	/**
	 * Get project statistics
	 */
	async getProjectStats(): Promise<ProjectStats> {
		try {
			const [total, projectsByTags, projectsByCreator, recentProjects] = await Promise.all([
				// Total projects
				(prisma as any).project.count(),

				// Projects by tags
				(prisma as any).project.findMany({
					select: { tags: true },
				}),

				// Projects by creator
				(prisma as any).project.findMany({
					select: { createdBy: true },
				}),

				// Recent projects
				(prisma as any).project.findMany({
					take: 5,
					orderBy: { createdAt: 'desc' },
					include: {
						creator: {
							select: {
								id: true,
								name: true,
								email: true,
								role: true,
							},
						},
					},
				}),
			]);

			// Process tags statistics
			const byTags: Record<string, number> = {};
			projectsByTags.forEach((project: any) => {
				project.tags.forEach((tag: string) => {
					byTags[tag] = (byTags[tag] || 0) + 1;
				});
			});

			// Process creator statistics
			const byCreator: Record<string, number> = {};
			projectsByCreator.forEach((project: any) => {
				byCreator[project.createdBy] = (byCreator[project.createdBy] || 0) + 1;
			});

			return {
				total,
				published: total, // Assuming all projects are published
				draft: 0, // No draft status in current schema
				byTags,
				byCreator,
				recentProjects,
			};
		} catch (error) {
			logger.error('❌ Get project stats error:', error);
			throw error;
		}
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

// Class is already exported above
