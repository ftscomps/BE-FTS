/**
 * User Service
 * Business logic untuk user management operations
 */

import { PrismaClient } from '@prisma/client';
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
	private prisma: PrismaClient;
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
			minLength: 8,
			maxLength: 100,
			required: true,
			pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
		},
		role: {
			required: true,
			allowedValues: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
		},
	};

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

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
					'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
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
			const existingUser = await this.prisma.user.findUnique({
				where: { email: data.email },
			});

			if (existingUser) {
				throw new Error('Email already exists');
			}

			// Hash password
			const hashedPassword = await this.hashPassword(data.password);

			// Create user
			const newUser = await this.prisma.user.create({
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
			const total = await this.prisma.user.count({ where });

			// Get users
			const users = await this.prisma.user.findMany({
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
	 * Get single user by ID
	 */
	async getUserById(id: string): Promise<UserWithProjects | null> {
		try {
			const user = await this.prisma.user.findUnique({
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
			const user = await this.prisma.user.findUnique({
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
			const existingUser = await this.prisma.user.findUnique({
				where: { id },
			});

			if (!existingUser) {
				throw new Error('User not found');
			}

			// Validate input
			this.validateUserData(data);

			// Check if email already exists (if email is being updated)
			if (data.email && data.email !== existingUser.email) {
				const emailExists = await this.prisma.user.findUnique({
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
			const updatedUser = await this.prisma.user.update({
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
			const existingUser = await this.prisma.user.findUnique({
				where: { id },
			});

			if (!existingUser) {
				throw new Error('User not found');
			}

			// Delete user (cascade delete will handle projects)
			await this.prisma.user.delete({
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
			const total = await this.prisma.user.count();

			const usersByRole = await this.prisma.user.groupBy({
				by: ['role'],
				_count: true,
			});

			const recentUsers = await this.prisma.user.findMany({
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
			const user = await this.prisma.user.findUnique({
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
			const user = await this.prisma.user.findUnique({
				where: { id },
			});

			if (!user) {
				return null;
			}

			const [totalActivities, activitiesByAction, activitiesByResource, recentActivities] =
				await Promise.all([
					// Total activities
					this.prisma.activityLog.count({
						where: { userId: id },
					}),

					// Activities by action
					this.prisma.activityLog.groupBy({
						by: ['action'],
						where: { userId: id },
						_count: true,
					}),

					// Activities by resource type
					this.prisma.activityLog.groupBy({
						by: ['resourceType'],
						where: { userId: id },
						_count: true,
					}),

					// Recent activities
					this.prisma.activityLog.findMany({
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
			const user = await this.prisma.user.findUnique({
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
			await this.prisma.user.update({
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
