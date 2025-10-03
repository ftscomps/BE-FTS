/**
 * Upload Controller
 * HTTP request handlers untuk file upload operations
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { UploadService } from '../services/uploadService';
import { UploadErrorType } from '../types/upload';

// Extended Request interface untuk upload
interface UploadRequest extends AuthenticatedRequest {
	file?: any;
	files?: any[];
}

/**
 * Upload single file
 */
export const uploadSingle = async (
	req: AuthenticatedRequest,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
			return;
		}

		const file = (req as any).file;

		if (!file) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'No file uploaded',
			});
			return;
		}

		// Get options from request
		const options = {
			folder: req.body.folder,
			publicId: req.body.publicId,
			resourceType: req.body.resourceType,
		};

		// Create service instance
		const uploadService = new UploadService();

		// Upload file
		const result = await uploadService.uploadSingleFile(file, options);

		logger.info(`✅ File uploaded by user ${userId}: ${result.data.publicId}`);

		// Transform response to match frontend expectations
		res.status(201).json({
			success: true,
			data: {
				url: result.data.secureUrl,
				filename: result.data.publicId,
			},
		});
	} catch (error) {
		logger.error('❌ Single file upload controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('not allowed') || error.message.includes('exceeds')) {
				res.status(400).json({
					error: 'Bad Request',
					message: error.message,
				});
				return;
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to upload file',
		});
	}
};

/**
 * Upload multiple files
 */
export const uploadMultiple = async (
	req: UploadRequest,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
			return;
		}

		const files = (req as any).files;

		if (!files || files.length === 0) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'No files uploaded',
			});
			return;
		}

		// Get options from request
		const options = {
			folder: req.body.folder,
			resourceType: req.body.resourceType,
		};

		// Create service instance
		const uploadService = new UploadService();

		// Upload files
		const result = await uploadService.uploadMultipleFiles(files, options);

		logger.info(
			`✅ Multiple files uploaded by user ${userId}: ${result.uploaded} successful, ${result.failed} failed`
		);

		// Transform response to match frontend expectations
		const transformedData = result.data.map((file: any) => ({
			url: file.secureUrl,
			filename: file.publicId,
		}));

		res.status(201).json({
			success: true,
			data: transformedData,
		});
	} catch (error) {
		logger.error('❌ Multiple files upload controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to upload files',
		});
	}
};

/**
 * Delete file
 */
export const deleteFile = async (
	req: AuthenticatedRequest,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const userId = req.user?.id;
		const { publicId } = req.body;

		if (!userId) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'User not authenticated',
			});
			return;
		}

		if (!publicId) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Public ID is required',
			});
			return;
		}

		// Create service instance
		const uploadService = new UploadService();

		// Delete file
		await uploadService.deleteFile(publicId);

		logger.info(`✅ File deleted by user ${userId}: ${publicId}`);

		res.json({
			success: true,
			message: 'File deleted successfully',
		});
	} catch (error) {
		logger.error('❌ File delete controller error:', error);

		if (error instanceof Error) {
			if (error.message.includes('not found')) {
				res.status(404).json({
					error: 'Not Found',
					message: 'File not found',
				});
				return;
			}
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to delete file',
		});
	}
};

/**
 * Get file URL with transformations
 */
export const getFileUrl = async (
	req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const { publicId } = req.params;
		const { width, height, crop, quality, format } = req.query;

		if (!publicId) {
			res.status(400).json({
				error: 'Bad Request',
				message: 'Public ID is required',
			});
			return;
		}

		// Create service instance
		const uploadService = new UploadService();

		// Get image URL with transformations
		const transformations: any = {};

		if (width) {
			transformations.width = parseInt(width as string);
		}

		if (height) {
			transformations.height = parseInt(height as string);
		}

		if (crop) {
			transformations.crop = crop as string;
		}

		if (quality) {
			transformations.quality = parseInt(quality as string);
		}

		if (format) {
			transformations.format = format as string;
		}

		const url = uploadService.getImageUrl(publicId, transformations);

		logger.info(`✅ Generated file URL for: ${publicId}`);

		res.json({
			success: true,
			data: {
				url,
				filename: publicId,
			},
		});
	} catch (error) {
		logger.error('❌ Get file URL controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to generate file URL',
		});
	}
};

/**
 * Get upload configuration
 */
export const getUploadConfig = async (
	_req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		// Create service instance
		const uploadService = new UploadService();

		// Get upload configuration
		const config = uploadService.getUploadConfig();

		logger.info('✅ Upload configuration retrieved');

		res.json({
			success: true,
			data: config,
		});
	} catch (error) {
		logger.error('❌ Get upload config controller error:', error);

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to retrieve upload configuration',
		});
	}
};

/**
 * Handle upload errors
 */
export const handleUploadError = (
	error: any,
	_req: Request,
	res: Response,
	_next: NextFunction
): void => {
	logger.error('❌ Upload error:', error);

	if (error.code === 'LIMIT_FILE_SIZE') {
		res.status(413).json({
			error: UploadErrorType.FILE_TOO_LARGE,
			message: 'File size exceeds maximum limit',
		});
		return;
	}

	if (error.code === 'LIMIT_FILE_COUNT') {
		res.status(413).json({
			error: UploadErrorType.FILE_TOO_LARGE,
			message: 'Too many files uploaded',
		});
		return;
	}

	if (error.code === 'LIMIT_UNEXPECTED_FILE') {
		res.status(400).json({
			error: UploadErrorType.INVALID_FILE_TYPE,
			message: 'Unexpected file field',
		});
		return;
	}

	// Default error
	res.status(500).json({
		error: UploadErrorType.UPLOAD_FAILED,
		message: 'File upload failed',
	});
};
