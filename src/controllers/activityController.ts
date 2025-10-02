/**
 * Activity Controller
 * HTTP request handlers untuk activity logging endpoints
 */

import { Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { activityLogger } from '../middleware/activityLogger';

/**
 * Get activity logs dengan filtering dan pagination
 */
export const getActivityLogs = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
		}

		// Parse query parameters
		const { action, resourceType, resourceId, page, limit, startDate, endDate } = req.query;

		// Build filters object
		const filters: any = {};

		// Super admin can see all logs, regular users can only see their own logs
		if (req.user && req.user.role !== 'super_admin') {
			filters.userId = userId;
		}

		if (action) {
			filters.action = action as string;
		}

		if (resourceType) {
			filters.resourceType = resourceType as string;
		}

		if (resourceId) {
			filters.resourceId = resourceId as string;
		}

		if (page) {
			filters.page = parseInt(page as string);
		}

		if (limit) {
			filters.limit = parseInt(limit as string);
		}

		if (startDate) {
			filters.startDate = new Date(startDate as string);
		}

		if (endDate) {
			filters.endDate = new Date(endDate as string);
		}

		// Get activity logs
		const result = await activityLogger.getActivityLogs(filters);

		logger.info(`✅ Retrieved ${result.logs.length} activity logs for user ${userId}`);

		res.json({
			success: true,
			message: 'Activity logs retrieved successfully',
			data: result,
		});
	} catch (error) {
		logger.error('❌ Get activity logs controller error:', error);

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
			message: 'Failed to retrieve activity logs',
		});
	}
};

/**
 * Get activity statistics
 */
export const getActivityStats = async (
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

		// Parse query parameters
		const { startDate, endDate } = req.query;

		// Build filters object
		const filters: any = {};

		// Super admin can see all stats, regular users can only see their own stats
		if (req.user && req.user.role !== 'super_admin') {
			filters.userId = userId;
		}

		if (startDate) {
			filters.startDate = new Date(startDate as string);
		}

		if (endDate) {
			filters.endDate = new Date(endDate as string);
		}

		// Get activity statistics
		const stats = await activityLogger.getActivityStats(filters);

		logger.info(`✅ Retrieved activity statistics for user ${userId}`);

		res.json({
			success: true,
			message: 'Activity statistics retrieved successfully',
			data: stats,
		});
	} catch (error) {
		logger.error('❌ Get activity stats controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve activity statistics',
		});
	}
};

/**
 * Get user activity logs (super admin only)
 */
export const getUserActivityLogs = async (
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

		// Check if user is super admin
		if (!req.user || req.user.role !== 'super_admin') {
			return res.status(403).json({
				error: 'Forbidden',
				message: 'Only super admin can access user activity logs',
			});
		}

		// Get target user ID from request parameters
		const { targetUserId } = req.params;

		if (!targetUserId) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Target user ID is required',
			});
		}

		// Parse query parameters
		const { action, resourceType, resourceId, page, limit, startDate, endDate } = req.query;

		// Build filters object
		const filters: any = {
			userId: targetUserId,
		};

		if (action) {
			filters.action = action as string;
		}

		if (resourceType) {
			filters.resourceType = resourceType as string;
		}

		if (resourceId) {
			filters.resourceId = resourceId as string;
		}

		if (page) {
			filters.page = parseInt(page as string);
		}

		if (limit) {
			filters.limit = parseInt(limit as string);
		}

		if (startDate) {
			filters.startDate = new Date(startDate as string);
		}

		if (endDate) {
			filters.endDate = new Date(endDate as string);
		}

		// Get activity logs
		const result = await activityLogger.getActivityLogs(filters);

		logger.info(
			`✅ Retrieved ${result.logs.length} activity logs for user ${targetUserId} by super admin ${userId}`
		);

		res.json({
			success: true,
			message: 'User activity logs retrieved successfully',
			data: result,
		});
	} catch (error) {
		logger.error('❌ Get user activity logs controller error:', error);

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
			message: 'Failed to retrieve user activity logs',
		});
	}
};

/**
 * Get user activity statistics (super admin only)
 */
export const getUserActivityStats = async (
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

		// Check if user is super admin
		if (!req.user || req.user.role !== 'super_admin') {
			return res.status(403).json({
				error: 'Forbidden',
				message: 'Only super admin can access user activity statistics',
			});
		}

		// Get target user ID from request parameters
		const { targetUserId } = req.params;

		if (!targetUserId) {
			return res.status(400).json({
				error: 'Bad Request',
				message: 'Target user ID is required',
			});
		}

		// Parse query parameters
		const { startDate, endDate } = req.query;

		// Build filters object
		const filters: any = {
			userId: targetUserId,
		};

		if (startDate) {
			filters.startDate = new Date(startDate as string);
		}

		if (endDate) {
			filters.endDate = new Date(endDate as string);
		}

		// Get activity statistics
		const stats = await activityLogger.getActivityStats(filters);

		logger.info(
			`✅ Retrieved activity statistics for user ${targetUserId} by super admin ${userId}`
		);

		res.json({
			success: true,
			message: 'User activity statistics retrieved successfully',
			data: stats,
		});
	} catch (error) {
		logger.error('❌ Get user activity stats controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve user activity statistics',
		});
	}
};

/**
 * Export activity logs (super admin only)
 */
export const exportActivityLogs = async (
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

		// Check if user is super admin
		if (!req.user || req.user.role !== 'super_admin') {
			return res.status(403).json({
				error: 'Forbidden',
				message: 'Only super admin can export activity logs',
			});
		}

		// Parse query parameters
		const { action, resourceType, resourceId, startDate, endDate, format = 'json' } = req.query;

		// Build filters object
		const filters: any = {};

		if (action) {
			filters.action = action as string;
		}

		if (resourceType) {
			filters.resourceType = resourceType as string;
		}

		if (resourceId) {
			filters.resourceId = resourceId as string;
		}

		if (startDate) {
			filters.startDate = new Date(startDate as string);
		}

		if (endDate) {
			filters.endDate = new Date(endDate as string);
		}

		// Set high limit for export
		filters.limit = 10000;

		// Get activity logs
		const result = await activityLogger.getActivityLogs(filters);

		logger.info(`✅ Exported ${result.logs.length} activity logs by super admin ${userId}`);

		// Set appropriate headers for download
		const filename = `activity-logs-${new Date().toISOString().split('T')[0]}.${format}`;

		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

		res.send(JSON.stringify(result, null, 2));
	} catch (error) {
		logger.error('❌ Export activity logs controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to export activity logs',
		});
	}
};
