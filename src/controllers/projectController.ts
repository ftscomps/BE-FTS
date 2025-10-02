/**
 * Project Controller
 * HTTP request handlers untuk project CRUD operations
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProjectService } from '../services/projectService';
import { CreateProjectRequest, UpdateProjectRequest, ProjectQuery } from '../types/project';

/**
 * Get all projects dengan pagination dan filtering
 */
export const getProjects = async (req: Request, res: Response) => {
	try {
		// Parse query parameters
		const query: ProjectQuery = {};

		if (req.query['page']) {
			query.page = parseInt(req.query['page'] as string);
		}

		if (req.query['limit']) {
			query.limit = parseInt(req.query['limit'] as string);
		}

		if (req.query['search']) {
			query.search = req.query['search'] as string;
		}

		if (req.query['tags']) {
			query.tags = (req.query['tags'] as string).split(',');
		}

		if (req.query['createdBy']) {
			query.createdBy = req.query['createdBy'] as string;
		}

		if (req.query['sortBy']) {
			query.sortBy = req.query['sortBy'] as 'createdAt' | 'updatedAt' | 'title';
		}

		if (req.query['sortOrder']) {
			query.sortOrder = req.query['sortOrder'] as 'asc' | 'desc';
		}

		// Create service instance
		const projectService = new ProjectService(require('../config/database').default);

		// Get projects
		const result = await projectService.getProjects(query);

		logger.info(`✅ Retrieved ${result.projects.length} projects`);

		res.json({
			success: true,
			message: 'Projects retrieved successfully',
			data: result,
		});
	} catch (error) {
		logger.error('❌ Get projects controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('Invalid')) {
				return res.status(400).json({
					error: 'Bad Request',
					message: error.message,
				});
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve projects',
		});
	}
};

/**
 * Get single project by ID
 */
export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Project ID is required',
			});
		}

		// Create service instance
		const projectService = new ProjectService(require('../config/database').default);

		// Get project
		const project = await projectService.getProjectById(id);

		if (!project) {
			return res.status(404).json({
				error: 'Not Found',
				message: 'Project not found',
			});
		}

		logger.info(`✅ Retrieved project: ${project.title}`);

		res.json({
			success: true,
			message: 'Project retrieved successfully',
			data: project,
		});
	} catch (error) {
		logger.error('❌ Get project by ID controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve project',
		});
	}
};

/**
 * Create new project
 */
export const createProject = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
		}

		const data: CreateProjectRequest = req.body;

		// Validate input
		if (!data.title || !data.description || !data.tags) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Title, description, and tags are required',
			});
		}

		// Validate tags array
		if (!Array.isArray(data.tags) || data.tags.length === 0) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Tags must be a non-empty array',
			});
		}

		// Create service instance
		const projectService = new ProjectService(require('../config/database').default);

		// Create project
		const newProject = await projectService.createProject(data, userId);

		logger.info(`✅ New project created: ${newProject.title} by ${userId}`);

		res.status(201).json({
			success: true,
			message: 'Project created successfully',
			data: newProject,
		});
	} catch (error) {
		logger.error('❌ Create project controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('required') || error.message.includes('must be')) {
				return res.status(400).json({
					error: 'Bad Request',
					message: error.message,
				});
			}
			if (error.message.includes('already exists')) {
				return res.status(409).json({
					error: 'Conflict',
					message: error.message,
				});
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to create project',
		});
	}
};

/**
 * Update project
 */
export const updateProject = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user?.id;
		const { id } = req.params;

		if (!userId) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
		}

		if (!id) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Project ID is required',
			});
		}

		const data: UpdateProjectRequest = req.body;

		// Validate that at least one field is provided
		if (Object.keys(data).length === 0) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'At least one field must be provided for update',
			});
		}

		// Create service instance
		const projectService = new ProjectService(require('../config/database').default);

		// Update project
		const updatedProject = await projectService.updateProject(id, data, userId);

		logger.info(`✅ Project updated: ${updatedProject.title} by ${userId}`);

		res.json({
			success: true,
			message: 'Project updated successfully',
			data: updatedProject,
		});
	} catch (error) {
		logger.error('❌ Update project controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('not found')) {
				return res.status(404).json({
					error: 'Not Found',
					message: error.message,
				});
			}
			if (error.message.includes('required') || error.message.includes('must be')) {
				return res.status(400).json({
					error: 'Bad Request',
					message: error.message,
				});
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to update project',
		});
	}
};

/**
 * Delete project
 */
export const deleteProject = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user?.id;
		const { id } = req.params;

		if (!userId) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
		}

		if (!id) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Project ID is required',
			});
		}

		// Create service instance
		const projectService = new ProjectService(require('../config/database').default);

		// Delete project
		await projectService.deleteProject(id, userId);

		logger.info(`✅ Project deleted: ${id} by ${userId}`);

		res.json({
			success: true,
			message: 'Project deleted successfully',
		});
	} catch (error) {
		logger.error('❌ Delete project controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('not found')) {
				return res.status(404).json({
					error: 'Not Found',
					message: error.message,
				});
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to delete project',
		});
	}
};

/**
 * Get project statistics
 */
export const getProjectStats = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Create service instance
		const projectService = new ProjectService(require('../config/database').default);

		// Get statistics
		const stats = await projectService.getProjectStats();

		logger.info(`✅ Project statistics retrieved: ${stats.total} total projects`);

		res.json({
			success: true,
			message: 'Project statistics retrieved successfully',
			data: stats,
		});
	} catch (error) {
		logger.error('❌ Get project stats controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve project statistics',
		});
	}
};

/**
 * Get project images
 */
export const getProjectImages = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Project ID is required',
			});
		}

		// Create service instance
		const projectService = new ProjectService(require('../config/database').default);

		// Get project with images
		const project = await projectService.getProjectById(id);

		if (!project) {
			return res.status(404).json({
				error: 'Not Found',
				message: 'Project not found',
			});
		}

		logger.info(`✅ Retrieved ${project.images.length} images for project: ${id}`);

		res.json({
			success: true,
			message: 'Project images retrieved successfully',
			data: project.images,
		});
	} catch (error) {
		logger.error('❌ Get project images controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve project images',
		});
	}
};
