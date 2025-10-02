// Test setup file for Jest
import { PrismaClient } from '@prisma/client';

// Global test setup
beforeAll(async () => {
	// Set test environment variables
	process.env.NODE_ENV = 'test';
	process.env.JWT_SECRET = 'test-jwt-secret';
	process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
	process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
});

afterAll(async () => {
	// Cleanup after tests
	jest.clearAllMocks();
});

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	log: jest.fn(),
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

// Create a comprehensive mock for PrismaClient
const createMockPrismaClient = () => ({
	user: {
		findUnique: jest.fn(),
		findMany: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	project: {
		findUnique: jest.fn(),
		findMany: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		count: jest.fn(),
	},
	projectImage: {
		findMany: jest.fn(),
		create: jest.fn(),
		delete: jest.fn(),
	},
	activityLog: {
		findMany: jest.fn(),
		create: jest.fn(),
	},
	$connect: jest.fn(),
	$disconnect: jest.fn(),
	$on: jest.fn(),
});

// Mock PrismaClient with proper structure
jest.mock('@prisma/client', () => ({
	PrismaClient: jest.fn(() => createMockPrismaClient()),
}));

// Test utilities
export const createMockUser = () => ({
	id: 'test-user-id',
	email: 'test@example.com',
	name: 'Test User',
	role: 'admin',
	passwordHash: 'hashed-password',
	createdAt: new Date(),
	updatedAt: new Date(),
});

export const createMockProject = () => ({
	id: 'test-project-id',
	title: 'Test Project',
	description: 'Test Description',
	imageUrl: 'https://example.com/image.jpg',
	liveUrl: 'https://example.com',
	githubUrl: 'https://github.com/example',
	tags: ['test', 'project'],
	createdBy: 'test-user-id',
	createdAt: new Date(),
	updatedAt: new Date(),
});

export const createMockActivityLog = () => ({
	id: 'test-activity-id',
	userId: 'test-user-id',
	action: 'CREATE',
	resourceType: 'project',
	resourceId: 'test-project-id',
	details: {},
	ipAddress: '127.0.0.1',
	userAgent: 'test-agent',
	createdAt: new Date(),
});
