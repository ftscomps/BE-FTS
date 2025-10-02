/**
 * Activity Routes
 * Route definitions untuk activity logging endpoints
 */

import { Router } from 'express';
import * as activityController from '../controllers/activityController';
import { requireAuth, requireSuperAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/activity/logs
 * @desc    Get activity logs dengan filtering dan pagination
 * @access  Private
 */
router.get('/logs', requireAuth, activityController.getActivityLogs);

/**
 * @route   GET /api/activity/stats
 * @desc    Get activity statistics
 * @access  Private
 */
router.get('/stats', requireAuth, activityController.getActivityStats);

/**
 * @route   GET /api/activity/users/:targetUserId/logs
 * @desc    Get user activity logs (super admin only)
 * @access  Super Admin
 */
router.get('/users/:targetUserId/logs', requireSuperAdmin, activityController.getUserActivityLogs);

/**
 * @route   GET /api/activity/users/:targetUserId/stats
 * @desc    Get user activity statistics (super admin only)
 * @access  Super Admin
 */
router.get(
	'/users/:targetUserId/stats',
	requireSuperAdmin,
	activityController.getUserActivityStats
);

/**
 * @route   GET /api/activity/export
 * @desc    Export activity logs (super admin only)
 * @access  Super Admin
 */
router.get('/export', requireSuperAdmin, activityController.exportActivityLogs);

export default router;
