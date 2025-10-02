/**
 * Environment Variables Type Definitions
 * Type safety untuk process.env variables
 */

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			// Server Configuration
			NODE_ENV: 'development' | 'production' | 'test';
			PORT: string;
			API_VERSION: string;

			// Database
			DATABASE_URL: string;

			// JWT Secrets
			JWT_SECRET: string;
			JWT_REFRESH_SECRET: string;
			JWT_EXPIRES_IN: string;
			JWT_REFRESH_EXPIRES_IN: string;

			// File Upload
			UPLOAD_DIR: string;
			MAX_FILE_SIZE: string;
			ALLOWED_FILE_TYPES: string;

			// Cloud Storage
			CLOUDINARY_CLOUD_NAME: string;
			CLOUDINARY_API_KEY: string;
			CLOUDINARY_API_SECRET: string;
			CLOUDINARY_FOLDER: string;

			// CORS
			FRONTEND_URL: string;
			ALLOWED_ORIGINS: string;

			// Logging
			LOG_LEVEL: string;
			LOG_FILE: string;

			// Rate Limiting
			RATE_LIMIT_WINDOW_MS: string;
			RATE_LIMIT_MAX_REQUESTS: string;

			// Admin Default Credentials (for seeding)
			DEFAULT_ADMIN_EMAIL: string;
			DEFAULT_ADMIN_PASSWORD: string;
			DEFAULT_ADMIN_NAME: string;
			DEFAULT_ADMIN_ROLE: string;

			// npm package version (injected by npm)
			npm_package_version?: string;
		}
	}
}

export {};
