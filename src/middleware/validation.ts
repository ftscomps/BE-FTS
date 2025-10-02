/**
 * Validation Middleware
 * Middleware untuk validasi request body, query parameters, dan URL parameters
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Validation middleware factory untuk request body
 */
export const validateRequest = (schema: any) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			// Validate request body
			const result = schema.safeParse(req.body);

			if (!result.success) {
				const errorMessages = result.error.issues.map((err: any) => ({
					field: err.path.join('.'),
					message: err.message,
				}));

				logger.warn(`❌ Request validation failed: ${JSON.stringify(errorMessages)}`);

				res.status(400).json({
					success: false,
					error: 'Validation Error',
					message: 'Invalid input data',
					details: errorMessages,
				});
				return;
			}

			// Replace request body with validated data
			req.body = result.data;
			next();
		} catch (error) {
			logger.error('❌ Request validation error:', error);

			res.status(500).json({
				success: false,
				error: 'Internal Server Error',
				message: 'Validation failed',
			});
		}
	};
};

/**
 * Validation middleware factory untuk query parameters
 */
export const validateRequestQuery = (schema: any) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			// Validate query parameters
			const result = schema.safeParse(req.query);

			if (!result.success) {
				const errorMessages = result.error.issues.map((err: any) => ({
					field: err.path.join('.'),
					message: err.message,
				}));

				logger.warn(`❌ Query validation failed: ${JSON.stringify(errorMessages)}`);

				res.status(400).json({
					success: false,
					error: 'Validation Error',
					message: 'Invalid query parameters',
					details: errorMessages,
				});
				return;
			}

			// Replace query with validated data
			req.query = result.data;
			next();
		} catch (error) {
			logger.error('❌ Query validation error:', error);

			res.status(500).json({
				success: false,
				error: 'Internal Server Error',
				message: 'Query validation failed',
			});
		}
	};
};

/**
 * Validation middleware factory untuk URL parameters
 */
export const validateRequestParams = (schema: any) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			// Validate URL parameters
			const result = schema.safeParse(req.params);

			if (!result.success) {
				const errorMessages = result.error.issues.map((err: any) => ({
					field: err.path.join('.'),
					message: err.message,
				}));

				logger.warn(`❌ Parameter validation failed: ${JSON.stringify(errorMessages)}`);

				res.status(400).json({
					success: false,
					error: 'Validation Error',
					message: 'Invalid URL parameters',
					details: errorMessages,
				});
				return;
			}

			// Replace params with validated data
			req.params = result.data;
			next();
		} catch (error) {
			logger.error('❌ Parameter validation error:', error);

			res.status(500).json({
				success: false,
				error: 'Internal Server Error',
				message: 'Parameter validation failed',
			});
		}
	};
};

/**
 * Validation middleware factory untuk combined validation
 */
export const validateCombined = (schemas: { body?: any; query?: any; params?: any }) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			// Validate request body if schema provided
			if (schemas.body) {
				const bodyResult = schemas.body.safeParse(req.body);

				if (!bodyResult.success) {
					const errorMessages = bodyResult.error.issues.map((err: any) => ({
						field: err.path.join('.'),
						message: err.message,
					}));

					logger.warn(`❌ Request validation failed: ${JSON.stringify(errorMessages)}`);

					res.status(400).json({
						success: false,
						error: 'Validation Error',
						message: 'Invalid input data',
						details: errorMessages,
					});
					return;
				}

				// Replace request body with validated data
				req.body = bodyResult.data;
			}

			// Validate query parameters if schema provided
			if (schemas.query) {
				const queryResult = schemas.query.safeParse(req.query);

				if (!queryResult.success) {
					const errorMessages = queryResult.error.issues.map((err: any) => ({
						field: err.path.join('.'),
						message: err.message,
					}));

					logger.warn(`❌ Query validation failed: ${JSON.stringify(errorMessages)}`);

					res.status(400).json({
						success: false,
						error: 'Validation Error',
						message: 'Invalid query parameters',
						details: errorMessages,
					});
					return;
				}

				// Replace query with validated data
				req.query = queryResult.data;
			}

			// Validate URL parameters if schema provided
			if (schemas.params) {
				const paramsResult = schemas.params.safeParse(req.params);

				if (!paramsResult.success) {
					const errorMessages = paramsResult.error.issues.map((err: any) => ({
						field: err.path.join('.'),
						message: err.message,
					}));

					logger.warn(`❌ Parameter validation failed: ${JSON.stringify(errorMessages)}`);

					res.status(400).json({
						success: false,
						error: 'Validation Error',
						message: 'Invalid URL parameters',
						details: errorMessages,
					});
					return;
				}

				// Replace params with validated data
				req.params = paramsResult.data;
			}

			next();
		} catch (error) {
			logger.error('❌ Combined validation error:', error);

			res.status(500).json({
				success: false,
				error: 'Internal Server Error',
				message: 'Validation failed',
			});
		}
	};
};

export default {
	validateRequest,
	validateRequestQuery,
	validateRequestParams,
	validateCombined,
};
