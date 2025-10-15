/**
 * Category Routes
 * Route definitions untuk category management endpoints (Public & Admin)
 */

import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public Category Routes

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', categoryController.getCategories);

/**
 * @route   GET /api/categories/popular
 * @desc    Get popular categories
 * @access  Public
 */
router.get('/popular', categoryController.getPopularCategories);

/**
 * @route   GET /api/categories/search
 * @desc    Search categories
 * @access  Public
 */
router.get('/search', categoryController.searchCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID or slug
 * @access  Public
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @route   GET /api/categories/:id/blogs
 * @desc    Get category with blog count
 * @access  Public
 */
router.get('/:id/blogs', categoryController.getCategoryWithBlogCount);

// Admin Category Routes

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private (Admin)
 */
router.post('/', requireAuth, requireAdmin, categoryController.createCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (Admin)
 */
router.put('/:id', requireAuth, requireAdmin, categoryController.updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (Admin)
 */
router.delete('/:id', requireAuth, requireAdmin, categoryController.deleteCategory);

export default router;
