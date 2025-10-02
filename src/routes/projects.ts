/**
 * Project Routes
 * Route definitions untuk project management endpoints
 */

import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/projects
 * @desc    Get all projects with pagination and filtering
 * @access  Public
 */
router.get('/', projectController.getProjects);

/**
 * @route   GET /api/projects/stats
 * @desc    Get project statistics
 * @access  Public
 */
router.get('/stats', projectController.getProjectStats);

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Public
 */
router.get('/:id', projectController.getProjectById);

/**
 * @route   GET /api/projects/:id/images
 * @desc    Get project images
 * @access  Public
 */
router.get('/:id/images', projectController.getProjectImages);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private
 */
router.post('/', requireAuth, projectController.createProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private
 */
router.put('/:id', requireAuth, projectController.updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private
 */
router.delete('/:id', requireAuth, projectController.deleteProject);

export default router;
