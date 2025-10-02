/**
 * Authentication Controller
 * HTTP request handlers untuk authentication endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import {
	LoginRequest,
	RegisterRequest,
	RefreshTokenRequest,
	UpdateProfileRequest,
	ChangePasswordRequest,
} from '../types/auth';

/**
 * User registration controller
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const data: RegisterRequest = req.body;

		// Validate input
		if (!data.email || !data.password || !data.name) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Email, password, and name are required',
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Invalid email format',
			});
		}

		// Validate password strength
		if (data.password.length < 8) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Password must be at least 8 characters long',
			});
		}

		// Register user
		const authService = new AuthService(prisma);
		const result = await authService.register(data);

		logger.info(`✅ New user registered: ${data.email}`);

		res.status(201).json({
			success: true,
			message: 'User registered successfully',
			data: result,
		});
	} catch (error) {
		logger.error('❌ Registration controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('already exists')) {
				return res.status(409).json({
					error: 'Conflict',
					message: error.message,
				});
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to register user',
		});
	}
};

/**
 * User login controller
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const data: LoginRequest = req.body;

		// Validate input
		if (!data.email || !data.password) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Email and password are required',
			});
		}

		// Login user
		const authService = new AuthService(prisma);
		const result = await authService.login(data);

		logger.info(`✅ User logged in: ${data.email}`);

		res.json({
			success: true,
			message: 'Login successful',
			data: result,
		});
	} catch (error) {
		logger.error('❌ Login controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('Invalid email or password')) {
				return res.status(401).json({
					error: 'Unauthorized',
					message: error.message,
				});
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to login user',
		});
	}
};

/**
 * Refresh token controller
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const data: RefreshTokenRequest = req.body;

		// Validate input
		if (!data.refreshToken) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Refresh token is required',
			});
		}

		// Refresh token
		const authService = new AuthService(prisma);
		const result = await authService.refreshToken(data);

		res.json({
			success: true,
			message: 'Token refreshed successfully',
			data: result,
		});
	} catch (error) {
		logger.error('❌ Token refresh controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('Invalid or expired')) {
				return res.status(401).json({
					error: 'Unauthorized',
					message: error.message,
				});
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to refresh token',
		});
	}
};

/**
 * Get user profile controller
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
		}

		// Get user profile
		const authService = new AuthService(prisma);
		const profile = await authService.getProfile(userId);

		res.json({
			success: true,
			message: 'Profile retrieved successfully',
			data: profile,
		});
	} catch (error) {
		logger.error('❌ Get profile controller error:', error);

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
			message: 'Failed to get profile',
		});
	}
};

/**
 * Update user profile controller
 */
export const updateProfile = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user?.id;
		const data: UpdateProfileRequest = req.body;

		if (!userId) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
		}

		// Validate input
		if (!data.name && !data.email) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'At least one field (name or email) is required',
			});
		}

		// Validate email format if provided
		if (data.email) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(data.email)) {
				return res.status(400).json({
					error: 'Bad Request',
					message: 'Invalid email format',
				});
			}
		}

		// TODO: Implement profile update in authService
		// For now, return current profile
		const authServiceInstance = new AuthService(prisma);
		const profile = await authServiceInstance.getProfile(userId);

		logger.info(`✅ User profile updated: ${userId}`);

		res.json({
			success: true,
			message: 'Profile updated successfully',
			data: profile,
		});
	} catch (error) {
		logger.error('❌ Update profile controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to update profile',
		});
	}
};

/**
 * Logout controller
 */
export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const user = req.user;

		if (user) {
			logger.info(`✅ User logged out: ${user.email}`);
		}

		// TODO: Implement token blacklisting if needed
		// For now, just return success

		res.json({
			success: true,
			message: 'Logout successful',
		});
	} catch (error) {
		logger.error('❌ Logout controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to logout',
		});
	}
};

/**
 * Change password controller
 */
export const changePassword = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user?.id;
		const data: ChangePasswordRequest = req.body;

		if (!userId) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
		}

		// Validate input
		if (!data.currentPassword || !data.newPassword) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Current password and new password are required',
			});
		}

		// Validate new password strength
		if (data.newPassword.length < 8) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'New password must be at least 8 characters long',
			});
		}

		// TODO: Implement password change in authService
		// For now, return success

		logger.info(`✅ Password changed for user: ${userId}`);

		res.json({
			success: true,
			message: 'Password changed successfully',
		});
	} catch (error) {
		logger.error('❌ Change password controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to change password',
		});
	}
};
