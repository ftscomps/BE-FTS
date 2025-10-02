/**
 * Upload Types
 * Type definitions untuk file upload operations
 */

/**
 * Multer File interface
 */
export interface MulterFile {
	fieldname: string;
	originalname: string;
	encoding: string;
	mimetype: string;
	size: number;
	destination: string;
	filename: string;
	path: string;
	buffer: Buffer;
}

/**
 * File upload request body
 */
export interface UploadRequest {
	file?: MulterFile;
	files?: MulterFile[];
	folder?: string;
	publicId?: string;
	resourceType?: 'image' | 'auto';
}

/**
 * Single file upload response
 */
export interface UploadResponse {
	success: boolean;
	message: string;
	data: {
		publicId: string;
		url: string;
		secureUrl: string;
		format: string;
		width: number;
		height: number;
		bytes: number;
		createdAt: string;
		resourceType: string;
		folder: string;
	};
}

/**
 * Multiple files upload response
 */
export interface MultipleUploadResponse {
	success: boolean;
	message: string;
	data: UploadResponse['data'][];
	uploaded: number;
	failed: number;
}

/**
 * File delete response
 */
export interface DeleteResponse {
	success: boolean;
	message: string;
	data: {
		result: string;
		publicId: string;
	};
}

/**
 * File validation options
 */
export interface FileValidationOptions {
	maxFileSize?: number;
	allowedMimeTypes?: string[];
	allowedFileTypes?: string[];
	maxFiles?: number;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
}

/**
 * Image transformation options
 */
export interface ImageTransformationOptions {
	width?: number;
	height?: number;
	crop?: string;
	quality?: number;
	format?: string;
	gravity?: string;
	background?: string;
}

/**
 * File metadata
 */
export interface FileMetadata {
	originalName: string;
	filename: string;
	path: string;
	size: number;
	mimeType: string;
	encoding: string;
	fieldname: string;
}

/**
 * Upload error types
 */
export enum UploadErrorType {
	FILE_TOO_LARGE = 'FILE_TOO_LARGE',
	INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
	INVALID_IMAGE_DIMENSIONS = 'INVALID_IMAGE_DIMENSIONS',
	UPLOAD_FAILED = 'UPLOAD_FAILED',
	DELETE_FAILED = 'DELETE_FAILED',
	CLOUDINARY_ERROR = 'CLOUDINARY_ERROR',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Upload error response
 */
export interface UploadErrorResponse {
	success: false;
	error: UploadErrorType;
	message: string;
	details?: any;
}

/**
 * Supported file types
 */
export enum SupportedFileType {
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
	DOCUMENT = 'document',
}

/**
 * Image formats
 */
export enum ImageFormat {
	JPEG = 'jpeg',
	PNG = 'png',
	WEBP = 'webp',
	GIF = 'gif',
	AVIF = 'avif',
}

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (
	progress: number,
	bytesUploaded: number,
	totalBytes: number
) => void;

/**
 * Upload result with metadata
 */
export interface UploadResult {
	file: MulterFile;
	metadata: FileMetadata;
	cloudinaryUrl?: string;
	publicId?: string;
}

/**
 * File processing options
 */
export interface FileProcessingOptions {
	resize?: {
		width: number;
		height: number;
		fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
	};
	compress?: {
		quality: number;
		progressive?: boolean;
	};
	convert?: {
		format: ImageFormat;
	};
	watermark?: {
		text: string;
		position:
			| 'north'
			| 'northeast'
			| 'east'
			| 'southeast'
			| 'south'
			| 'southwest'
			| 'west'
			| 'northwest'
			| 'center';
		opacity?: number;
		fontSize?: number;
		color?: string;
	};
}

/**
 * Cloudinary upload options
 */
export interface CloudinaryUploadOptions {
	folder?: string;
	public_id?: string;
	resource_type?: 'image' | 'auto' | 'raw' | 'video';
	tags?: string[];
	context?: Record<string, any>;
	overwrite?: boolean;
	invalidate?: boolean;
	fetch_format?: boolean;
	use_filename?: boolean;
	unique_filename?: boolean;
	filename_override?: string;
	format?: string;
	transformation?: any;
}
