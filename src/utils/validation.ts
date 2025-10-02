/**
 * Validation Utilities
 * Zod schemas untuk API validation
 */

import { z } from 'zod';
import { UserRole } from '../types/user';

/**
 * Common validation patterns
 */
export const commonValidations = {
	/**
	 * Email validation
	 */
	email: z
		.string()
		.email('Invalid email format')
		.min(1, 'Email is required')
		.max(255, 'Email must not exceed 255 characters'),

	/**
	 * Password validation
	 */
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters long')
		.max(100, 'Password must not exceed 100 characters')
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
			'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
		),

	/**
	 * Name validation
	 */
	name: z
		.string()
		.min(2, 'Name must be at least 2 characters long')
		.max(100, 'Name must not exceed 100 characters'),

	/**
	 * UUID validation
	 */
	uuid: z.string().uuid('Invalid ID format'),

	/**
	 * Pagination validation
	 */
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),

	/**
	 * Sort validation
	 */
	sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'email', 'title']).default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),

	/**
	 * Search validation
	 */
	search: z.string().max(100, 'Search term must not exceed 100 characters').optional(),

	/**
	 * Date validation
	 */
	date: z.string().datetime({ offset: true }).optional(),

	/**
	 * URL validation
	 */
	url: z.string().url('Invalid URL format').optional(),

	/**
	 * Tags validation
	 */
	tags: z.array(z.string().max(50, 'Tag must not exceed 50 characters')).optional(),
};

/**
 * Authentication validation schemas
 */
export const authSchemas = {
	/**
	 * Login validation
	 */
	login: z.object({
		email: commonValidations.email,
		password: z.string().min(1, 'Password is required'),
	}),

	/**
	 * Register validation
	 */
	register: z.object({
		email: commonValidations.email,
		name: commonValidations.name,
		password: commonValidations.password,
		role: z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]).default(UserRole.USER),
	}),

	/**
	 * Refresh token validation
	 */
	refreshToken: z.object({
		refreshToken: z.string().min(1, 'Refresh token is required'),
	}),

	/**
	 * Change password validation
	 */
	changePassword: z.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: commonValidations.password,
	}),

	/**
	 * Update profile validation
	 */
	updateProfile: z.object({
		name: commonValidations.name.optional(),
		email: commonValidations.email.optional(),
	}),
};

/**
 * User management validation schemas
 */
export const userSchemas = {
	/**
	 * Create user validation
	 */
	createUser: z.object({
		email: commonValidations.email,
		name: commonValidations.name,
		password: commonValidations.password,
		role: z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]).default(UserRole.USER),
	}),

	/**
	 * Update user validation
	 */
	updateUser: z.object({
		name: commonValidations.name.optional(),
		email: commonValidations.email.optional(),
		role: z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]).optional(),
		password: commonValidations.password.optional(),
	}),

	/**
	 * Get users validation
	 */
	getUsers: z.object({
		page: commonValidations.page,
		limit: commonValidations.limit,
		search: commonValidations.search,
		role: z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]).optional(),
		sortBy: commonValidations.sortBy,
		sortOrder: commonValidations.sortOrder,
	}),

	/**
	 * User ID validation
	 */
	userId: z.object({
		id: commonValidations.uuid,
	}),
};

/**
 * Project management validation schemas
 */
export const projectSchemas = {
	/**
	 * Create project validation
	 */
	createProject: z.object({
		title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters'),
		description: z.string().min(1, 'Description is required'),
		imageUrl: commonValidations.url.optional(),
		liveUrl: commonValidations.url.optional(),
		githubUrl: commonValidations.url.optional(),
		tags: commonValidations.tags,
	}),

	/**
	 * Update project validation
	 */
	updateProject: z.object({
		title: z
			.string()
			.min(1, 'Title is required')
			.max(255, 'Title must not exceed 255 characters')
			.optional(),
		description: z.string().min(1, 'Description is required').optional(),
		imageUrl: commonValidations.url.optional(),
		liveUrl: commonValidations.url.optional(),
		githubUrl: commonValidations.url.optional(),
		tags: commonValidations.tags.optional(),
	}),

	/**
	 * Get projects validation
	 */
	getProjects: z.object({
		page: commonValidations.page,
		limit: commonValidations.limit,
		search: commonValidations.search,
		tags: commonValidations.tags.optional(),
		sortBy: commonValidations.sortBy,
		sortOrder: commonValidations.sortOrder,
	}),

	/**
	 * Project ID validation
	 */
	projectId: z.object({
		id: commonValidations.uuid,
	}),
};

/**
 * File upload validation schemas
 */
export const uploadSchemas = {
	/**
	 * Upload options validation
	 */
	uploadOptions: z.object({
		folder: z.string().optional(),
		publicId: z.string().optional(),
		resourceType: z.enum(['image', 'auto']).default('image'),
	}),

	/**
	 * Delete file validation
	 */
	deleteFile: z.object({
		publicId: z.string().min(1, 'Public ID is required'),
	}),
};

/**
 * Activity logging validation schemas
 */
export const activitySchemas = {
	/**
	 * Get activity logs validation
	 */
	getActivityLogs: z.object({
		page: commonValidations.page,
		limit: commonValidations.limit,
		action: z.string().optional(),
		resourceType: z.string().optional(),
		resourceId: commonValidations.uuid.optional(),
		startDate: commonValidations.date,
		endDate: commonValidations.date,
	}),

	/**
	 * Activity statistics validation
	 */
	getActivityStats: z.object({
		startDate: commonValidations.date,
		endDate: commonValidations.date,
	}),

	/**
	 * User activity validation
	 */
	userActivity: z.object({
		targetUserId: commonValidations.uuid,
	}),
};

/**
 * API query validation schemas
 */
export const querySchemas = {
	/**
	 * Pagination validation
	 */
	pagination: z.object({
		page: commonValidations.page,
		limit: commonValidations.limit,
	}),

	/**
	 * Date range validation
	 */
	dateRange: z.object({
		startDate: commonValidations.date,
		endDate: commonValidations.date,
	}),
};

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
	success: z.literal(false),
	error: z.string(),
	message: z.string(),
});

/**
 * Success response schema
 */
export const successResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: z.any().optional(),
});

/**
 * Validation middleware factory
 */
export const validate = (schema: z.ZodObject<any>) => {
	return (req: any, res: any, next: any) => {
		try {
			schema.parse(req.body);
			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				const errorMessages = (error as any).issues.map((err: any) => ({
					field: err.path.join('.'),
					message: err.message,
				}));

				return res.status(400).json({
					success: false,
					error: 'Validation Error',
					message: 'Invalid input data',
					details: errorMessages,
				});
			}

			return res.status(500).json({
				success: false,
				error: 'Internal Server Error',
				message: 'Validation failed',
			});
		}
	};
};

/**
 * Query validation middleware factory
 */
export const validateQuery = (schema: z.ZodObject<any>) => {
	return (req: any, res: any, next: any) => {
		try {
			schema.parse(req.query);
			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				const errorMessages = (error as any).issues.map((err: any) => ({
					field: err.path.join('.'),
					message: err.message,
				}));

				return res.status(400).json({
					success: false,
					error: 'Validation Error',
					message: 'Invalid query parameters',
					details: errorMessages,
				});
			}

			return res.status(500).json({
				success: false,
				error: 'Internal Server Error',
				message: 'Query validation failed',
			});
		}
	};
};

/**
 * Params validation middleware factory
 */
export const validateParams = (schema: z.ZodObject<any>) => {
	return (req: any, res: any, next: any) => {
		try {
			schema.parse(req.params);
			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				const errorMessages = (error as any).issues.map((err: any) => ({
					field: err.path.join('.'),
					message: err.message,
				}));

				return res.status(400).json({
					success: false,
					error: 'Validation Error',
					message: 'Invalid URL parameters',
					details: errorMessages,
				});
			}

			return res.status(500).json({
				success: false,
				error: 'Internal Server Error',
				message: 'Parameter validation failed',
			});
		}
	};
};

// Export all schemas for use in other files
export default {
	authSchemas,
	userSchemas,
	projectSchemas,
	uploadSchemas,
	activitySchemas,
	querySchemas,
	commonValidations,
	validate,
	validateQuery,
	validateParams,
	errorResponseSchema,
	successResponseSchema,
};
