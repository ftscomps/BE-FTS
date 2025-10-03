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
export const getProjects = async (
	req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
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
		const projectService = new ProjectService();

		// Get projects
		const result = await projectService.getProjects(query);

		logger.info(`✅ Retrieved ${result.projects.length} projects`);

		// Return only the projects array for frontend compatibility
		res.json({
			success: true,
			data: result.projects,
		});
	} catch (error) {
		logger.error('❌ Get projects controller error:', error);

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
			message: 'Failed to retrieve projects',
		});
	}
};

/**
 * Get single project by ID
 */
export const getProjectById = async (
	req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const { id } = req.params;

		if (!id) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Project ID is required',
			});
			return;
		}

		// Create service instance
		const projectService = new ProjectService();

		// Get project
		const project = await projectService.getProjectById(id);

		if (!project) {
			res.status(404).json({
				error: 'Not Found',
				message: 'Project not found',
			});
			return;
		}

		logger.info(`✅ Retrieved project: ${project.title}`);

		res.json({
			success: true,
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

		const data: CreateProjectRequest = req.body;

		// Validate input
		if (!data.title || !data.description || !data.tags) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Title, description, and tags are required',
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
		const projectService = new ProjectService();

		// Create project
		const newProject = await projectService.createProject(data, userId);

		logger.info(`✅ New project created: ${newProject.title} by ${userId}`);

		res.status(201).json({
			success: true,
			data: newProject,
		});
	} catch (error) {
		logger.error('❌ Create project controller error:', error);

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
				message: 'Project ID is required',
			});
			return;
		}

		const data: UpdateProjectRequest = req.body;

		// Validate that at least one field is provided
		if (Object.keys(data).length === 0) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'At least one field must be provided for update',
			});
			return;
		}

		// Create service instance
		const projectService = new ProjectService();

		// Update project
		const updatedProject = await projectService.updateProject(id, data, userId);

		logger.info(`✅ Project updated: ${updatedProject.title} by ${userId}`);

		res.json({
			success: true,
			data: updatedProject,
		});
	} catch (error) {
		logger.error('❌ Update project controller error:', error);

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
				message: 'Project ID is required',
			});
			return;
		}

		// Create service instance
		const projectService = new ProjectService();

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
				res.status(404).json({
					error: 'Not Found',
					message: error.message,
				});
				return;
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
export const getProjectStats = async (
	_req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		// Create service instance
		const projectService = new ProjectService();

		// Get statistics
		const stats = await projectService.getProjectStats();

		logger.info(`✅ Project statistics retrieved: ${stats.total} total projects`);

		res.json({
			success: true,
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
export const getProjectImages = async (
	req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const { id } = req.params;

		if (!id) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Project ID is required',
			});
			return;
		}

		// Create service instance
		const projectService = new ProjectService();

		// Get project with images
		const project = await projectService.getProjectById(id);

		if (!project) {
			res.status(404).json({
				error: 'Not Found',
				message: 'Project not found',
			});
			return;
		}

		logger.info(`✅ Retrieved ${project.images.length} images for project: ${id}`);

		res.json({
			success: true,
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
