/**
 * User Service
 * Business logic untuk user management operations
 */

import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import {
	User,
	UserWithProjects,
	CreateUserRequest,
	UpdateUserRequest,
	UserQuery,
	UserListResponse,
	UserStats,
	UserProfileResponse,
	UserActivitySummary,
	UserRole,
	UserValidationRules,
} from '../types/user';

/**
 * User Service class
 */
export class UserService {
	private validationRules: UserValidationRules = {
		email: {
			required: true,
			maxLength: 255,
			pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		},
		name: {
			minLength: 2,
			maxLength: 100,
			required: true,
		},
		password: {
			minLength: 6,
			maxLength: 100,
			required: true,
			pattern: /^(?=.*[a-zA-Z0-9]).{6,}$/,
		},
		role: {
			required: true,
			allowedValues: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
		},
	};

	constructor() {}

	/**
	 * Validate user data
	 */
	private validateUserData(data: CreateUserRequest | UpdateUserRequest): void {
		// Validate email
		if (data.email !== undefined) {
			if (this.validationRules.email.required && !data.email) {
				throw new Error('Email is required');
			}
			if (data.email && data.email.length > this.validationRules.email.maxLength) {
				throw new Error(`Email must not exceed ${this.validationRules.email.maxLength} characters`);
			}
			if (data.email && !this.validationRules.email.pattern.test(data.email)) {
				throw new Error('Email must be a valid email address');
			}
		}

		// Validate name
		if (data.name !== undefined) {
			if (this.validationRules.name.required && !data.name) {
				throw new Error('Name is required');
			}
			if (data.name && data.name.length < this.validationRules.name.minLength) {
				throw new Error(
					`Name must be at least ${this.validationRules.name.minLength} characters long`
				);
			}
			if (data.name && data.name.length > this.validationRules.name.maxLength) {
				throw new Error(`Name must not exceed ${this.validationRules.name.maxLength} characters`);
			}
		}

		// Validate password
		if (data.password !== undefined) {
			if (this.validationRules.password.required && !data.password) {
				throw new Error('Password is required');
			}
			if (data.password && data.password.length < this.validationRules.password.minLength) {
				throw new Error(
					`Password must be at least ${this.validationRules.password.minLength} characters long`
				);
			}
			if (data.password && data.password.length > this.validationRules.password.maxLength) {
				throw new Error(
					`Password must not exceed ${this.validationRules.password.maxLength} characters`
				);
			}
			if (data.password && !this.validationRules.password.pattern.test(data.password)) {
				throw new Error(
					'Password must be at least 6 characters long and contain only letters and numbers'
				);
			}
		}

		// Validate role
		if (data.role !== undefined) {
			if (this.validationRules.role.required && !data.role) {
				throw new Error('Role is required');
			}
			if (data.role && !this.validationRules.role.allowedValues.includes(data.role)) {
				throw new Error(
					`Role must be one of: ${this.validationRules.role.allowedValues.join(', ')}`
				);
			}
		}
	}

	/**
	 * Hash password
	 */
	private async hashPassword(password: string): Promise<string> {
		const saltRounds = 12;
		return await bcrypt.hash(password, saltRounds);
	}

	/**
	 * Verify password
	 */
	private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	/**
	 * Create new user
	 */
	async createUser(data: CreateUserRequest, createdBy?: string): Promise<User> {
		try {
			// Validate input
			this.validateUserData(data);

			// Check if email already exists
			const existingUser = await (prisma as any).user.findUnique({
				where: { email: data.email },
			});

			if (existingUser) {
				throw new Error('Email already exists');
			}

			// Hash password
			const hashedPassword = await this.hashPassword(data.password);

			// Create user
			const newUser = await (prisma as any).user.create({
				data: {
					email: data.email,
					name: data.name,
					passwordHash: hashedPassword,
					role: data.role || UserRole.USER,
				},
			});

			// Remove password hash from response
			const { passwordHash, ...userWithoutPassword } = newUser;

			logger.info(`✅ New user created: ${newUser.email} by ${createdBy || 'system'}`);

			return userWithoutPassword;
		} catch (error) {
			logger.error('❌ Create user error:', error);
			throw error;
		}
	}

	/**
	 * Get all users dengan pagination dan filtering
	 */
	async getUsers(query: UserQuery = {}): Promise<UserListResponse> {
		try {
			const {
				page = 1,
				limit = 10,
				search,
				role,
				sortBy = 'createdAt',
				sortOrder = 'desc',
			} = query;

			const skip = (page - 1) * limit;

			// Build where clause
			const where: any = {};

			if (search) {
				where.OR = [
					{ name: { contains: search, mode: 'insensitive' } },
					{ email: { contains: search, mode: 'insensitive' } },
				];
			}

			if (role) {
				where.role = role;
			}

			// Get total count
			const total = await (prisma as any).user.count({ where });

			// Get users
			const users = await (prisma as any).user.findMany({
				where,
				include: {
					_count: {
						select: { projects: true },
					},
				},
				orderBy: { [sortBy]: sortOrder },
				skip,
				take: limit,
			});

			const totalPages = Math.ceil(total / limit);

			return {
				users: users as User[],
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
			logger.error('❌ Get users error:', error);
			throw error;
		}
	}

	/**
	 * Get all users (for admin)
	 */
	async getAllUsers(): Promise<User[]> {
		try {
			const users = await (prisma as any).user.findMany({
				include: {
					_count: {
						select: { projects: true },
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			// Transform users to match expected format
			return users.map((user: any) => ({
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
				lastLoginAt: user.lastLoginAt || null,
				isActive: true, // Assuming all users are active
				projectsCount: user._count.projects,
			}));
		} catch (error) {
			logger.error('❌ Get all users error:', error);
			throw error;
		}
	}

	/**
	 * Get activity logs (for admin)
	 */
	async getActivityLogs(options: {
		page: number;
		limit: number;
		action?: string;
		resourceType?: string;
	}): Promise<{ logs: any[] }> {
		try {
			const { page, limit, action, resourceType } = options;
			const skip = (page - 1) * limit;

			// Build where clause
			const where: any = {};
			if (action) where.action = action;
			if (resourceType) where.resourceType = resourceType;

			// Get activity logs with user information
			const logs = await (prisma as any).activityLog.findMany({
				where,
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			});

			// Transform logs to match expected format
			const transformedLogs = logs.map((log: any) => ({
				id: log.id,
				userId: log.userId,
				userName: log.user?.name || 'Unknown',
				userEmail: log.user?.email || 'unknown@example.com',
				action: log.action,
				resourceType: log.resourceType,
				resourceId: log.resourceId,
				resourceName: log.details?.title || 'Unknown',
				details: log.details,
				ipAddress: log.ipAddress,
				userAgent: log.userAgent,
				createdAt: log.createdAt,
			}));

			return { logs: transformedLogs };
		} catch (error) {
			logger.error('❌ Get activity logs error:', error);
			throw error;
		}
	}

	/**
	 * Get recent activity (for admin dashboard)
	 */
	async getRecentActivity(): Promise<any[]> {
		try {
			const recentActivities = await (prisma as any).activityLog.findMany({
				take: 15,
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			// Transform activities to match expected format
			return recentActivities.map((activity: any) => ({
				id: activity.id,
				userId: activity.userId,
				userName: activity.user?.name || 'Unknown',
				userEmail: activity.user?.email || 'unknown@example.com',
				action: activity.action,
				resourceType: activity.resourceType,
				resourceId: activity.resourceId,
				resourceName: activity.details?.title || 'Unknown',
				details: activity.details,
				ipAddress: activity.ipAddress,
				userAgent: activity.userAgent,
				createdAt: activity.createdAt,
			}));
		} catch (error) {
			logger.error('❌ Get recent activity error:', error);
			throw error;
		}
	}

	/**
	 * Get single user by ID
	 */
	async getUserById(id: string): Promise<UserWithProjects | null> {
		try {
			const user = await (prisma as any).user.findUnique({
				where: { id },
				include: {
					projects: true,
					_count: {
						select: { projects: true },
					},
				},
			});

			return user;
		} catch (error) {
			logger.error('❌ Get user by ID error:', error);
			throw error;
		}
	}

	/**
	 * Get user by email
	 */
	async getUserByEmail(email: string): Promise<User | null> {
		try {
			const user = await (prisma as any).user.findUnique({
				where: { email },
			});

			if (user) {
				const { passwordHash, ...userWithoutPassword } = user;
				return userWithoutPassword;
			}

			return null;
		} catch (error) {
			logger.error('❌ Get user by email error:', error);
			throw error;
		}
	}

	/**
	 * Update user
	 */
	async updateUser(id: string, data: UpdateUserRequest, updatedBy?: string): Promise<User> {
		try {
			// Check if user exists
			const existingUser = await (prisma as any).user.findUnique({
				where: { id },
			});

			if (!existingUser) {
				throw new Error('User not found');
			}

			// Validate input
			this.validateUserData(data);

			// Check if email already exists (if email is being updated)
			if (data.email && data.email !== existingUser.email) {
				const emailExists = await (prisma as any).user.findUnique({
					where: { email: data.email },
				});

				if (emailExists) {
					throw new Error('Email already exists');
				}
			}

			// Hash password if provided
			let updateData: any = { ...data };

			if (data.password) {
				updateData.passwordHash = await this.hashPassword(data.password);
				delete updateData.password;
			}

			// Update user
			const updatedUser = await (prisma as any).user.update({
				where: { id },
				data: updateData,
			});

			// Remove password hash from response
			const { passwordHash, ...userWithoutPassword } = updatedUser;

			logger.info(`✅ User updated: ${updatedUser.email} by ${updatedBy || 'system'}`);

			return userWithoutPassword;
		} catch (error) {
			logger.error('❌ Update user error:', error);
			throw error;
		}
	}

	/**
	 * Delete user
	 */
	async deleteUser(id: string, deletedBy?: string): Promise<void> {
		try {
			// Check if user exists
			const existingUser = await (prisma as any).user.findUnique({
				where: { id },
			});

			if (!existingUser) {
				throw new Error('User not found');
			}

			// Delete user (cascade delete will handle projects)
			await (prisma as any).user.delete({
				where: { id },
			});

			logger.info(`✅ User deleted: ${existingUser.email} by ${deletedBy || 'system'}`);
		} catch (error) {
			logger.error('❌ Delete user error:', error);
			throw error;
		}
	}

	/**
	 * Get user statistics
	 */
	async getUserStats(): Promise<UserStats> {
		try {
			// Get data sequentially to avoid Promise.all type issues
			const total = await (prisma as any).user.count();

			const usersByRole = await (prisma as any).user.groupBy({
				by: ['role'],
				_count: true,
			});

			const recentUsers = await (prisma as any).user.findMany({
				where: {
					createdAt: {
						gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
					},
				},
				take: 10,
				orderBy: { createdAt: 'desc' },
			});

			// Process role statistics
			const byRole: Record<string, number> = {};
			usersByRole.forEach((role: any) => {
				byRole[role.role] = role._count;
			});

			return {
				total,
				byRole,
				recentUsers: recentUsers || [],
				activeUsers: total, // Assuming all users are active
				inactiveUsers: 0, // No inactive status in current schema
			};
		} catch (error) {
			logger.error('❌ Get user stats error:', error);
			throw error;
		}
	}

	/**
	 * Get user profile
	 */
	async getUserProfile(id: string): Promise<UserProfileResponse | null> {
		try {
			const user = await (prisma as any).user.findUnique({
				where: { id },
				include: {
					_count: {
						select: { projects: true },
					},
				},
			});

			if (!user) {
				return null;
			}

			const { passwordHash, ...userWithoutPassword } = user;

			return {
				...userWithoutPassword,
				projectsCount: user._count.projects,
			};
		} catch (error) {
			logger.error('❌ Get user profile error:', error);
			throw error;
		}
	}

	/**
	 * Get user activity summary
	 */
	async getUserActivitySummary(id: string): Promise<UserActivitySummary | null> {
		try {
			const user = await (prisma as any).user.findUnique({
				where: { id },
			});

			if (!user) {
				return null;
			}

			const [totalActivities, activitiesByAction, activitiesByResource, recentActivities] =
				await Promise.all([
					// Total activities
					(prisma as any).activityLog.count({
						where: { userId: id },
					}),

					// Activities by action
					(prisma as any).activityLog.groupBy({
						by: ['action'],
						where: { userId: id },
						_count: true,
					}),

					// Activities by resource type
					(prisma as any).activityLog.groupBy({
						by: ['resourceType'],
						where: { userId: id },
						_count: true,
					}),

					// Recent activities
					(prisma as any).activityLog.findMany({
						where: { userId: id },
						take: 10,
						orderBy: { createdAt: 'desc' },
					}),
				]);

			// Process action statistics
			const activitiesByActionData: Record<string, number> = {};
			activitiesByAction.forEach((activity: any) => {
				activitiesByActionData[activity.action] = activity._count;
			});

			// Process resource statistics
			const activitiesByResourceData: Record<string, number> = {};
			activitiesByResource.forEach((resource: any) => {
				activitiesByResourceData[resource.resourceType] = resource._count;
			});

			return {
				totalActivities,
				activitiesByAction: activitiesByActionData,
				activitiesByResource: activitiesByResourceData,
				recentActivities,
			};
		} catch (error) {
			logger.error('❌ Get user activity summary error:', error);
			throw error;
		}
	}

	/**
	 * Change user password
	 */
	async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
		try {
			// Get user
			const user = await (prisma as any).user.findUnique({
				where: { id },
			});

			if (!user) {
				throw new Error('User not found');
			}

			// Verify current password
			const isPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
			if (!isPasswordValid) {
				throw new Error('Current password is incorrect');
			}

			// Validate new password
			this.validateUserData({ password: newPassword });

			// Hash new password
			const hashedNewPassword = await this.hashPassword(newPassword);

			// Update password
			await (prisma as any).user.update({
				where: { id },
				data: { passwordHash: hashedNewPassword },
			});

			logger.info(`✅ Password changed for user: ${user.email}`);
		} catch (error) {
			logger.error('❌ Change password error:', error);
			throw error;
		}
	}

	/**
	 * Get user validation rules
	 */
	getValidationRules(): UserValidationRules {
		return this.validationRules;
	}
}

// Export class for instantiation
// Class is already exported above
