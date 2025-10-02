/**
 * User Management Types
 * Type definitions untuk user management operations
 */

/**
 * User data yang ada di database
 */
export interface User {
	id: string;
	email: string;
	name: string;
	role: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * User dengan relasi ke projects
 */
export interface UserWithProjects extends User {
	projects: {
		id: string;
		title: string;
		description: string;
		imageUrl?: string;
		liveUrl?: string;
		githubUrl?: string;
		tags: string[];
		createdAt: Date;
		updatedAt: Date;
	}[];
	_count: {
		projects: number;
	};
}

/**
 * User dengan informasi tambahan
 */
export interface UserWithUser extends User {
	projectsCount?: number;
	lastLoginAt?: Date;
}

/**
 * Create user request body
 */
export interface CreateUserRequest {
	email: string;
	name: string;
	password: string;
	role?: string;
}

/**
 * Update user request body
 */
export interface UpdateUserRequest {
	name?: string;
	email?: string;
	role?: string;
	password?: string;
}

/**
 * User query parameters untuk filtering dan pagination
 */
export interface UserQuery {
	page?: number;
	limit?: number;
	search?: string;
	role?: string;
	sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'email';
	sortOrder?: 'asc' | 'desc';
}

/**
 * User list response dengan pagination
 */
export interface UserListResponse {
	users: UserWithUser[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

/**
 * User statistics
 */
export interface UserStats {
	total: number;
	byRole: Record<string, number>;
	recentUsers: UserWithUser[];
	activeUsers: number;
	inactiveUsers: number;
}

/**
 * User dengan activity logs
 */
export interface UserWithActivity extends User {
	activityLogs: {
		id: string;
		action: string;
		resourceType: string;
		resourceId?: string;
		details: any;
		ipAddress?: string;
		userAgent?: string;
		createdAt: Date;
	}[];
}

/**
 * User validation rules
 */
export interface UserValidationRules {
	email: {
		required: boolean;
		maxLength: number;
		pattern: RegExp;
	};
	name: {
		minLength: number;
		maxLength: number;
		required: boolean;
	};
	password: {
		minLength: number;
		maxLength: number;
		required: boolean;
		pattern: RegExp;
	};
	role: {
		required: boolean;
		allowedValues: string[];
	};
}

/**
 * User role enum
 */
export enum UserRole {
	SUPER_ADMIN = 'super_admin',
	ADMIN = 'admin',
	USER = 'user',
}

/**
 * User status enum
 */
export enum UserStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	SUSPENDED = 'suspended',
}

/**
 * User profile response
 */
export interface UserProfileResponse {
	id: string;
	email: string;
	name: string;
	role: string;
	createdAt: Date;
	updatedAt: Date;
	projectsCount: number;
	lastLoginAt?: Date;
}

/**
 * User activity summary
 */
export interface UserActivitySummary {
	totalActivities: number;
	activitiesByAction: Record<string, number>;
	activitiesByResource: Record<string, number>;
	recentActivities: any[];
}
