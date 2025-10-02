/**
 * Project Types
 * Type definitions untuk project management
 */

/**
 * Project data yang ada di database
 */
export interface Project {
	id: string;
	title: string;
	description: string;
	imageUrl?: string;
	liveUrl?: string;
	githubUrl?: string;
	tags: string[];
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Project dengan relasi ke user
 */
export interface ProjectWithUser extends Project {
	creator: {
		id: string;
		name: string;
		email: string;
		role: string;
	};
}

/**
 * Project dengan images
 */
export interface ProjectWithImages extends ProjectWithUser {
	images: ProjectImage[];
}

/**
 * Project image data
 */
export interface ProjectImage {
	id: string;
	projectId: string;
	filename: string;
	originalName: string;
	path: string;
	size: number;
	mimeType: string;
	createdAt: Date;
}

/**
 * Create project request body
 */
export interface CreateProjectRequest {
	title: string;
	description: string;
	imageUrl?: string;
	liveUrl?: string;
	githubUrl?: string;
	tags: string[];
}

/**
 * Update project request body
 */
export interface UpdateProjectRequest {
	title?: string;
	description?: string;
	imageUrl?: string;
	liveUrl?: string;
	githubUrl?: string;
	tags?: string[];
}

/**
 * Project query parameters untuk filtering dan pagination
 */
export interface ProjectQuery {
	page?: number;
	limit?: number;
	search?: string;
	tags?: string[];
	createdBy?: string;
	sortBy?: 'createdAt' | 'updatedAt' | 'title';
	sortOrder?: 'asc' | 'desc';
}

/**
 * Project response dengan pagination
 */
export interface ProjectListResponse {
	projects: ProjectWithUser[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

/**
 * Project statistics
 */
export interface ProjectStats {
	total: number;
	published: number;
	draft: number;
	byTags: Record<string, number>;
	byCreator: Record<string, number>;
	recentProjects: ProjectWithUser[];
}

/**
 * Project filter options
 */
export interface ProjectFilterOptions {
	tags?: string[];
	creators?: string[];
	dateRange?: {
		start: Date;
		end: Date;
	};
	hasLiveUrl?: boolean;
	hasGithubUrl?: boolean;
}

/**
 * Project validation rules
 */
export interface ProjectValidationRules {
	title: {
		minLength: number;
		maxLength: number;
		required: boolean;
	};
	description: {
		minLength: number;
		maxLength: number;
		required: boolean;
	};
	tags: {
		minItems: number;
		maxItems: number;
		tagMaxLength: number;
	};
	urls: {
		maxLength: number;
		pattern: RegExp;
	};
}
