/**
 * Authentication Middleware
 * JWT token validation dan user authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { JwtPayload, AuthMiddlewareOptions } from '../types/auth';

/**
 * Extended Request interface dengan user data
 */
export interface AuthenticatedRequest extends Request {
	user?: JwtPayload;
}

/**
 * Authentication middleware factory
 */
export const authenticate = (options: AuthMiddlewareOptions = {}) => {
	return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			// Get token from Authorization header
			const authHeader = req.headers.authorization;
			const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

			// If no token and authentication is optional, continue
			if (!token) {
				if (options.optional) {
					return next();
				}
				return res.status(401).json({
					error: 'Unauthorized',
					message: 'Access token is required',
				});
			}

			// Verify token
			const authService = new AuthService(prisma as any);
			const user = authService.verifyAccessToken(token);

			// Check role-based access if roles are specified
			if (options.roles && options.roles.length > 0) {
				if (!user.role || !options.roles.includes(user.role)) {
					return res.status(403).json({
						error: 'Forbidden',
						message: 'Insufficient permissions',
					});
				}
			}

			// Attach user to request object
			req.user = user;

			// Log authentication activity
			logger.http(
				`Authenticated user: ${user.email} (${user.role}) accessing ${req.method} ${req.originalUrl}`
			);

			next();
		} catch (error) {
			logger.error('❌ Authentication error:', error);

			if (options.optional) {
				return next();
			}

			return res.status(401).json({
				error: 'Unauthorized',
				message: 'Invalid or expired access token',
			});
		}
	};
};

/**
 * Middleware untuk require authentication
 */
export const requireAuth = authenticate({ optional: false });

/**
 * Middleware untuk optional authentication
 */
export const optionalAuth = authenticate({ optional: true });

/**
 * Middleware untuk require specific role
 */
export const requireRole = (roles: string | string[]) => {
	const roleArray = Array.isArray(roles) ? roles : [roles];
	return authenticate({ optional: false, roles: roleArray });
};

/**
 * Middleware untuk require admin role
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Middleware untuk require super admin role
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Get current user from request
 */
export const getCurrentUser = (req: AuthenticatedRequest): JwtPayload | null => {
	return req.user || null;
};

/**
 * Check if user has specific role
 */
export const hasRole = (req: AuthenticatedRequest, role: string): boolean => {
	const user = getCurrentUser(req);
	return user ? user.role === role : false;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (req: AuthenticatedRequest, roles: string[]): boolean => {
	const user = getCurrentUser(req);
	return user ? roles.includes(user.role) : false;
};

/**
 * Check if user is the owner of the resource or admin
 */
export const isOwnerOrAdmin = (req: AuthenticatedRequest, resourceUserId: string): boolean => {
	const user = getCurrentUser(req);
	if (!user) return false;

	return user.id === resourceUserId || ['admin', 'super_admin'].includes(user.role);
};
