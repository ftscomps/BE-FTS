/**
 * Winston Logger Configuration
 * Centralized logging system untuk FTS Backend API
 */

import winston from 'winston';
import path from 'path';

// Log levels configuration
const levels = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	debug: 4,
};

// Log colors configuration
const colors = {
	error: 'red',
	warn: 'yellow',
	info: 'green',
	http: 'magenta',
	debug: 'white',
};

// Add colors ke winston
winston.addColors(colors);

// Custom format untuk logs (tidak digunakan saat ini, tapi disimpan untuk referensi)
// const format = winston.format.combine(
// 	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
// 	winston.format.colorize({ all: true }),
// 	winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
// );

// Transport configuration
const transports = [
	// Console transport untuk development
	new winston.transports.Console({
		format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
	}),

	// File transport untuk error logs
	new winston.transports.File({
		filename: path.join(process.cwd(), 'logs', 'error.log'),
		level: 'error',
		format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
	}),

	// File transport untuk semua logs
	new winston.transports.File({
		filename: path.join(process.cwd(), 'logs', 'combined.log'),
		format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
	}),
];

// Create logger instance
const logger = winston.createLogger({
	level: process.env['LOG_LEVEL'] || 'info',
	levels,
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.json()
	),
	transports,
	// Handle uncaught exceptions
	exceptionHandlers: [
		new winston.transports.File({
			filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
		}),
	],
	// Handle unhandled promise rejections
	rejectionHandlers: [
		new winston.transports.File({
			filename: path.join(process.cwd(), 'logs', 'rejections.log'),
		}),
	],
});

// Development vs Production configuration
if (process.env['NODE_ENV'] !== 'production') {
	logger.add(
		new winston.transports.Console({
			format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
		})
	);
}

export default logger;
export { logger };
