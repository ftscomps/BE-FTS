/**
 * Express App Configuration
 * Main application setup dengan middleware dan routes
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import uploadRoutes from './routes/upload';
import activityRoutes from './routes/activity';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import healthRoutes from './routes/health';

// Import middleware
import { errorHandler } from './middleware/errorHandler';

/**
 * Create Express application dengan semua middleware dan configuration
 */
const app: Application = express();

// Trust proxy untuk rate limiting dan IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				scriptSrc: ["'self'"],
				imgSrc: ["'self'", 'data:', 'https:'],
			},
		},
		crossOriginEmbedderPolicy: false,
	})
);

// CORS configuration
const corsOptions = {
	origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
		const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:5173'];

		// Allow requests dengan no origin (mobile apps, curl, etc.)
		if (!origin) return callback(null, true);

		if (allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'), false);
		}
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Rate limiting configuration
const limiter = rateLimit({
	windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
	max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
	message: {
		error: 'Too many requests from this IP, please try again later.',
	},
	standardHeaders: true,
	legacyHeaders: false,
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
	logger.http(`${req.method} ${req.originalUrl} - ${req.ip}`);
	next();
});

// Health check routes
app.use('/health', healthRoutes);

// API routes
const API_VERSION = process.env['API_VERSION'] || 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);
app.use(`${API_PREFIX}/activity`, activityRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// Temporary root endpoint
app.get('/', (_req: Request, res: Response) => {
	res.json({
		message: '🚀 FTS Backend API is running!',
		version: API_VERSION,
		documentation: `${API_PREFIX}/docs`,
		health: '/health',
	});
});

// API info endpoint
app.get(API_PREFIX, (_req: Request, res: Response) => {
	res.json({
		name: 'FTS Backend API',
		version: API_VERSION,
		description:
			'Fujiyama Technology Solutions Backend API - RESTful API untuk admin dashboard dan project management',
		endpoints: {
			auth: `${API_PREFIX}/auth`,
			projects: `${API_PREFIX}/projects`,
			upload: `${API_PREFIX}/upload`,
			users: `${API_PREFIX}/users`,
			admin: `${API_PREFIX}/admin`,
		},
		documentation: `${API_PREFIX}/docs`,
		health: '/health',
	});
});

// 404 handler
app.use((req: Request, res: Response, _next: NextFunction) => {
	res.status(404).json({
		error: 'Not Found',
		message: `Route ${req.originalUrl} not found`,
		availableEndpoints: [
			'/',
			'/health',
			'/health/detailed',
			'/health/ready',
			'/health/live',
			`${API_PREFIX}`,
			`${API_PREFIX}/auth`,
			`${API_PREFIX}/projects`,
			`${API_PREFIX}/upload`,
			`${API_PREFIX}/activity`,
			`${API_PREFIX}/users`,
			`${API_PREFIX}/admin`,
		],
	});
});

// Error handler middleware
app.use(errorHandler);

export default app;
