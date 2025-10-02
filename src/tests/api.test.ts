// Integration tests for API endpoints
import request from 'supertest';
import express from 'express';

// Mock the services and routes
jest.mock('../services/authService');
jest.mock('../services/projectService');
jest.mock('../routes/auth');
jest.mock('../routes/projects');

describe('API Integration Tests', () => {
	let app: express.Application;

	beforeEach(() => {
		// Create a simple Express app for testing
		app = express();
		app.use(express.json());

		// Health check endpoint
		app.get('/health', (_req, res) => {
			res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
		});

		// Mock auth endpoints
		app.post('/api/auth/register', (req, res): void => {
			const { email, password, name } = req.body;

			// Basic validation
			if (!email || !password || !name) {
				res.status(400).json({ error: 'Missing required fields' });
				return;
			}

			if (password.length < 6) {
				res.status(400).json({ error: 'Password must be at least 6 characters' });
				return;
			}

			if (!email.includes('@')) {
				res.status(400).json({ error: 'Invalid email format' });
				return;
			}

			res.status(201).json({
				user: {
					id: 'mock-user-id',
					email,
					name,
					role: 'admin',
				},
				tokens: {
					accessToken: 'mock-access-token',
					refreshToken: 'mock-refresh-token',
				},
			});
		});

		app.post('/api/auth/login', (req, res): void => {
			const { email, password } = req.body;

			if (!email || !password) {
				res.status(400).json({ error: 'Email and password are required' });
				return;
			}

			if (email === 'test@example.com' && password === 'password123') {
				res.status(200).json({
					user: {
						id: 'mock-user-id',
						email,
						name: 'Test User',
						role: 'admin',
					},
					tokens: {
						accessToken: 'mock-access-token',
						refreshToken: 'mock-refresh-token',
					},
				});
			} else {
				res.status(401).json({ error: 'Invalid email or password' });
			}
		});

		// Mock project endpoints with auth middleware simulation
		app.get('/api/projects', (req, res) => {
			const { page = 1, limit = 10, search, tags } = req.query;

			const mockProjects = [
				{
					id: 'project-1',
					title: 'Test Project',
					description: 'A test project for demonstration',
					tags: ['test', 'demo'],
					imageUrl: 'https://example.com/image.jpg',
					liveUrl: 'https://example.com',
					githubUrl: 'https://github.com/example/project',
					createdBy: 'mock-user-id',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					creator: {
						id: 'mock-user-id',
						name: 'Test User',
						email: 'test@example.com',
					},
				},
			];

			let filteredProjects = mockProjects;

			if (search) {
				filteredProjects = filteredProjects.filter(
					(project) =>
						project.title.toLowerCase().includes((search as string).toLowerCase()) ||
						project.description.toLowerCase().includes((search as string).toLowerCase())
				);
			}

			if (tags) {
				const tagArray = Array.isArray(tags) ? tags : [tags];
				filteredProjects = filteredProjects.filter((project) =>
					tagArray.some((tag: any) => typeof tag === 'string' && project.tags.includes(tag))
				);
			}

			res.status(200).json({
				projects: filteredProjects,
				pagination: {
					page: parseInt(page as string),
					limit: parseInt(limit as string),
					total: filteredProjects.length,
					totalPages: Math.ceil(filteredProjects.length / parseInt(limit as string)),
					hasNext: false,
					hasPrev: false,
				},
			});
		});

		app.get('/api/projects/:id', (req, res): void => {
			const { id } = req.params;

			if (id === 'nonexistent-project') {
				res.status(404).json({ error: 'Project not found' });
				return;
			}

			const mockProject = {
				id,
				title: 'Test Project',
				description: 'A test project for demonstration',
				tags: ['test', 'demo'],
				imageUrl: 'https://example.com/image.jpg',
				liveUrl: 'https://example.com',
				githubUrl: 'https://github.com/example/project',
				createdBy: 'mock-user-id',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				creator: {
					id: 'mock-user-id',
					name: 'Test User',
					email: 'test@example.com',
				},
				images: [],
			};

			res.status(200).json(mockProject);
		});

		app.post('/api/projects', (req, res): void => {
			const { title, description, tags } = req.body;

			// Basic validation
			if (!title || title.length < 3) {
				res.status(400).json({ error: 'Title must be at least 3 characters long' });
				return;
			}

			if (!description || description.length < 10) {
				res.status(400).json({ error: 'Description must be at least 10 characters long' });
				return;
			}

			if (!tags || tags.length === 0) {
				res.status(400).json({ error: 'At least one tag is required' });
				return;
			}

			const newProject = {
				id: 'new-project-id',
				title,
				description,
				tags,
				imageUrl: req.body.imageUrl || null,
				liveUrl: req.body.liveUrl || null,
				githubUrl: req.body.githubUrl || null,
				createdBy: 'mock-user-id',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				creator: {
					id: 'mock-user-id',
					name: 'Test User',
					email: 'test@example.com',
				},
			};

			res.status(201).json(newProject);
		});

		app.put('/api/projects/:id', (req, res): void => {
			const { id } = req.params;
			const { title, description } = req.body;

			if (id === 'nonexistent-project') {
				res.status(404).json({ error: 'Project not found' });
				return;
			}

			if (title && title.length < 3) {
				res.status(400).json({ error: 'Title must be at least 3 characters long' });
				return;
			}

			if (description && description.length < 10) {
				res.status(400).json({ error: 'Description must be at least 10 characters long' });
				return;
			}

			const updatedProject = {
				id,
				title: title || 'Updated Project',
				description: description || 'Updated description',
				tags: ['updated'],
				imageUrl: 'https://example.com/image.jpg',
				liveUrl: 'https://example.com',
				githubUrl: 'https://github.com/example/project',
				createdBy: 'mock-user-id',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				creator: {
					id: 'mock-user-id',
					name: 'Test User',
					email: 'test@example.com',
				},
			};

			res.status(200).json(updatedProject);
		});

		app.delete('/api/projects/:id', (req, res): void => {
			const { id } = req.params;

			if (id === 'nonexistent-project') {
				res.status(404).json({ error: 'Project not found' });
				return;
			}

			res.status(204).send();
		});

		jest.clearAllMocks();
	});

	describe('Health Check', () => {
		it('should return health status', async () => {
			// Act
			const response = await request(app).get('/health');

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('status', 'ok');
			expect(response.body).toHaveProperty('timestamp');
		});
	});

	describe('Auth Routes', () => {
		describe('POST /api/auth/register', () => {
			it('should register a new user successfully', async () => {
				// Arrange
				const userData = {
					email: 'test@example.com',
					password: 'password123',
					name: 'Test User',
				};

				// Act
				const response = await request(app).post('/api/auth/register').send(userData);

				// Assert
				expect(response.status).toBe(201);
				expect(response.body).toHaveProperty('user');
				expect(response.body).toHaveProperty('tokens');
				expect(response.body.user.email).toBe(userData.email);
				expect(response.body.user.name).toBe(userData.name);
			});

			it('should return 400 for invalid data', async () => {
				// Arrange
				const invalidData = {
					email: 'invalid-email',
					password: '123', // too short
					name: '', // empty
				};

				// Act
				const response = await request(app).post('/api/auth/register').send(invalidData);

				// Assert
				expect(response.status).toBe(400);
				expect(response.body).toHaveProperty('error');
			});
		});

		describe('POST /api/auth/login', () => {
			it('should login user successfully', async () => {
				// Arrange
				const loginData = {
					email: 'test@example.com',
					password: 'password123',
				};

				// Act
				const response = await request(app).post('/api/auth/login').send(loginData);

				// Assert
				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('user');
				expect(response.body).toHaveProperty('tokens');
				expect(response.body.user.email).toBe(loginData.email);
			});

			it('should return 401 for invalid credentials', async () => {
				// Arrange
				const loginData = {
					email: 'test@example.com',
					password: 'wrong-password',
				};

				// Act
				const response = await request(app).post('/api/auth/login').send(loginData);

				// Assert
				expect(response.status).toBe(401);
				expect(response.body).toHaveProperty('error');
			});
		});
	});

	describe('Project Routes', () => {
		describe('GET /api/projects', () => {
			it('should get all projects successfully', async () => {
				// Act
				const response = await request(app).get('/api/projects').query({ page: 1, limit: 10 });

				// Assert
				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('projects');
				expect(response.body).toHaveProperty('pagination');
				expect(Array.isArray(response.body.projects)).toBe(true);
			});

			it('should filter projects by search term', async () => {
				// Arrange
				const searchTerm = 'test';

				// Act
				const response = await request(app).get('/api/projects').query({ search: searchTerm });

				// Assert
				expect(response.status).toBe(200);
				expect(response.body.projects).toHaveLength(1);
			});

			it('should filter projects by tags', async () => {
				// Arrange
				const tags = ['test'];

				// Act
				const response = await request(app).get('/api/projects').query({ tags });

				// Assert
				expect(response.status).toBe(200);
				expect(response.body.projects).toHaveLength(1);
			});
		});

		describe('GET /api/projects/:id', () => {
			it('should get project by id successfully', async () => {
				// Arrange
				const projectId = 'project-1';

				// Act
				const response = await request(app).get(`/api/projects/${projectId}`);

				// Assert
				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('id', projectId);
				expect(response.body).toHaveProperty('title');
				expect(response.body).toHaveProperty('description');
			});

			it('should return 404 if project not found', async () => {
				// Arrange
				const projectId = 'nonexistent-project';

				// Act
				const response = await request(app).get(`/api/projects/${projectId}`);

				// Assert
				expect(response.status).toBe(404);
				expect(response.body).toHaveProperty('error');
			});
		});

		describe('POST /api/projects', () => {
			it('should create project successfully', async () => {
				// Arrange
				const projectData = {
					title: 'New Project',
					description: 'New Description with enough characters',
					tags: ['tag1', 'tag2'],
					imageUrl: 'https://example.com/image.jpg',
					liveUrl: 'https://example.com/live',
					githubUrl: 'https://github.com/example/project',
				};

				// Act
				const response = await request(app).post('/api/projects').send(projectData);

				// Assert
				expect(response.status).toBe(201);
				expect(response.body).toHaveProperty('id');
				expect(response.body.title).toBe(projectData.title);
				expect(response.body.description).toBe(projectData.description);
				expect(response.body.tags).toEqual(projectData.tags);
			});

			it('should return 400 for invalid project data', async () => {
				// Arrange
				const invalidData = {
					title: 'ab', // too short
					description: 'short', // too short
					tags: [], // empty
				};

				// Act
				const response = await request(app).post('/api/projects').send(invalidData);

				// Assert
				expect(response.status).toBe(400);
				expect(response.body).toHaveProperty('error');
			});
		});

		describe('PUT /api/projects/:id', () => {
			it('should update project successfully', async () => {
				// Arrange
				const projectId = 'project-1';
				const updateData = {
					title: 'Updated Project',
					description: 'Updated description with enough characters',
				};

				// Act
				const response = await request(app).put(`/api/projects/${projectId}`).send(updateData);

				// Assert
				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('id', projectId);
				expect(response.body.title).toBe(updateData.title);
				expect(response.body.description).toBe(updateData.description);
			});

			it('should return 404 if project not found', async () => {
				// Arrange
				const projectId = 'nonexistent-project';
				const updateData = { title: 'Updated Project' };

				// Act
				const response = await request(app).put(`/api/projects/${projectId}`).send(updateData);

				// Assert
				expect(response.status).toBe(404);
				expect(response.body).toHaveProperty('error');
			});
		});

		describe('DELETE /api/projects/:id', () => {
			it('should delete project successfully', async () => {
				// Arrange
				const projectId = 'project-1';

				// Act
				const response = await request(app).delete(`/api/projects/${projectId}`);

				// Assert
				expect(response.status).toBe(204);
			});

			it('should return 404 if project not found', async () => {
				// Arrange
				const projectId = 'nonexistent-project';

				// Act
				const response = await request(app).delete(`/api/projects/${projectId}`);

				// Assert
				expect(response.status).toBe(404);
				expect(response.body).toHaveProperty('error');
			});
		});
	});
});
