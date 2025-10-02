/**
 * Database Configuration
 * Prisma client setup dengan connection management
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Extended Prisma Client dengan logging dan error handling
 */
class ExtendedPrismaClient extends PrismaClient {
	constructor() {
		super({
			log: [
				{
					emit: 'event',
					level: 'query',
				},
				{
					emit: 'event',
					level: 'error',
				},
				{
					emit: 'event',
					level: 'info',
				},
				{
					emit: 'event',
					level: 'warn',
				},
			],
		});

		// Log queries di development
		this['$on']('query', (e: any) => {
			if (process.env['NODE_ENV'] === 'development') {
				logger.debug(`Query: ${e.query}`);
				logger.debug(`Params: ${e.params}`);
				logger.debug(`Duration: ${e.duration}ms`);
			}
		});

		// Log errors
		this['$on']('error', (e: any) => {
			logger.error('Prisma Error:', e);
		});

		// Log info
		this['$on']('info', (e: any) => {
			logger.info('Prisma Info:', e.message);
		});

		// Log warnings
		this['$on']('warn', (e: any) => {
			logger.warn('Prisma Warning:', e.message);
		});
	}

	/**
	 * Graceful shutdown untuk database connection
	 */
	async disconnect(): Promise<void> {
		try {
			await this['$disconnect']();
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
			await this['$queryRaw']`SELECT 1`;
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
			url: this['_engine'].datasourceUrl || 'Unknown',
			connected: true, // Simplified, bisa ditambah dengan logic yang lebih kompleks
		};
	}
}

// Create singleton instance
const prisma = new ExtendedPrismaClient();

// Handle process termination
process.on('beforeExit', async () => {
	await prisma.disconnect();
});

process.on('SIGINT', async () => {
	await prisma.disconnect();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	await prisma.disconnect();
	process.exit(0);
});

export default prisma;
export { ExtendedPrismaClient };
