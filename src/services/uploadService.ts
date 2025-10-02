/**
 * Upload Service
 * Business logic untuk file upload operations dengan Cloudinary integration
 */

import { promises as fs, existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import cloudinaryConfig from '../config/cloudinary';
import {
	MulterFile,
	UploadResponse,
	MultipleUploadResponse,
	DeleteResponse,
	FileValidationOptions,
	FileProcessingOptions,
	ImageTransformationOptions,
} from '../types/upload';

/**
 * Upload Service class
 */
export class UploadService {
	private uploadDir: string;
	private maxFileSize: number;
	private allowedMimeTypes: string[];

	constructor() {
		this.uploadDir = process.env['UPLOAD_DIR'] || './uploads';
		this.maxFileSize = parseInt(process.env['MAX_FILE_SIZE'] || '5242880'); // 5MB
		this.allowedMimeTypes = process.env['ALLOWED_FILE_TYPES']?.split(',') || [
			'image/jpeg',
			'image/png',
			'image/webp',
		];

		// Ensure upload directory exists
		this.ensureUploadDirectory();
	}

	/**
	 * Ensure upload directory exists
	 */
	private ensureUploadDirectory(): void {
		try {
			if (!existsSync(this.uploadDir)) {
				mkdirSync(this.uploadDir, { recursive: true });
				logger.info(`✅ Created upload directory: ${this.uploadDir}`);
			}
		} catch (error) {
			logger.error('❌ Failed to create upload directory:', error);
		}
	}

	/**
	 * Validate file
	 */
	private validateFile(file: MulterFile, options: FileValidationOptions = {}): void {
		const { maxFileSize = this.maxFileSize, allowedMimeTypes = this.allowedMimeTypes } = options;

		// Check file size
		if (file.size > maxFileSize) {
			throw new Error(`File size exceeds maximum limit of ${maxFileSize} bytes`);
		}

		// Check MIME type
		if (!allowedMimeTypes.includes(file.mimetype)) {
			throw new Error(`File type ${file.mimetype} is not allowed`);
		}
	}

	/**
	 * Process image with Sharp
	 */
	private async processImage(
		filePath: string,
		options: FileProcessingOptions = {}
	): Promise<Buffer> {
		try {
			let image = sharp(filePath);

			// Resize image
			if (options.resize) {
				const { width, height, fit = 'cover' } = options.resize;
				image = image.resize(width, height, { fit: fit as any });
			}

			// Compress image
			if (options.compress) {
				const { quality = 80, progressive = true } = options.compress;
				image = image.jpeg({ quality, progressive });
			}

			// Convert format
			if (options.convert) {
				const { format } = options.convert;
				if (format === 'jpeg') {
					image = image.jpeg();
				} else if (format === 'png') {
					image = image.png();
				} else if (format === 'webp') {
					image = image.webp();
				}
			}

			// Add watermark
			if (options.watermark) {
				const {
					text = 'FTS',
					position = 'southeast',
					opacity = 0.5,
					fontSize = 24,
					color = '#ffffff',
				} = options.watermark;

				// Create watermark SVG
				const svgText = `
					<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
						<text x="10" y="35" font-family="Arial" font-size="${fontSize}" fill="${color}" opacity="${opacity}">
							${text}
						</text>
					</svg>
				`;

				image = image.composite([
					{
						input: Buffer.from(svgText),
						gravity: position as any,
					},
				]);
			}

			return await image.toBuffer();
		} catch (error) {
			logger.error('❌ Image processing error:', error);
			throw new Error('Failed to process image');
		}
	}

	/**
	 * Upload single file to Cloudinary
	 */
	async uploadSingleFile(
		file: MulterFile,
		options: {
			folder?: string;
			publicId?: string;
			resourceType?: 'image' | 'auto';
			processing?: FileProcessingOptions;
		} = {}
	): Promise<UploadResponse> {
		try {
			// Validate file
			this.validateFile(file);

			// Process image if it's an image
			if (file.mimetype.startsWith('image/') && options.processing) {
				await this.processImage(file.path, options.processing);
			}

			// Upload to Cloudinary
			const uploadOptions: any = {
				resource_type: options.resourceType || 'image',
			};

			if (options.folder) {
				uploadOptions.folder = options.folder;
			}

			if (options.publicId) {
				uploadOptions.public_id = options.publicId;
			}

			const result = await cloudinaryConfig.uploadImage(file.path, uploadOptions);

			// Clean up temporary file
			await this.cleanupTempFile(file.path);

			logger.info(`✅ File uploaded successfully: ${result.public_id}`);

			return {
				success: true,
				message: 'File uploaded successfully',
				data: {
					publicId: result.public_id,
					url: result.url,
					secureUrl: result.secure_url,
					format: result.format,
					width: result.width,
					height: result.height,
					bytes: result.bytes,
					createdAt: result.created_at,
					resourceType: result.resource_type,
					folder: result.folder || '',
				},
			};
		} catch (error) {
			logger.error('❌ Single file upload error:', error);
			throw error;
		}
	}

	/**
	 * Upload multiple files to Cloudinary
	 */
	async uploadMultipleFiles(
		files: MulterFile[],
		options: {
			folder?: string;
			resourceType?: 'image' | 'auto';
			processing?: FileProcessingOptions;
		} = {}
	): Promise<MultipleUploadResponse> {
		try {
			const results: UploadResponse['data'][] = [];
			let uploaded = 0;
			let failed = 0;

			for (const file of files) {
				try {
					const result = await this.uploadSingleFile(file, options);
					results.push(result.data);
					uploaded++;
				} catch (error) {
					logger.error(`❌ Failed to upload file ${file.originalname}:`, error);
					failed++;
				}
			}

			logger.info(`✅ Multiple files uploaded: ${uploaded} successful, ${failed} failed`);

			return {
				success: true,
				message: `Files uploaded: ${uploaded} successful, ${failed} failed`,
				data: results,
				uploaded,
				failed,
			};
		} catch (error) {
			logger.error('❌ Multiple files upload error:', error);
			throw error;
		}
	}

	/**
	 * Delete file from Cloudinary
	 */
	async deleteFile(publicId: string): Promise<DeleteResponse> {
		try {
			const result = await cloudinaryConfig.deleteImage(publicId);

			logger.info(`✅ File deleted successfully: ${publicId}`);

			return {
				success: true,
				message: 'File deleted successfully',
				data: {
					result: result.result,
					publicId,
				},
			};
		} catch (error) {
			logger.error('❌ File delete error:', error);
			throw error;
		}
	}

	/**
	 * Clean up temporary file
	 */
	private async cleanupTempFile(filePath: string): Promise<void> {
		try {
			if (existsSync(filePath)) {
				await fs.unlink(filePath);
			}
		} catch (error) {
			logger.error('❌ Failed to cleanup temp file:', error);
		}
	}

	/**
	 * Generate image URL with transformations
	 */
	getImageUrl(publicId: string, transformations: ImageTransformationOptions = {}): string {
		return cloudinaryConfig.getImageUrl(publicId, transformations);
	}

	/**
	 * Save file metadata to database
	 */
	async saveFileMetadata(
		metadata: MulterFile,
		cloudinaryData: any,
		projectId?: string
	): Promise<any> {
		try {
			if (projectId) {
				// Save to project_images table
				return await (prisma as any).projectImage.create({
					data: {
						projectId,
						filename: metadata.filename,
						originalName: metadata.originalname,
						path: cloudinaryData.url,
						size: metadata.size,
						mimeType: metadata.mimetype,
					},
				});
			} else {
				// Save to general uploads table (if exists)
				// This would require a separate uploads table
				logger.warn('General file metadata saving not implemented');
				return null;
			}
		} catch (error) {
			logger.error('❌ Failed to save file metadata:', error);
			throw error;
		}
	}

	/**
	 * Get upload configuration
	 */
	getUploadConfig() {
		return {
			uploadDir: this.uploadDir,
			maxFileSize: this.maxFileSize,
			allowedMimeTypes: this.allowedMimeTypes,
			cloudinaryConfig: cloudinaryConfig.getConfigInfo(),
		};
	}
}

// Class is already exported above
