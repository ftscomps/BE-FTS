/**
 * Category Controller
 * HTTP request handlers untuk category CRUD operations
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { CategoryService } from '../services/categoryService';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get all categories (Public)
 */
export const getCategories = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { includeBlogCount } = req.query;

    // Create service instance
    const categoryService = new CategoryService();

    // Get categories
    const categories = await categoryService.getCategories(includeBlogCount === 'true');

    logger.info(`✅ Retrieved ${categories.length} categories`);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('❌ Get categories controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve categories',
    });
  }
};

/**
 * Get single category by ID atau slug (Public)
 */
export const getCategoryById = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Category ID or slug is required',
      });
      return;
    }

    // Create service instance
    const categoryService = new CategoryService();

    // Get category
    const category = await categoryService.getCategoryById(id);

    if (!category) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Category not found',
      });
      return;
    }

    logger.info(`✅ Retrieved category: ${category.name}`);

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error('❌ Get category by ID controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve category',
    });
  }
};

/**
 * Get category with blog count (Public)
 */
export const getCategoryWithBlogCount = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Category ID or slug is required',
      });
      return;
    }

    // Create service instance
    const categoryService = new CategoryService();

    // Get category with blog count
    const category = await categoryService.getCategoryWithBlogCount(id);

    if (!category) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Category not found',
      });
      return;
    }

    logger.info(`✅ Retrieved category with blog count: ${category.name}`);

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error('❌ Get category with blog count controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve category',
    });
  }
};

/**
 * Get popular categories (Public)
 */
export const getPopularCategories = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { limit } = req.query;

    // Create service instance
    const categoryService = new CategoryService();

    // Get popular categories
    const categories = await categoryService.getPopularCategories(
      limit ? parseInt(limit as string) : 10
    );

    logger.info(`✅ Retrieved ${categories.length} popular categories`);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('❌ Get popular categories controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve popular categories',
    });
  }
};

/**
 * Search categories (Public)
 */
export const searchCategories = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Search query is required',
      });
      return;
    }

    // Create service instance
    const categoryService = new CategoryService();

    // Search categories
    const categories = await categoryService.searchCategories(q);

    logger.info(`✅ Search categories: "${q}" - ${categories.length} results`);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('❌ Search categories controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search categories',
    });
  }
};

/**
 * Create new category (Admin)
 */
export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { name, description } = req.body;

    // Validate input
    if (!name || typeof name !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Category name is required',
      });
      return;
    }

    // Create service instance
    const categoryService = new CategoryService();

    // Create category
    const newCategory = await categoryService.createCategory({ name, description });

    logger.info(`✅ New category created: ${newCategory.name} by ${userId}`);

    res.status(201).json({
      success: true,
      data: newCategory,
    });
  } catch (error) {
    logger.error('❌ Create category controller error:', error);

    if (error instanceof Error) {
      if (error.message.includes('required') || error.message.includes('must be')) {
        res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
        return;
      }
      if (error.message.includes('already exists')) {
        res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create category',
    });
  }
};

/**
 * Update category (Admin)
 */
export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Category ID is required',
      });
      return;
    }

    const { name, description } = req.body;

    // Validate that at least one field is provided
    if (!name && description === undefined) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'At least one field must be provided for update',
      });
      return;
    }

    // Create service instance
    const categoryService = new CategoryService();

    // Update category
    const updatedCategory = await categoryService.updateCategory(id, { name, description });

    logger.info(`✅ Category updated: ${updatedCategory.name} by ${userId}`);

    res.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    logger.error('❌ Update category controller error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
        return;
      }
      if (error.message.includes('required') || error.message.includes('must be')) {
        res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
        return;
      }
      if (error.message.includes('already exists')) {
        res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update category',
    });
  }
};

/**
 * Delete category (Admin)
 */
export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Category ID is required',
      });
      return;
    }

    // Create service instance
    const categoryService = new CategoryService();

    // Delete category
    await categoryService.deleteCategory(id);

    logger.info(`✅ Category deleted: ${id} by ${userId}`);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    logger.error('❌ Delete category controller error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
        return;
      }
      if (error.message.includes('has blogs')) {
        res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete category',
    });
  }
};
