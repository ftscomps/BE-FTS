// Unit tests for project service
import { ProjectService } from '../services/projectService';
import { PrismaClient } from '@prisma/client';

describe('ProjectService', () => {
	let projectService: ProjectService;
	let prismaMock: any;

	beforeEach(() => {
		// Create a fresh mock for each test
		prismaMock = {
			project: {
				findUnique: jest.fn(),
				findMany: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
				delete: jest.fn(),
				count: jest.fn(),
			},
			activityLog: {
				create: jest.fn(),
			},
			$connect: jest.fn(),
			$disconnect: jest.fn(),
			$on: jest.fn(),
		};

		projectService = new ProjectService(prismaMock as any);
		jest.clearAllMocks();
	});

	describe('getProjects', () => {
		it('should get all projects successfully', async () => {
			// Arrange
			const mockProjects = [
				{
					id: 'project-1',
					title: 'Project 1',
					description: 'Description 1',
					imageUrl: 'https://example.com/image1.jpg',
					liveUrl: 'https://example.com/live1',
					githubUrl: 'https://github.com/example/project1',
					tags: ['tag1', 'tag2'],
					createdBy: 'user-1',
					createdAt: new Date(),
					updatedAt: new Date(),
					creator: {
						id: 'user-1',
						name: 'User 1',
						email: 'user1@example.com',
						role: 'admin',
					},
				},
				{
					id: 'project-2',
					title: 'Project 2',
					description: 'Description 2',
					imageUrl: 'https://example.com/image2.jpg',
					liveUrl: 'https://example.com/live2',
					githubUrl: 'https://github.com/example/project2',
					tags: ['tag3', 'tag4'],
					createdBy: 'user-2',
					createdAt: new Date(),
					updatedAt: new Date(),
					creator: {
						id: 'user-2',
						name: 'User 2',
						email: 'user2@example.com',
						role: 'admin',
					},
				},
			];

			prismaMock.project.findMany.mockResolvedValue(mockProjects);
			prismaMock.project.count.mockResolvedValue(2);

			// Act
			const result = await projectService.getProjects({
				page: 1,
				limit: 10,
				search: '',
				tags: [],
			});

			// Assert
			expect(prismaMock.project.findMany).toHaveBeenCalledWith({
				skip: 0,
				take: 10,
				where: {},
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});
			expect(result.projects).toEqual(mockProjects);
			expect(result.pagination).toEqual({
				page: 1,
				limit: 10,
				total: 2,
				totalPages: 1,
				hasNext: false,
				hasPrev: false,
			});
		});

		it('should filter projects by search term', async () => {
			// Arrange
			const searchTerm = 'test project';
			prismaMock.project.findMany.mockResolvedValue([]);
			prismaMock.project.count.mockResolvedValue(0);

			// Act
			await projectService.getProjects({
				page: 1,
				limit: 10,
				search: searchTerm,
				tags: [],
			});

			// Assert
			expect(prismaMock.project.findMany).toHaveBeenCalledWith({
				skip: 0,
				take: 10,
				where: {
					OR: [
						{ title: { contains: searchTerm, mode: 'insensitive' } },
						{ description: { contains: searchTerm, mode: 'insensitive' } },
					],
				},
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});
		});

		it('should filter projects by tags', async () => {
			// Arrange
			const tags = ['web', 'react'];
			prismaMock.project.findMany.mockResolvedValue([]);
			prismaMock.project.count.mockResolvedValue(0);

			// Act
			await projectService.getProjects({
				page: 1,
				limit: 10,
				search: '',
				tags,
			});

			// Assert
			expect(prismaMock.project.findMany).toHaveBeenCalledWith({
				skip: 0,
				take: 10,
				where: {
					tags: {
						hasSome: tags,
					},
				},
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});
		});
	});

	describe('getProjectById', () => {
		it('should get project by id successfully', async () => {
			// Arrange
			const projectId = 'project-1';
			const mockProject = {
				id: projectId,
				title: 'Project 1',
				description: 'Description 1',
				imageUrl: 'https://example.com/image1.jpg',
				liveUrl: 'https://example.com/live1',
				githubUrl: 'https://github.com/example/project1',
				tags: ['tag1', 'tag2'],
				createdBy: 'user-1',
				createdAt: new Date(),
				updatedAt: new Date(),
				creator: {
					id: 'user-1',
					name: 'User 1',
					email: 'user1@example.com',
					role: 'admin',
				},
				images: [],
			};

			prismaMock.project.findUnique.mockResolvedValue(mockProject);

			// Act
			const result = await projectService.getProjectById(projectId);

			// Assert
			expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
				where: { id: projectId },
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
					images: true,
				},
			});
			expect(result).toEqual(mockProject);
		});

		it('should return null if project not found', async () => {
			// Arrange
			const projectId = 'nonexistent-project';
			prismaMock.project.findUnique.mockResolvedValue(null);

			// Act
			const result = await projectService.getProjectById(projectId);

			// Assert
			expect(result).toBeNull();
		});
	});

	describe('createProject', () => {
		it('should create project successfully', async () => {
			// Arrange
			const projectData = {
				title: 'New Project',
				description: 'New Description',
				imageUrl: 'https://example.com/image.jpg',
				liveUrl: 'https://example.com/live',
				githubUrl: 'https://github.com/example/project',
				tags: ['tag1', 'tag2'],
			};

			const createdProject = {
				id: 'new-project-id',
				...projectData,
				createdBy: 'user-1',
				createdAt: new Date(),
				updatedAt: new Date(),
				creator: {
					id: 'user-1',
					name: 'User 1',
					email: 'user1@example.com',
					role: 'admin',
				},
			};

			prismaMock.project.create.mockResolvedValue(createdProject);
			prismaMock.activityLog.create.mockResolvedValue({});

			// Act
			const result = await projectService.createProject(projectData, 'user-1');

			// Assert
			expect(prismaMock.project.create).toHaveBeenCalledWith({
				data: {
					...projectData,
					createdBy: 'user-1',
				},
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
				},
			});
			expect(result).toEqual(createdProject);
		});
	});

	describe('updateProject', () => {
		it('should update project successfully', async () => {
			// Arrange
			const projectId = 'project-1';
			const updateData = {
				title: 'Updated Project',
				description: 'Updated Description',
			};

			const existingProject = {
				id: projectId,
				title: 'Original Project',
				description: 'Original Description',
				imageUrl: 'https://example.com/image.jpg',
				liveUrl: 'https://example.com/live',
				githubUrl: 'https://github.com/example/project',
				tags: ['tag1', 'tag2'],
				createdBy: 'user-1',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const updatedProject = {
				...existingProject,
				...updateData,
				updatedAt: new Date(),
				creator: {
					id: 'user-1',
					name: 'User 1',
					email: 'user1@example.com',
					role: 'admin',
				},
			};

			prismaMock.project.findUnique.mockResolvedValue(existingProject);
			prismaMock.project.update.mockResolvedValue(updatedProject);
			prismaMock.activityLog.create.mockResolvedValue({});

			// Act
			const result = await projectService.updateProject(projectId, updateData, 'user-1');

			// Assert
			expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
				where: { id: projectId },
			});
			expect(prismaMock.project.update).toHaveBeenCalledWith({
				where: { id: projectId },
				data: updateData,
				include: {
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
				},
			});
			expect(result).toEqual(updatedProject);
		});

		it('should throw error if project not found', async () => {
			// Arrange
			const projectId = 'nonexistent-project';
			const updateData = {
				title: 'Updated Project',
			};

			prismaMock.project.findUnique.mockResolvedValue(null);

			// Act & Assert
			await expect(projectService.updateProject(projectId, updateData, 'user-1')).rejects.toThrow(
				'Project not found'
			);
		});
	});

	describe('deleteProject', () => {
		it('should delete project successfully', async () => {
			// Arrange
			const projectId = 'project-1';
			const existingProject = {
				id: projectId,
				title: 'Project to Delete',
				description: 'Description',
				imageUrl: 'https://example.com/image.jpg',
				liveUrl: 'https://example.com/live',
				githubUrl: 'https://github.com/example/project',
				tags: ['tag1', 'tag2'],
				createdBy: 'user-1',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			prismaMock.project.findUnique.mockResolvedValue(existingProject);
			prismaMock.project.delete.mockResolvedValue(existingProject);
			prismaMock.activityLog.create.mockResolvedValue({});

			// Act
			await projectService.deleteProject(projectId, 'user-1');

			// Assert
			expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
				where: { id: projectId },
			});
			expect(prismaMock.project.delete).toHaveBeenCalledWith({
				where: { id: projectId },
			});
		});

		it('should throw error if project not found', async () => {
			// Arrange
			const projectId = 'nonexistent-project';
			prismaMock.project.findUnique.mockResolvedValue(null);

			// Act & Assert
			await expect(projectService.deleteProject(projectId, 'user-1')).rejects.toThrow(
				'Project not found'
			);
		});
	});
});
