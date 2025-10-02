/**
 * Server bootstrap file
 * Entry point untuk FTS Backend API
 */

import app from './app';
import { logger } from './utils/logger';

// Get port dari environment variable atau default ke 3000
const PORT = process.env['PORT'] || 3000;

// Start server
const server = app.listen(PORT, () => {
	logger.info(`🚀 FTS Backend API is running on port ${PORT}`);
	logger.info(`📝 Environment: ${process.env['NODE_ENV'] || 'development'}`);
	logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
	logger.info(`\n📡 Received ${signal}. Starting graceful shutdown...`);

	server.close(() => {
		logger.info('✅ HTTP server closed.');
		process.exit(0);
	});

	// Force close setelah 10 seconds
	setTimeout(() => {
		logger.error('❌ Could not close connections in time, forcefully shutting down');
		process.exit(1);
	}, 10000);
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
	logger.error('❌ Uncaught Exception:', error);
	process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
	logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
	process.exit(1);
});

export default server;
