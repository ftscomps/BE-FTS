/**
 * Activity Logging Middleware
 * Middleware untuk logging semua user activities ke database
 */

import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from './auth';

/**
 * Activity Log Data Interface
 */
interface ActivityLogData {
	userId: string;
	action: string;
	resourceType: string;
	resourceId?: string;
	details?: any;
	ipAddress?: string;
	userAgent?: string;
}

/**
 * Activity Logger Middleware Class
 */
export class ActivityLoggerMiddleware {
	private prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	/**
	 * Log activity to database
	 */
	private async logActivity(data: ActivityLogData): Promise<void> {
		try {
			await this.prisma.activityLog.create({
				data: {
					userId: data.userId,
					action: data.action,
					resourceType: data.resourceType,
					resourceId: data.resourceId,
					details: data.details || {},
					ipAddress: data.ipAddress || '127.0.0.1',
					userAgent: data.userAgent || 'Unknown',
				},
			});
		} catch (error) {
			logger.error('❌ Failed to log activity:', error);
		}
	}

	/**
	 * Extract user information from request
	 */
	private extractUserInfo(req: AuthenticatedRequest): {
		userId?: string;
		ipAddress?: string;
		userAgent?: string;
	} {
		const userId = req.user?.id;
		const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
		const userAgent = req.get('User-Agent') || 'Unknown';

		const result: {
			userId?: string;
			ipAddress?: string;
			userAgent?: string;
		} = {
			ipAddress,
			userAgent,
		};

		if (userId) {
			result.userId = userId;
		}

		return result;
	}

	/**
	 * Create activity logging middleware
	 */
	createLogger(action: string, resourceType: string) {
		return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
			// Only log if user is authenticated
			if (!req.user) {
				return next();
			}

			// Extract user information
			const { userId, ipAddress, userAgent } = this.extractUserInfo(req);

			if (!userId) {
				return next();
			}

			// Extract resource ID from request parameters
			const resourceId = req.params['id'] || req.body.id || req.params['projectId'];

			// Extract relevant details from request
			const details = this.extractDetails(req, action, resourceType);

			// Log activity
			const logData: ActivityLogData = {
				userId,
				action,
				resourceType,
				details,
			};

			if (resourceId) {
				logData.resourceId = resourceId;
			}

			if (ipAddress) {
				logData.ipAddress = ipAddress;
			}

			if (userAgent) {
				logData.userAgent = userAgent;
			}

			await this.logActivity(logData);

			// Continue to next middleware
			next();
		};
	}

	/**
	 * Extract relevant details from request based on action and resource type
	 */
	private extractDetails(req: AuthenticatedRequest, action: string, resourceType: string): any {
		const details: any = {
			method: req.method,
			url: req.originalUrl,
			timestamp: new Date().toISOString(),
		};

		// Add specific details based on resource type and action
		switch (resourceType) {
			case 'project':
				return this.extractProjectDetails(req, action, details);
			case 'user':
				return this.extractUserDetails(req, action, details);
			case 'auth':
				return this.extractAuthDetails(req, action, details);
			case 'upload':
				return this.extractUploadDetails(req, action, details);
			default:
				return details;
		}
	}

	/**
	 * Extract project-specific details
	 */
	private extractProjectDetails(req: AuthenticatedRequest, action: string, details: any): any {
		switch (action) {
			case 'CREATE':
				details.projectData = {
					title: req.body.title,
					tags: req.body.tags,
				};
				break;
			case 'UPDATE':
				details.projectData = {
					title: req.body.title,
					updatedFields: Object.keys(req.body),
				};
				break;
			case 'DELETE':
				details.projectData = {
					deletedProjectId: req.params['id'],
				};
				break;
		}

		return details;
	}

	/**
	 * Extract user-specific details
	 */
	private extractUserDetails(req: AuthenticatedRequest, action: string, details: any): any {
		switch (action) {
			case 'CREATE':
				details.userData = {
					email: req.body.email,
					role: req.body.role,
				};
				break;
			case 'UPDATE':
				details.userData = {
					updatedUserId: req.params['id'],
					updatedFields: Object.keys(req.body),
				};
				break;
			case 'DELETE':
				details.userData = {
					deletedUserId: req.params['id'],
				};
				break;
		}

		return details;
	}

	/**
	 * Extract authentication-specific details
	 */
	private extractAuthDetails(req: AuthenticatedRequest, action: string, details: any): any {
		switch (action) {
			case 'LOGIN':
				details.authData = {
					email: req.body.email,
					loginSuccess: true,
				};
				break;
			case 'LOGOUT':
				details.authData = {
					logoutSuccess: true,
				};
				break;
			case 'REGISTER':
				details.authData = {
					email: req.body.email,
					role: req.body.role,
				};
				break;
		}

		return details;
	}

	/**
	 * Extract upload-specific details
	 */
	private extractUploadDetails(req: AuthenticatedRequest, action: string, details: any): any {
		if (req.file) {
			details.uploadData = {
				filename: req.file.filename,
				originalName: req.file.originalname,
				size: req.file.size,
				mimeType: req.file.mimetype,
			};
		}

		if (req.files && Array.isArray(req.files)) {
			details.uploadData = {
				files: req.files.map((file: any) => ({
					filename: file.filename,
					originalName: file.originalname,
					size: file.size,
					mimeType: file.mimetype,
				})),
				totalFiles: req.files.length,
			};
		}

		return details;
	}

	/**
	 * Get activity logs with filtering and pagination
	 */
	async getActivityLogs(
		filters: {
			userId?: string;
			action?: string;
			resourceType?: string;
			resourceId?: string;
			page?: number;
			limit?: number;
			startDate?: Date;
			endDate?: Date;
		} = {}
	) {
		try {
			const {
				userId,
				action,
				resourceType,
				resourceId,
				page = 1,
				limit = 50,
				startDate,
				endDate,
			} = filters;

			const skip = (page - 1) * limit;

			// Build where clause
			const where: any = {};

			if (userId) {
				where.userId = userId;
			}

			if (action) {
				where.action = action;
			}

			if (resourceType) {
				where.resourceType = resourceType;
			}

			if (resourceId) {
				where.resourceId = resourceId;
			}

			if (startDate || endDate) {
				where.createdAt = {};
				if (startDate) {
					where.createdAt.gte = startDate;
				}
				if (endDate) {
					where.createdAt.lte = endDate;
				}
			}

			// Get total count
			const total = await this.prisma.activityLog.count({ where });

			// Get logs
			const logs = await this.prisma.activityLog.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
				},
			});

			const totalPages = Math.ceil(total / limit);

			return {
				logs,
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
			logger.error('❌ Failed to get activity logs:', error);
			throw error;
		}
	}

	/**
	 * Get activity statistics
	 */
	async getActivityStats(
		filters: {
			userId?: string;
			startDate?: Date;
			endDate?: Date;
		} = {}
	) {
		try {
			const { userId, startDate, endDate } = filters;

			// Build where clause
			const where: any = {};

			if (userId) {
				where.userId = userId;
			}

			if (startDate || endDate) {
				where.createdAt = {};
				if (startDate) {
					where.createdAt.gte = startDate;
				}
				if (endDate) {
					where.createdAt.lte = endDate;
				}
			}

			// Get activity counts by action
			const actionCounts = await this.prisma.activityLog.groupBy({
				by: ['action'],
				where,
				_count: true,
			});

			// Get activity counts by resource type
			const resourceTypeCounts = await this.prisma.activityLog.groupBy({
				by: ['resourceType'],
				where,
				_count: true,
			});

			// Get total activities
			const totalActivities = await this.prisma.activityLog.count({ where });

			// Get recent activities
			const recentActivities = await this.prisma.activityLog.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				take: 10,
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
				},
			});

			return {
				totalActivities,
				actionCounts: actionCounts.map((item: any) => ({
					action: item.action,
					count: item._count,
				})),
				resourceTypeCounts: resourceTypeCounts.map((item: any) => ({
					resourceType: item.resourceType,
					count: item._count,
				})),
				recentActivities,
			};
		} catch (error) {
			logger.error('❌ Failed to get activity stats:', error);
			throw error;
		}
	}
}

// Export singleton instance
export const activityLogger = new ActivityLoggerMiddleware(require('../config/database').default);
export default activityLogger;
