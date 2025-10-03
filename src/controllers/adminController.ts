/**
 * Admin Controller
 * HTTP request handlers untuk admin management operations
 */

import { Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserService } from '../services/userService';
import { ProjectService } from '../services/projectService';
import { CreateUserRequest, UpdateUserRequest } from '../types/user';

/**
 * Get all users (super admin only)
 */
export const getUsers = async (
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

		// Create service instance
		const userService = new UserService();

		// Get all users
		const users = await userService.getAllUsers();

		logger.info(`✅ Retrieved ${users.length} users by admin: ${userId}`);

		res.json({
			success: true,
			data: users,
		});
	} catch (error) {
		logger.error('❌ Get users controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve users',
		});
	}
};

/**
 * Create new user (super admin only)
 */
export const createUser = async (
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

		const data: CreateUserRequest = req.body;

		// Validate input
		if (!data.name || !data.email || !data.password || !data.role) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Name, email, password, and role are required',
			});
			return;
		}

		// Create service instance
		const userService = new UserService();

		// Create user
		const newUser = await userService.createUser(data);

		logger.info(`✅ New user created: ${newUser.email} by admin: ${userId}`);

		res.status(201).json({
			success: true,
			data: newUser,
		});
	} catch (error) {
		logger.error('❌ Create user controller error:', error);

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
			message: 'Failed to create user',
		});
	}
};

/**
 * Update user (super admin only)
 */
export const updateUser = async (
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
				message: 'User ID is required',
			});
			return;
		}

		const data: UpdateUserRequest = req.body;

		// Validate that at least one field is provided
		if (Object.keys(data).length === 0) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'At least one field must be provided for update',
			});
			return;
		}

		// Create service instance
		const userService = new UserService();

		// Update user
		const updatedUser = await userService.updateUser(id, data);

		logger.info(`✅ User updated: ${updatedUser.email} by admin: ${userId}`);

		res.json({
			success: true,
			data: updatedUser,
		});
	} catch (error) {
		logger.error('❌ Update user controller error:', error);

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
			message: 'Failed to update user',
		});
	}
};

/**
 * Delete user (super admin only)
 */
export const deleteUser = async (
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
				message: 'User ID is required',
			});
			return;
		}

		// Create service instance
		const userService = new UserService();

		// Delete user
		await userService.deleteUser(id);

		logger.info(`✅ User deleted: ${id} by admin: ${userId}`);

		res.json({
			success: true,
			message: 'User deleted successfully',
		});
	} catch (error) {
		logger.error('❌ Delete user controller error:', error);

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
			message: 'Failed to delete user',
		});
	}
};

/**
 * Get activity logs (super admin only)
 */
export const getActivityLogs = async (
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
		const page = parseInt(req.query['page'] as string) || 1;
		const limit = parseInt(req.query['limit'] as string) || 50;
		const action = req.query['action'] as string;
		const resourceType = req.query['resourceType'] as string;

		// Create service instance
		const userService = new UserService();

		// Get activity logs
		const logs = await userService.getActivityLogs({
			page,
			limit,
			action,
			resourceType,
		});

		logger.info(`✅ Retrieved ${logs.logs.length} activity logs by admin: ${userId}`);

		res.json({
			success: true,
			data: logs.logs,
		});
	} catch (error) {
		logger.error('❌ Get activity logs controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve activity logs',
		});
	}
};

/**
 * Get dashboard statistics (super admin only)
 */
export const getDashboardStats = async (
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

		// Create service instances
		const projectService = new ProjectService();
		const userService = new UserService();

		// Get statistics in parallel
		const [projectStats, userStats, recentActivity] = await Promise.all([
			projectService.getProjectStats(),
			userService.getUserStats(),
			userService.getRecentActivity(),
		]);

		const dashboardStats = {
			totalProjects: projectStats.total,
			totalUsers: userStats.total,
			totalTags: Object.keys(projectStats.byTags).length,
			recentProjects: projectStats.recentProjects.length,
			recentActivity: recentActivity.length,
		};

		logger.info(`✅ Dashboard stats retrieved by admin: ${userId}`);

		res.json({
			success: true,
			data: dashboardStats,
		});
	} catch (error) {
		logger.error('❌ Get dashboard stats controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve dashboard statistics',
		});
	}
};
