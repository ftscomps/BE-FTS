/**
 * User Routes
 * Route definitions untuk user management endpoints
 */

import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth, requireSuperAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users dengan pagination dan filtering
 * @access  Super Admin
 */
router.get('/', requireAuth, requireSuperAdmin, userController.getUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Super Admin
 */
router.get('/stats', requireAuth, requireSuperAdmin, userController.getUserStats);

/**
 * @route   GET /api/users/validation-rules
 * @desc    Get user validation rules
 * @access  Public
 */
router.get('/validation-rules', userController.getUserValidationRules);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (own profile or super admin)
 */
router.get('/:id', requireAuth, userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Super Admin
 */
router.post('/', requireAuth, requireSuperAdmin, userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (own profile or super admin)
 */
router.put('/:id', requireAuth, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Super Admin
 */
router.delete('/:id', requireAuth, requireSuperAdmin, userController.deleteUser);

/**
 * @route   POST /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', requireAuth, userController.changePassword);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', requireAuth, userController.getUserProfile);

export default router;
