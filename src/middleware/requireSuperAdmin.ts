/**
 * Require Super Admin Middleware
 * Middleware untuk memastikan hanya super admin yang bisa mengakses endpoint
 */

import { Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from './auth';

/**
 * Middleware untuk memastikan user adalah super admin
 */
export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		// Check if user is authenticated
		if (!req.user) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
		}

		// Check if user is super admin
		if (req.user.role !== 'super_admin') {
			logger.warn(
				`⚠️ Non-super admin user ${req.user.id} attempted to access super admin endpoint: ${req.originalUrl}`
			);

			return res.status(403).json({
				error: 'Forbidden',
				message: 'Only super admin can access this endpoint',
			});
		}

		// User is super admin, continue to next middleware
		logger.info(
			`✅ Super admin user ${req.user.id} accessed super admin endpoint: ${req.originalUrl}`
		);
		next();
	} catch (error) {
		logger.error('❌ Require super admin middleware error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to verify user permissions',
		});
	}
};

export default requireSuperAdmin;
