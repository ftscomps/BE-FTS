/**
 * Tag Routes
 * Route definitions untuk tag management endpoints (Public & Admin)
 */

import { Router } from 'express';
import * as tagController from '../controllers/tagController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public Tag Routes

/**
 * @route   GET /api/tags
 * @desc    Get all tags
 * @access  Public
 */
router.get('/', tagController.getTags);

/**
 * @route   GET /api/tags/popular
 * @desc    Get popular tags
 * @access  Public
 */
router.get('/popular', tagController.getPopularTags);

/**
 * @route   GET /api/tags/search
 * @desc    Search tags
 * @access  Public
 */
router.get('/search', tagController.searchTags);

/**
 * @route   GET /api/tags/:id
 * @desc    Get single tag by ID or slug
 * @access  Public
 */
router.get('/:id', tagController.getTagById);

/**
 * @route   GET /api/tags/:id/blogs
 * @desc    Get tag with blog count
 * @access  Public
 */
router.get('/:id/blogs', tagController.getTagWithBlogCount);

/**
 * @route   GET /api/tags/blog/:blogId
 * @desc    Get tags by blog ID
 * @access  Public
 */
router.get('/blog/:blogId', tagController.getTagsByBlogId);

// Admin Tag Routes

/**
 * @route   POST /api/tags
 * @desc    Create new tag
 * @access  Private (Admin)
 */
router.post('/', requireAuth, requireAdmin, tagController.createTag);

/**
 * @route   POST /api/tags/bulk
 * @desc    Create multiple tags
 * @access  Private (Admin)
 */
router.post('/bulk', requireAuth, requireAdmin, tagController.createMultipleTags);

/**
 * @route   PUT /api/tags/:id
 * @desc    Update tag
 * @access  Private (Admin)
 */
router.put('/:id', requireAuth, requireAdmin, tagController.updateTag);

/**
 * @route   DELETE /api/tags/:id
 * @desc    Delete tag
 * @access  Private (Admin)
 */
router.delete('/:id', requireAuth, requireAdmin, tagController.deleteTag);

/**
 * @route   GET /api/tags/admin/unused
 * @desc    Get unused tags
 * @access  Private (Admin)
 */
router.get('/admin/unused', requireAuth, requireAdmin, tagController.getUnusedTags);

/**
 * @route   DELETE /api/tags/admin/cleanup
 * @desc    Cleanup unused tags
 * @access  Private (Admin)
 */
router.delete('/admin/cleanup', requireAuth, requireAdmin, tagController.cleanupUnusedTags);

export default router;
