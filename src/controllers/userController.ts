/**
 * User Controller
 * HTTP request handlers untuk user management endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserService } from '../services/userService';
import { CreateUserRequest, UpdateUserRequest, UserQuery } from '../types/user';

/**
 * Get all users dengan pagination dan filtering (super admin only)
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

		// Check if user is super admin
		if (!req.user || req.user.role !== 'super_admin') {
			res.status(403).json({
				error: 'Forbidden',
				message: 'Only super admin can access user management',
			});
			return;
		}

		// Parse query parameters
		const { page, limit, search, role, sortBy, sortOrder } = req.query;

		// Build query object
		const query: UserQuery = {};

		if (page) {
			query.page = parseInt(page as string);
		}

		if (limit) {
			query.limit = parseInt(limit as string);
		}

		if (search) {
			query.search = search as string;
		}

		if (role) {
			query.role = role as string;
		}

		if (sortBy) {
			query.sortBy = sortBy as 'createdAt' | 'updatedAt' | 'name' | 'email';
		}

		if (sortOrder) {
			query.sortOrder = sortOrder as 'asc' | 'desc';
		}

		// Create service instance
		const userService = new UserService();

		// Get users
		const result = await userService.getUsers(query);

		logger.info(`✅ Retrieved ${result.users.length} users by super admin ${userId}`);

		res.json({
			success: true,
			message: 'Users retrieved successfully',
			data: result,
		});
	} catch (error) {
		logger.error('❌ Get users controller error:', error);

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
			message: 'Failed to retrieve users',
		});
	}
};

/**
 * Get single user by ID
 */
export const getUserById = async (
	req: AuthenticatedRequest,
	res: Response,
	_next: NextFunction
) => {
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

		// Users can only get their own profile unless they are super admin
		if (userId !== id && (!req.user || req.user.role !== 'super_admin')) {
			res.status(403).json({
				error: 'Forbidden',
				message: 'You can only access your own profile',
			});
			return;
		}

		// Create service instance
		const userService = new UserService();

		// Get user
		const user = await userService.getUserById(id);

		if (!user) {
			res.status(404).json({
				error: 'Not Found',
				message: 'User not found',
			});
			return;
		}

		// Remove password hash from response
		const { passwordHash: _, ...userWithoutPassword } = user as any;

		logger.info(`✅ Retrieved user: ${user.email} by ${userId}`);

		res.json({
			success: true,
			message: 'User retrieved successfully',
			data: userWithoutPassword,
		});
	} catch (error) {
		logger.error('❌ Get user by ID controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve user',
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

		// Check if user is super admin
		if (!req.user || req.user.role !== 'super_admin') {
			res.status(403).json({
				error: 'Forbidden',
				message: 'Only super admin can create users',
			});
			return;
		}

		const data: CreateUserRequest = req.body;

		// Validate input
		if (!data.email || !data.name || !data.password) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Email, name, and password are required',
			});
			return;
		}

		// Create service instance
		const userService = new UserService();

		// Create user
		const newUser = await userService.createUser(data, userId);

		logger.info(`✅ New user created: ${newUser.email} by super admin ${userId}`);

		res.status(201).json({
			success: true,
			message: 'User created successfully',
			data: newUser,
		});
	} catch (error) {
		logger.error('❌ Create user controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('required') || error.message.includes('already exists')) {
				res.status(400).json({
					error: 'Bad Request',
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
 * Update user
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

		// Users can only update their own profile unless they are super admin
		if (userId !== id && (!req.user || req.user.role !== 'super_admin')) {
			res.status(403).json({
				error: 'Forbidden',
				message: 'You can only update your own profile',
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

		// Regular users cannot change their role
		if (userId !== id && (!req.user || req.user.role !== 'super_admin') && data.role) {
			res.status(403).json({
				error: 'Forbidden',
				message: 'You cannot change your role',
			});
			return;
		}

		// Create service instance
		const userService = new UserService();

		// Update user
		const updatedUser = await userService.updateUser(id, data, userId);

		logger.info(`✅ User updated: ${updatedUser.email} by ${userId}`);

		res.json({
			success: true,
			message: 'User updated successfully',
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
			if (error.message.includes('required') || error.message.includes('already exists')) {
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

		if (!userId) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
			return;
		}

		// Check if user is super admin
		if (!req.user || req.user.role !== 'super_admin') {
			res.status(403).json({
				error: 'Forbidden',
				message: 'Only super admin can delete users',
			});
			return;
		}

		const { id } = req.params;

		if (!id) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'User ID is required',
			});
			return;
		}

		// Prevent super admin from deleting themselves
		if (userId === id) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'You cannot delete your own account',
			});
			return;
		}

		// Create service instance
		const userService = new UserService();

		// Delete user
		await userService.deleteUser(id, userId);

		logger.info(`✅ User deleted: ${id} by super admin ${userId}`);

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
 * Get user statistics (super admin only)
 */
export const getUserStats = async (
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

		// Check if user is super admin
		if (!req.user || req.user.role !== 'super_admin') {
			res.status(403).json({
				error: 'Forbidden',
				message: 'Only super admin can access user statistics',
			});
			return;
		}

		// Create service instance
		const userService = new UserService();

		// Get user statistics
		const stats = await userService.getUserStats();

		logger.info(`✅ User statistics retrieved by super admin ${userId}`);

		res.json({
			success: true,
			message: 'User statistics retrieved successfully',
			data: stats,
		});
	} catch (error) {
		logger.error('❌ Get user stats controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve user statistics',
		});
	}
};

/**
 * Change user password
 */
export const changePassword = async (
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

		const { currentPassword, newPassword } = req.body;

		if (!currentPassword || !newPassword) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Current password and new password are required',
			});
			return;
		}

		// Create service instance
		const userService = new UserService();

		// Change password
		await userService.changePassword(userId, currentPassword, newPassword);

		logger.info(`✅ Password changed for user: ${userId}`);

		res.json({
			success: true,
			message: 'Password changed successfully',
		});
	} catch (error) {
		logger.error('❌ Change password controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('not found')) {
				res.status(404).json({
					error: 'Not Found',
					message: error.message,
				});
				return;
			}
			if (error.message.includes('incorrect')) {
				res.status(400).json({
					error: 'Bad Request',
					message: error.message,
				});
				return;
			}
			if (error.message.includes('required')) {
				res.status(400).json({
					error: 'Bad Request',
					message: error.message,
				});
				return;
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to change password',
		});
	}
};

/**
 * Get user profile
 */
export const getUserProfile = async (
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

		// Get user profile
		const profile = await userService.getUserProfile(userId);

		if (!profile) {
			res.status(404).json({
				error: 'Not Found',
				message: 'User profile not found',
			});
			return;
		}

		logger.info(`✅ User profile retrieved: ${profile.email}`);

		res.json({
			success: true,
			message: 'User profile retrieved successfully',
			data: profile,
		});
	} catch (error) {
		logger.error('❌ Get user profile controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve user profile',
		});
	}
};

/**
 * Get user validation rules
 */
export const getUserValidationRules = async (
	_req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		// Create service instance
		const userService = new UserService();

		// Get validation rules
		const rules = userService.getValidationRules();

		logger.info('✅ User validation rules retrieved');

		res.json({
			success: true,
			message: 'User validation rules retrieved successfully',
			data: rules,
		});
	} catch (error) {
		logger.error('❌ Get user validation rules controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve user validation rules',
		});
	}
};
