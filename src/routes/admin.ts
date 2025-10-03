/**
 * Admin Routes
 * Route definitions untuk admin management endpoints
 */

import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { requireAuth } from '../middleware/auth';
import { requireSuperAdmin, requireAdmin } from '../middleware/requireSuperAdmin';

const router = Router();

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (super admin only)
 * @access  Private (Super Admin)
 */
router.get('/users', requireAuth, requireSuperAdmin, adminController.getUsers);

/**
 * @route   POST /api/admin/users
 * @desc    Create new user (super admin only)
 * @access  Private (Super Admin)
 */
router.post('/users', requireAuth, requireSuperAdmin, adminController.createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user (super admin only)
 * @access  Private (Super Admin)
 */
router.put('/users/:id', requireAuth, requireSuperAdmin, adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (super admin only)
 * @access  Private (Super Admin)
 */
router.delete('/users/:id', requireAuth, requireSuperAdmin, adminController.deleteUser);

/**
 * @route   GET /api/admin/logs
 * @desc    Get activity logs (super admin only)
 * @access  Private (Super Admin)
 */
router.get('/logs', requireAuth, requireSuperAdmin, adminController.getActivityLogs);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics (admin and super admin)
 * @access  Private (Admin or Super Admin)
 */
router.get('/stats', requireAuth, requireAdmin, adminController.getDashboardStats);

export default router;
