/**
 * Cloudinary Configuration
 * Cloud storage setup untuk image uploads
 */

import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

/**
 * Cloudinary configuration class
 */
class CloudinaryConfig {
	private readonly cloudName: string;
	private readonly apiKey: string;
	private readonly apiSecret: string;
	private readonly folder: string;

	constructor() {
		// Get environment variables
		this.cloudName = process.env['CLOUDINARY_CLOUD_NAME'] || '';
		this.apiKey = process.env['CLOUDINARY_API_KEY'] || '';
		this.apiSecret = process.env['CLOUDINARY_API_SECRET'] || '';
		this.folder = process.env['CLOUDINARY_FOLDER'] || 'projects';

		// Validate configuration
		this.validateConfig();

		// Configure Cloudinary
		cloudinary.config({
			cloud_name: this.cloudName,
			api_key: this.apiKey,
			api_secret: this.apiSecret,
			secure: true,
		});

		logger.info('✅ Cloudinary configured successfully');
	}

	/**
	 * Validate Cloudinary configuration
	 */
	private validateConfig(): void {
		if (!this.cloudName) {
			logger.warn('⚠️  CLOUDINARY_CLOUD_NAME is not set in environment variables');
		}

		if (!this.apiKey) {
			logger.warn('⚠️  CLOUDINARY_API_KEY is not set in environment variables');
		}

		if (!this.apiSecret) {
			logger.warn('⚠️  CLOUDINARY_API_SECRET is not set in environment variables');
		}

		// In production, all Cloudinary config must be set
		if (process.env['NODE_ENV'] === 'production') {
			if (!this.cloudName || !this.apiKey || !this.apiSecret) {
				throw new Error('Cloudinary configuration is required in production');
			}
		}
	}

	/**
	 * Get Cloudinary instance
	 */
	getCloudinary() {
		return cloudinary;
	}

	/**
	 * Get folder name for uploads
	 */
	getFolder(): string {
		return this.folder;
	}

	/**
	 * Upload image to Cloudinary
	 */
	async uploadImage(
		filePath: string,
		options: {
			folder?: string;
			publicId?: string;
			resourceType?: 'image' | 'auto';
			transformation?: any;
		} = {}
	): Promise<any> {
		try {
			const uploadOptions: any = {
				folder: options.folder || this.folder,
				resource_type: options.resourceType || 'image',
				transformation: options.transformation || [
					{ width: 1200, height: 800, crop: 'limit' },
					{ quality: 'auto' },
				],
			};

			if (options.publicId) {
				uploadOptions.public_id = options.publicId;
			}

			const result = await cloudinary.uploader.upload(filePath, uploadOptions);

			logger.info(`✅ Image uploaded to Cloudinary: ${result.public_id}`);

			return result;
		} catch (error) {
			logger.error('❌ Cloudinary upload error:', error);
			throw error;
		}
	}

	/**
	 * Delete image from Cloudinary
	 */
	async deleteImage(publicId: string): Promise<any> {
		try {
			const result = await cloudinary.uploader.destroy(publicId, {
				resource_type: 'image',
			});

			logger.info(`✅ Image deleted from Cloudinary: ${publicId}`);

			return result;
		} catch (error) {
			logger.error('❌ Cloudinary delete error:', error);
			throw error;
		}
	}

	/**
	 * Generate image URL with transformations
	 */
	getImageUrl(
		publicId: string,
		transformations: {
			width?: number;
			height?: number;
			crop?: string;
			quality?: number;
			format?: string;
		} = {}
	): string {
		const url = cloudinary.url(publicId, {
			transformation: [
				{ width: transformations.width },
				{ height: transformations.height },
				{ crop: transformations.crop },
				{ quality: transformations.quality || 'auto' },
				{ format: transformations.format },
			].filter(Boolean),
		});

		return url;
	}

	/**
	 * Get Cloudinary configuration info
	 */
	getConfigInfo() {
		return {
			cloudName: this.cloudName,
			folder: this.folder,
			isConfigured: !!(this.cloudName && this.apiKey && this.apiSecret),
		};
	}
}

// Export singleton instance
export const cloudinaryConfig = new CloudinaryConfig();
export default cloudinaryConfig;
