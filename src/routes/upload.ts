/**
 * Upload Routes
 * Route definitions untuk file upload endpoints
 */

import { Router } from 'express';
import * as uploadController from '../controllers/uploadController';
import { requireAuth } from '../middleware/auth';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
	dest: './uploads/',
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB
	},
	fileFilter: (_req, file, cb) => {
		// Only accept images
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			(cb as any)(false, new Error('Only image files are allowed'));
		}
	},
});

// Configure multer for multiple file uploads
const uploadMultiple = multer({
	dest: './uploads/',
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB
		files: 10, // Maximum 10 files
	},
	fileFilter: (_req, file, cb) => {
		// Only accept images
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			(cb as any)(false, new Error('Only image files are allowed'));
		}
	},
});

const router = Router();

/**
 * @route   POST /api/upload/single
 * @desc    Upload single image file
 * @access  Private
 */
router.post('/single', requireAuth, upload.single('image'), uploadController.uploadSingle);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple image files
 * @access  Private
 */
router.post('/multiple', requireAuth, uploadMultiple.array('images', 10), (req, res, next) =>
	uploadController.uploadMultiple(req as any, res, next)
);

/**
 * @route   DELETE /api/upload/file
 * @desc    Delete file from Cloudinary
 * @access  Private
 */
router.delete('/file', requireAuth, uploadController.deleteFile);

/**
 * @route   GET /api/upload/:publicId/url
 * @desc    Get file URL with transformations
 * @access  Public
 */
router.get('/:publicId/url', uploadController.getFileUrl);

/**
 * @route   GET /api/upload/config
 * @desc    Get upload configuration
 * @access  Public
 */
router.get('/config', uploadController.getUploadConfig);

/**
 * Error handler for upload routes
 */
router.use(uploadController.handleUploadError);

export default router;
