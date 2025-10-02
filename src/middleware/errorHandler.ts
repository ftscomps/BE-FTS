/**
 * Error Handler Middleware
 * Centralized error handling untuk Express application
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom error class untuk application errors
 */
export class AppError extends Error {
	public statusCode: number;
	public isOperational: boolean;

	constructor(message: string, statusCode: number = 500) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Handle CastError dari MongoDB/Mongoose (jika menggunakan)
 */
const handleCastErrorDB = (err: any): AppError => {
	const message = `Invalid ${err.path}: ${err.value}`;
	return new AppError(message, 400);
};

/**
 * Handle duplicate field errors (MongoDB)
 */
const handleDuplicateFieldsDB = (err: any): AppError => {
	const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
	const message = `Duplicate field value: ${value}. Please use another value!`;
	return new AppError(message, 400);
};

/**
 * Handle validation errors (MongoDB/Mongoose)
 */
const handleValidationErrorDB = (err: any): AppError => {
	const errors = Object.values(err.errors).map((el: any) => el.message);
	const message = `Invalid input data. ${errors.join('. ')}`;
	return new AppError(message, 400);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (): AppError => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = (): AppError =>
	new AppError('Your token has expired! Please log in again.', 401);

/**
 * Handle Prisma errors
 */
const handlePrismaError = (err: any): AppError => {
	switch (err.code) {
		case 'P2002':
			// Unique constraint violation
			const target = (err.meta?.target as string[]) || [];
			const field = target.join(', ');
			return new AppError(`Duplicate entry for field: ${field}`, 400);
		case 'P2025':
			// Record not found
			return new AppError('Record not found', 404);
		case 'P2003':
			// Foreign key constraint violation
			return new AppError('Invalid reference to related record', 400);
		case 'P2014':
			// Relation violation
			return new AppError('Cannot delete record due to existing relations', 400);
		default:
			return new AppError('Database operation failed', 500);
	}
};

/**
 * Send error response untuk development environment
 */
const sendErrorDev = (err: AppError, res: Response): void => {
	res.status(err.statusCode).json({
		status: 'error',
		error: err,
		message: err.message,
		stack: err.stack,
	});
};

/**
 * Send error response untuk production environment
 */
const sendErrorProd = (err: AppError, res: Response): void => {
	// Operational, trusted error: send message to client
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: 'error',
			message: err.message,
		});
	} else {
		// Programming or other unknown error: don't leak error details
		logger.error('ERROR 💥', err);

		res.status(500).json({
			status: 'error',
			message: 'Something went wrong!',
		});
	}
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	// Log error
	logger.error({
		message: err.message,
		stack: err.stack,
		url: req.originalUrl,
		method: req.method,
		ip: req.ip,
		userAgent: req.get('User-Agent'),
		userId: (req as any).user?.id,
	});

	if (process.env.NODE_ENV === 'development') {
		sendErrorDev(err, res);
	} else {
		let error = { ...err };
		error.message = err.message;

		// Handle specific error types
		if (error.name === 'CastError') error = handleCastErrorDB(error);
		if (error.code === 11000) error = handleDuplicateFieldsDB(error);
		if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
		if (error.name === 'JsonWebTokenError') error = handleJWTError();
		if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
		if (error.constructor.name === 'PrismaClientKnownRequestError') {
			error = handlePrismaError(error);
		}

		sendErrorProd(error, res);
	}
};

/**
 * Async error wrapper untuk catch async errors
 */
export const catchAsync = (fn: Function) => {
	return (req: Request, res: Response, next: NextFunction) => {
		fn(req, res, next).catch(next);
	};
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejections = (): void => {
	process.on('unhandledRejection', (err: Error) => {
		logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
		process.exit(1);
	});
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtExceptions = (): void => {
	process.on('uncaughtException', (err: Error) => {
		logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
		process.exit(1);
	});
};
