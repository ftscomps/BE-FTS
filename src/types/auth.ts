/**
 * Authentication Types
 * Type definitions untuk JWT tokens dan authentication data
 */

/**
 * User data yang disimpan dalam JWT payload
 */
export interface JwtPayload {
	id: string;
	email: string;
	name: string;
	role: string;
	iat?: number;
	exp?: number;
}

/**
 * Login request body
 */
export interface LoginRequest {
	email: string;
	password: string;
}

/**
 * Register request body
 */
export interface RegisterRequest {
	email: string;
	password: string;
	name: string;
	role?: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
	user: {
		id: string;
		email: string;
		name: string;
		role: string;
		createdAt: Date;
		updatedAt: Date;
	};
	tokens: {
		accessToken: string;
		refreshToken: string;
	};
}

/**
 * Token refresh request
 */
export interface RefreshTokenRequest {
	refreshToken: string;
}

/**
 * User profile update request
 */
export interface UpdateProfileRequest {
	name?: string;
	email?: string;
}

/**
 * Password change request
 */
export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
}

/**
 * JWT Token pair
 */
export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

/**
 * Authentication middleware options
 */
export interface AuthMiddlewareOptions {
	optional?: boolean;
	roles?: string[];
}

/**
 * User data yang akan dikembalikan ke client
 */
export interface UserResponse {
	id: string;
	email: string;
	name: string;
	role: string;
	createdAt: Date;
	updatedAt: Date;
}
