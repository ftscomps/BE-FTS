/**
 * Authentication Service
 * Business logic untuk user authentication dan JWT token management
 */

import { sign, verify } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import {
	JwtPayload,
	LoginRequest,
	RegisterRequest,
	AuthResponse,
	RefreshTokenRequest,
	TokenPair,
	UserResponse,
} from '../types/auth';

/**
 * Authentication Service class
 */
export class AuthService {
	private prisma: PrismaClient;
	private jwtSecret: string;
	private jwtRefreshSecret: string;
	private jwtExpiresIn: string;
	private jwtRefreshExpiresIn: string;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
		this.jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
		this.jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret';
		this.jwtExpiresIn = process.env['JWT_EXPIRES_IN'] || '15m';
		this.jwtRefreshExpiresIn = process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';

		// Validate JWT secrets
		if (!this.jwtSecret || this.jwtSecret === 'fallback-secret') {
			logger.warn('⚠️  JWT_SECRET is not set properly in environment variables');
		}
		if (!this.jwtRefreshSecret || this.jwtRefreshSecret === 'fallback-refresh-secret') {
			logger.warn('⚠️  JWT_REFRESH_SECRET is not set properly in environment variables');
		}
	}

	/**
	 * Generate JWT token pair (access dan refresh token)
	 */
	private generateTokenPair(user: any): TokenPair {
		const payload: JwtPayload = {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		};

		const accessToken = (sign as any)(payload, this.jwtSecret, {
			expiresIn: this.jwtExpiresIn,
		});

		const refreshToken = (sign as any)({ id: user.id, type: 'refresh' }, this.jwtRefreshSecret, {
			expiresIn: this.jwtRefreshExpiresIn,
		});

		return { accessToken, refreshToken };
	}

	/**
	 * Verify JWT access token
	 */
	verifyAccessToken(token: string): JwtPayload {
		try {
			const decoded = verify(token, this.jwtSecret) as JwtPayload;
			return decoded;
		} catch (error) {
			logger.error('❌ Invalid access token:', error);
			throw new Error('Invalid or expired access token');
		}
	}

	/**
	 * Verify JWT refresh token
	 */
	verifyRefreshToken(token: string): { id: string; type: string } {
		try {
			const decoded = verify(token, this.jwtRefreshSecret) as { id: string; type: string };
			if (decoded.type !== 'refresh') {
				throw new Error('Invalid token type');
			}
			return decoded;
		} catch (error) {
			logger.error('❌ Invalid refresh token:', error);
			throw new Error('Invalid or expired refresh token');
		}
	}

	/**
	 * User registration
	 */
	async register(data: RegisterRequest): Promise<AuthResponse> {
		try {
			// Check if user already exists
			const existingUser = await this.prisma.user.findUnique({
				where: { email: data.email },
			});

			if (existingUser) {
				throw new Error('User with this email already exists');
			}

			// Hash password
			const saltRounds = 12;
			const passwordHash = await bcrypt.hash(data.password, saltRounds);

			// Create new user
			const newUser = await this.prisma.user.create({
				data: {
					email: data.email,
					name: data.name,
					passwordHash,
					role: data.role || 'admin',
				},
			});

			// Generate tokens
			const tokens = this.generateTokenPair(newUser);

			// Log activity
			await this.logActivity(newUser.id, 'CREATE', 'user', newUser.id, {
				message: 'User registered',
				email: newUser.email,
			});

			logger.info(`✅ New user registered: ${newUser.email}`);

			// Return response without password hash
			const { passwordHash: _, ...userResponse } = newUser;
			return {
				user: userResponse,
				tokens,
			};
		} catch (error) {
			logger.error('❌ Registration error:', error);
			throw error;
		}
	}

	/**
	 * User login
	 */
	async login(data: LoginRequest): Promise<AuthResponse> {
		try {
			// Find user by email
			const user = await this.prisma.user.findUnique({
				where: { email: data.email },
			});

			if (!user) {
				throw new Error('Invalid email or password');
			}

			// Verify password
			const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
			if (!isPasswordValid) {
				throw new Error('Invalid email or password');
			}

			// Generate tokens
			const tokens = this.generateTokenPair(user);

			// Log activity
			await this.logActivity(user.id, 'LOGIN', 'user', user.id, {
				message: 'User logged in',
			});

			logger.info(`✅ User logged in: ${user.email}`);

			// Return response without password hash
			const { passwordHash: _, ...userResponse } = user;
			return {
				user: userResponse,
				tokens,
			};
		} catch (error) {
			logger.error('❌ Login error:', error);
			throw error;
		}
	}

	/**
	 * Refresh access token
	 */
	async refreshToken(data: RefreshTokenRequest): Promise<{ accessToken: string }> {
		try {
			// Verify refresh token
			const { id } = this.verifyRefreshToken(data.refreshToken);

			// Find user
			const user = await this.prisma.user.findUnique({
				where: { id },
			});

			if (!user) {
				throw new Error('User not found');
			}

			// Generate new access token
			const payload: JwtPayload = {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			};

			const accessToken = (sign as any)(payload, this.jwtSecret, {
				expiresIn: this.jwtExpiresIn,
			});

			logger.info(`✅ Access token refreshed for user: ${user.email}`);

			return { accessToken };
		} catch (error) {
			logger.error('❌ Token refresh error:', error);
			throw error;
		}
	}

	/**
	 * Get user profile by ID
	 */
	async getProfile(userId: string): Promise<UserResponse> {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					email: true,
					name: true,
					role: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			if (!user) {
				throw new Error('User not found');
			}

			return user;
		} catch (error) {
			logger.error('❌ Get profile error:', error);
			throw error;
		}
	}

	/**
	 * Log activity helper
	 */
	private async logActivity(
		userId: string,
		action: string,
		resourceType: string,
		resourceId: string,
		details: any,
		ipAddress?: string,
		userAgent?: string
	): Promise<void> {
		try {
			await this.prisma.activityLog.create({
				data: {
					userId,
					action,
					resourceType,
					resourceId,
					details,
					ipAddress: ipAddress || '127.0.0.1',
					userAgent: userAgent || 'System',
				},
			});
		} catch (error) {
			logger.error('❌ Failed to log activity:', error);
		}
	}
}

// Class is already exported above
