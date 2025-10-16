/**
 * Blog Routes
 * Route definitions untuk blog management endpoints (Public & Admin)
 */

import { Router } from 'express';
import * as blogController from '../controllers/blogController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public Blog Routes

/**
 * @route   GET /api/blogs
 * @desc    Get all published blogs with pagination and filtering
 * @access  Public
 */
router.get('/', blogController.getBlogs);

/**
 * @route   GET /api/blogs/stats
 * @desc    Get blog statistics
 * @access  Public
 */
router.get('/stats', blogController.getBlogStats);

/**
 * @route   GET /api/blogs/search
 * @desc    Search published blogs
 * @access  Public
 */
router.get('/search', blogController.searchBlogs);

/**
 * @route   GET /api/blogs/:id
 * @desc    Get single blog by ID or slug
 * @access  Public
 */
router.get('/:id', blogController.getBlogById);

/**
 * @route   GET /api/blogs/:id/related
 * @desc    Get related blogs
 * @access  Public
 */
router.get('/:id/related', blogController.getRelatedBlogs);

/**
 * @route   POST /api/blogs/:id/view
 * @desc    Track blog view - increment view counter dan store view analytics
 * @access  Public (no auth needed untuk tracking)
 */
router.post('/:id/view', blogController.trackBlogView);

// Admin Blog Routes

/**
 * @route   GET /api/blogs/admin/all
 * @desc    Get all blogs for admin (including drafts)
 * @access  Private (Admin)
 */
router.get('/admin/all', requireAuth, requireAdmin, blogController.getAdminBlogs);

/**
 * @route   POST /api/blogs
 * @desc    Create new blog
 * @access  Private (Admin)
 */
router.post('/', requireAuth, requireAdmin, blogController.createBlog);

/**
 * @route   PUT /api/blogs/:id
 * @desc    Update blog
 * @access  Private (Admin)
 */
router.put('/:id', requireAuth, requireAdmin, blogController.updateBlog);

/**
 * @route   DELETE /api/blogs/:id
 * @desc    Delete blog
 * @access  Private (Admin)
 */
router.delete('/:id', requireAuth, requireAdmin, blogController.deleteBlog);

/**
 * @route   POST /api/blogs/:id/publish
 * @desc    Publish/Unpublish blog
 * @access  Private (Admin)
 */
router.post('/:id/publish', requireAuth, requireAdmin, blogController.publishBlog);

export default router;
