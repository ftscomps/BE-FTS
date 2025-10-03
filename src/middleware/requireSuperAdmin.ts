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
export const requireSuperAdmin = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): void => {
	try {
		// Check if user is authenticated
		if (!req.user) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
			return;
		}

		// Check if user is super admin
		if (req.user.role !== 'super_admin') {
			logger.warn(
				`⚠️ Non-super admin user ${req.user.id} attempted to access super admin endpoint: ${req.originalUrl}`
			);

			res.status(403).json({
				error: 'Forbidden',
				message: 'Only super admin can access this endpoint',
			});
			return;
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

/**
 * Middleware untuk memastikan user adalah admin atau super admin
 */
export const requireAdmin = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): void => {
	try {
		// Check if user is authenticated
		if (!req.user) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
			return;
		}

		// Check if user is admin or super admin
		if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
			logger.warn(
				`⚠️ Non-admin user ${req.user.id} attempted to access admin endpoint: ${req.originalUrl}`
			);

			res.status(403).json({
				error: 'Forbidden',
				message: 'Only admin or super admin can access this endpoint',
			});
			return;
		}

		// User is admin or super admin, continue to next middleware
		logger.info(
			`✅ Admin user ${req.user.id} (${req.user.role}) accessed admin endpoint: ${req.originalUrl}`
		);
		next();
	} catch (error) {
		logger.error('❌ Require admin middleware error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to verify user permissions',
		});
	}
};

export default requireSuperAdmin;
