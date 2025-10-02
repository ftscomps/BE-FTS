// Unit tests for authentication service
import { AuthService } from '../services/authService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
	let authService: AuthService;
	let prismaMock: any;

	beforeEach(() => {
		// Create a fresh mock for each test
		prismaMock = {
			user: {
				findUnique: jest.fn(),
				findMany: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
				delete: jest.fn(),
			},
			activityLog: {
				create: jest.fn(),
			},
			$connect: jest.fn(),
			$disconnect: jest.fn(),
			$on: jest.fn(),
		};

		authService = new AuthService(prismaMock as any);
		jest.clearAllMocks();
	});

	describe('register', () => {
		it('should register a new user successfully', async () => {
			// Arrange
			const userData = {
				email: 'test@example.com',
				password: 'password123',
				name: 'Test User',
			};

			const hashedPassword = 'hashed-password';
			const createdUser = {
				id: 'user-id',
				email: userData.email,
				name: userData.name,
				role: 'admin',
				passwordHash: hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			(mockBcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue(hashedPassword);
			prismaMock.user.findUnique.mockResolvedValue(null);
			prismaMock.user.create.mockResolvedValue(createdUser);
			prismaMock.activityLog.create.mockResolvedValue({});

			(mockJwt.sign as jest.Mock) = jest
				.fn()
				.mockReturnValueOnce('access-token')
				.mockReturnValueOnce('refresh-token');

			// Act
			const result = await authService.register(userData);

			// Assert
			expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
			expect(prismaMock.user.create).toHaveBeenCalledWith({
				data: {
					email: userData.email,
					passwordHash: hashedPassword,
					name: userData.name,
					role: 'admin',
				},
			});
			expect(result.user).toEqual({
				id: createdUser.id,
				email: createdUser.email,
				name: createdUser.name,
				role: createdUser.role,
				createdAt: createdUser.createdAt,
				updatedAt: createdUser.updatedAt,
			});
			expect(result.tokens).toEqual({
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
			});
		});

		it('should throw error if user already exists', async () => {
			// Arrange
			const userData = {
				email: 'existing@example.com',
				password: 'password123',
				name: 'Existing User',
			};

			const existingUser = {
				id: 'user-id',
				email: userData.email,
				name: userData.name,
				role: 'admin',
			};

			prismaMock.user.findUnique.mockResolvedValue(existingUser);

			// Act & Assert
			await expect(authService.register(userData)).rejects.toThrow(
				'User with this email already exists'
			);
		});
	});

	describe('login', () => {
		it('should login user successfully with valid credentials', async () => {
			// Arrange
			const loginData = {
				email: 'test@example.com',
				password: 'password123',
			};

			const existingUser = {
				id: 'user-id',
				email: loginData.email,
				passwordHash: 'hashed-password',
				name: 'Test User',
				role: 'admin',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			prismaMock.user.findUnique.mockResolvedValue(existingUser);
			(mockBcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(true);
			prismaMock.activityLog.create.mockResolvedValue({});

			(mockJwt.sign as jest.Mock) = jest
				.fn()
				.mockReturnValueOnce('access-token')
				.mockReturnValueOnce('refresh-token');

			// Act
			const result = await authService.login(loginData);

			// Assert
			expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
				where: { email: loginData.email },
			});
			expect(mockBcrypt.compare).toHaveBeenCalledWith(
				loginData.password,
				existingUser.passwordHash
			);
			expect(result.user).toEqual({
				id: existingUser.id,
				email: existingUser.email,
				name: existingUser.name,
				role: existingUser.role,
				createdAt: existingUser.createdAt,
				updatedAt: existingUser.updatedAt,
			});
			expect(result.tokens).toEqual({
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
			});
		});

		it('should throw error for invalid credentials', async () => {
			// Arrange
			const loginData = {
				email: 'test@example.com',
				password: 'wrong-password',
			};

			const existingUser = {
				id: 'user-id',
				email: loginData.email,
				passwordHash: 'hashed-password',
				name: 'Test User',
				role: 'admin',
			};

			prismaMock.user.findUnique.mockResolvedValue(existingUser);
			(mockBcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(false);

			// Act & Assert
			await expect(authService.login(loginData)).rejects.toThrow('Invalid email or password');
		});

		it('should throw error if user not found', async () => {
			// Arrange
			const loginData = {
				email: 'nonexistent@example.com',
				password: 'password123',
			};

			prismaMock.user.findUnique.mockResolvedValue(null);

			// Act & Assert
			await expect(authService.login(loginData)).rejects.toThrow('Invalid email or password');
		});
	});

	describe('verifyAccessToken', () => {
		it('should verify access token successfully', async () => {
			// Arrange
			const token = 'valid-token';
			const decodedToken = {
				id: 'user-id',
				email: 'test@example.com',
				name: 'Test User',
				role: 'admin',
			};

			(mockJwt.verify as jest.Mock) = jest.fn().mockReturnValue(decodedToken);

			// Act
			const result = authService.verifyAccessToken(token);

			// Assert
			expect(mockJwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
			expect(result).toEqual(decodedToken);
		});

		it('should throw error for invalid token', () => {
			// Arrange
			const token = 'invalid-token';

			(mockJwt.verify as jest.Mock) = jest.fn().mockImplementation(() => {
				throw new Error('Invalid token');
			});

			// Act & Assert
			expect(() => authService.verifyAccessToken(token)).toThrow('Invalid or expired access token');
		});
	});

	describe('refreshToken', () => {
		it('should refresh token successfully', async () => {
			// Arrange
			const refreshTokenData = {
				refreshToken: 'valid-refresh-token',
			};

			const decodedRefreshToken = { id: 'user-id', type: 'refresh' };
			const existingUser = {
				id: 'user-id',
				email: 'test@example.com',
				name: 'Test User',
				role: 'admin',
			};

			(mockJwt.verify as jest.Mock) = jest.fn().mockReturnValue(decodedRefreshToken);
			prismaMock.user.findUnique.mockResolvedValue(existingUser);
			(mockJwt.sign as jest.Mock) = jest.fn().mockReturnValue('new-access-token');

			// Act
			const result = await authService.refreshToken(refreshTokenData);

			// Assert
			expect(mockJwt.verify).toHaveBeenCalledWith(
				refreshTokenData.refreshToken,
				process.env.JWT_REFRESH_SECRET
			);
			expect(result).toEqual({ accessToken: 'new-access-token' });
		});

		it('should throw error for invalid refresh token', async () => {
			// Arrange
			const refreshTokenData = {
				refreshToken: 'invalid-refresh-token',
			};

			(mockJwt.verify as jest.Mock) = jest.fn().mockImplementation(() => {
				throw new Error('Invalid refresh token');
			});

			// Act & Assert
			await expect(authService.refreshToken(refreshTokenData)).rejects.toThrow(
				'Invalid or expired refresh token'
			);
		});
	});

	describe('getProfile', () => {
		it('should get user profile successfully', async () => {
			// Arrange
			const userId = 'user-id';
			const userProfile = {
				id: userId,
				email: 'test@example.com',
				name: 'Test User',
				role: 'admin',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			prismaMock.user.findUnique.mockResolvedValue(userProfile);

			// Act
			const result = await authService.getProfile(userId);

			// Assert
			expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
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
			expect(result).toEqual(userProfile);
		});

		it('should throw error if user not found', async () => {
			// Arrange
			const userId = 'nonexistent-user-id';

			prismaMock.user.findUnique.mockResolvedValue(null);

			// Act & Assert
			await expect(authService.getProfile(userId)).rejects.toThrow('User not found');
		});
	});
});
