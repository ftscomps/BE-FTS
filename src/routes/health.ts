/**
 * Health Check Routes
 * Provides health status and system information for monitoring
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Basic health check endpoint
 */
router.get('/', async (req, res) => {
	try {
		const healthCheck = {
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			environment: process.env.NODE_ENV || 'development',
			version: process.env.npm_package_version || '1.0.0',
			memory: process.memoryUsage(),
		};

		res.status(200).json(healthCheck);
	} catch (error) {
		res.status(503).json({
			status: 'error',
			timestamp: new Date().toISOString(),
			error: 'Health check failed',
		});
	}
});

/**
 * Detailed health check with database connectivity
 */
router.get('/detailed', async (req, res) => {
	try {
		const startTime = Date.now();

		// Test database connection
		await prisma.$queryRaw`SELECT 1`;
		const dbResponseTime = Date.now() - startTime;

		const healthCheck = {
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			environment: process.env.NODE_ENV || 'development',
			version: process.env.npm_package_version || '1.0.0',
			services: {
				database: {
					status: 'connected',
					responseTime: `${dbResponseTime}ms`,
				},
				memory: process.memoryUsage(),
				cpu: {
					usage: process.cpuUsage(),
				},
			},
			endpoints: {
				auth: '/api/auth/*',
				projects: '/api/projects/*',
				upload: '/api/upload/*',
				admin: '/api/admin/*',
			},
		};

		res.status(200).json(healthCheck);
	} catch (error) {
		res.status(503).json({
			status: 'error',
			timestamp: new Date().toISOString(),
			error: 'Detailed health check failed',
			services: {
				database: {
					status: 'disconnected',
					error: error instanceof Error ? error.message : 'Unknown error',
				},
			},
		});
	}
});

/**
 * Readiness probe for container orchestration
 */
router.get('/ready', async (req, res) => {
	try {
		// Check if database is ready
		await prisma.$queryRaw`SELECT 1`;

		// Check if all required environment variables are set
		const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

		const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

		if (missingEnvVars.length > 0) {
			return res.status(503).json({
				status: 'not ready',
				timestamp: new Date().toISOString(),
				error: 'Missing required environment variables',
				missing: missingEnvVars,
			});
		}

		res.status(200).json({
			status: 'ready',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		res.status(503).json({
			status: 'not ready',
			timestamp: new Date().toISOString(),
			error: 'Readiness check failed',
		});
	}
});

/**
 * Liveness probe for container orchestration
 */
router.get('/live', (req, res) => {
	try {
		// Simple liveness check - if we can respond, we're alive
		res.status(200).json({
			status: 'alive',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
		});
	} catch (error) {
		res.status(503).json({
			status: 'not alive',
			timestamp: new Date().toISOString(),
			error: 'Liveness check failed',
		});
	}
});

export default router;
