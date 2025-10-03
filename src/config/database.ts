/**
 * Database Configuration
 * Prisma client setup dengan connection management
 */

import { PrismaClient as PrismaClientType } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Extended Prisma Client dengan logging dan error handling
 */
class ExtendedPrismaClient extends (PrismaClientType as any) {
	constructor() {
		super({
			log:
				process.env['NODE_ENV'] === 'development'
					? [
							{
								emit: 'event' as any,
								level: 'query' as any,
							},
							{
								emit: 'event' as any,
								level: 'error' as any,
							},
							{
								emit: 'event' as any,
								level: 'info' as any,
							},
							{
								emit: 'event' as any,
								level: 'warn' as any,
							},
					  ]
					: [
							{
								emit: 'event' as any,
								level: 'error' as any,
							},
							{
								emit: 'event' as any,
								level: 'warn' as any,
							},
					  ],
			// Add connection pooling and retry logic
			datasourceUrl: process.env['DATABASE_URL'],
		});

		// Log queries di development
		(this as any).$on('query', (e: any) => {
			if (process.env['NODE_ENV'] === 'development') {
				logger.debug(`Query: ${e.query}`);
				logger.debug(`Params: ${e.params}`);
				logger.debug(`Duration: ${e.duration}ms`);
			}
		});

		// Log errors dengan lebih detail
		(this as any).$on('error', (e: any) => {
			logger.error('Prisma Error:', {
				message: e.message,
				target: e.target,
				timestamp: new Date().toISOString(),
			});
		});

		// Log info
		(this as any).$on('info', (e: any) => {
			logger.info('Prisma Info:', e.message);
		});

		// Log warnings
		(this as any).$on('warn', (e: any) => {
			logger.warn('Prisma Warning:', e.message);
		});
	}

	/**
	 * Graceful shutdown untuk database connection
	 */
	async disconnect(): Promise<void> {
		try {
			await (this as any).$disconnect();
			logger.info('✅ Database disconnected successfully');
		} catch (error) {
			logger.error('❌ Error disconnecting from database:', error);
			throw error;
		}
	}

	/**
	 * Health check untuk database connection
	 */
	async healthCheck(): Promise<boolean> {
		try {
			await (this as any).$queryRaw`SELECT 1`;
			return true;
		} catch (error) {
			logger.error('❌ Database health check failed:', error);
			return false;
		}
	}

	/**
	 * Get database connection info
	 */
	getConnectionInfo(): { url: string; connected: boolean } {
		return {
			url: (this as any)._engine?.datasourceUrl || 'Unknown',
			connected: true, // Simplified, bisa ditambah dengan logic yang lebih kompleks
		};
	}
}

// Create singleton instance with connection management
let prisma: ExtendedPrismaClient | null = null;
let isDisconnecting = false;

// Function to get Prisma client instance
const getPrismaClient = (): ExtendedPrismaClient => {
	if (!prisma) {
		prisma = new ExtendedPrismaClient();
	}
	return prisma;
};

// Function to disconnect database
const disconnectDatabase = async (): Promise<void> => {
	if (!prisma || isDisconnecting) {
		return;
	}

	isDisconnecting = true;
	try {
		await prisma.disconnect();
		logger.info('✅ Database disconnected successfully');
		prisma = null;
	} catch (error) {
		logger.error('❌ Error disconnecting from database:', error);
	} finally {
		isDisconnecting = false;
	}
};

// Handle process termination dengan better error handling
process.on('beforeExit', async () => {
	await disconnectDatabase();
});

process.on('SIGINT', async () => {
	try {
		await disconnectDatabase();
		logger.info('✅ Database disconnected via SIGINT');
		process.exit(0);
	} catch (error) {
		logger.error('❌ Error during SIGINT disconnect:', error);
		process.exit(1);
	}
});

process.on('SIGTERM', async () => {
	try {
		await disconnectDatabase();
		logger.info('✅ Database disconnected via SIGTERM');
		process.exit(0);
	} catch (error) {
		logger.error('❌ Error during SIGTERM disconnect:', error);
		process.exit(1);
	}
});

// Export the Prisma client instance
const prismaInstance = getPrismaClient();
export default prismaInstance;
export { ExtendedPrismaClient };
