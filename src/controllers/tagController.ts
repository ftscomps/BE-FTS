/**
 * Tag Controller
 * HTTP request handlers untuk tag CRUD operations
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { TagService } from '../services/tagService';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get all tags (Public)
 */
export const getTags = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { includeBlogCount } = req.query;

    // Create service instance
    const tagService = new TagService();

    // Get tags
    const tags = await tagService.getTags(includeBlogCount === 'true');

    logger.info(`✅ Retrieved ${tags.length} tags`);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    logger.error('❌ Get tags controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve tags',
    });
  }
};

/**
 * Get single tag by ID atau slug (Public)
 */
export const getTagById = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Tag ID or slug is required',
      });
      return;
    }

    // Create service instance
    const tagService = new TagService();

    // Get tag
    const tag = await tagService.getTagById(id);

    if (!tag) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Tag not found',
      });
      return;
    }

    logger.info(`✅ Retrieved tag: ${tag.name}`);

    res.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    logger.error('❌ Get tag by ID controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve tag',
    });
  }
};

/**
 * Get tag with blog count (Public)
 */
export const getTagWithBlogCount = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Tag ID or slug is required',
      });
      return;
    }

    // Create service instance
    const tagService = new TagService();

    // Get tag with blog count
    const tag = await tagService.getTagWithBlogCount(id);

    if (!tag) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Tag not found',
      });
      return;
    }

    logger.info(`✅ Retrieved tag with blog count: ${tag.name}`);

    res.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    logger.error('❌ Get tag with blog count controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve tag',
    });
  }
};

/**
 * Get popular tags (Public)
 */
export const getPopularTags = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { limit } = req.query;

    // Create service instance
    const tagService = new TagService();

    // Get popular tags
    const tags = await tagService.getPopularTags(limit ? parseInt(limit as string) : 20);

    logger.info(`✅ Retrieved ${tags.length} popular tags`);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    logger.error('❌ Get popular tags controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve popular tags',
    });
  }
};

/**
 * Search tags (Public)
 */
export const searchTags = async (
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
    const tagService = new TagService();

    // Search tags
    const tags = await tagService.searchTags(q);

    logger.info(`✅ Search tags: "${q}" - ${tags.length} results`);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    logger.error('❌ Search tags controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search tags',
    });
  }
};

/**
 * Get tags by blog ID (Public)
 */
export const getTagsByBlogId = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { blogId } = req.params;

    if (!blogId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Blog ID is required',
      });
      return;
    }

    // Create service instance
    const tagService = new TagService();

    // Get tags by blog ID
    const tags = await tagService.getTagsByBlogId(blogId);

    logger.info(`✅ Retrieved ${tags.length} tags for blog: ${blogId}`);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    logger.error('❌ Get tags by blog ID controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve tags',
    });
  }
};

/**
 * Create new tag (Admin)
 */
export const createTag = async (
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

    const { name } = req.body;

    // Validate input
    if (!name || typeof name !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Tag name is required',
      });
      return;
    }

    // Create service instance
    const tagService = new TagService();

    // Create tag
    const newTag = await tagService.createTag({ name });

    logger.info(`✅ New tag created: ${newTag.name} by ${userId}`);

    res.status(201).json({
      success: true,
      data: newTag,
    });
  } catch (error) {
    logger.error('❌ Create tag controller error:', error);

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
      message: 'Failed to create tag',
    });
  }
};

/**
 * Create multiple tags (Admin)
 */
export const createMultipleTags = async (
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

    const { names } = req.body;

    // Validate input
    if (!Array.isArray(names) || names.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Tag names array is required',
      });
      return;
    }

    // Create service instance
    const tagService = new TagService();

    // Create multiple tags
    const tags = await tagService.createMultipleTags(names);

    logger.info(`✅ ${tags.length} tags created by ${userId}`);

    res.status(201).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    logger.error('❌ Create multiple tags controller error:', error);

    if (error instanceof Error) {
      if (error.message.includes('required') || error.message.includes('must be')) {
        res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create tags',
    });
  }
};

/**
 * Update tag (Admin)
 */
export const updateTag = async (
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
        message: 'Tag ID is required',
      });
      return;
    }

    const { name } = req.body;

    // Validate that at least one field is provided
    if (!name) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'At least one field must be provided for update',
      });
      return;
    }

    // Create service instance
    const tagService = new TagService();

    // Update tag
    const updatedTag = await tagService.updateTag(id, { name });

    logger.info(`✅ Tag updated: ${updatedTag.name} by ${userId}`);

    res.json({
      success: true,
      data: updatedTag,
    });
  } catch (error) {
    logger.error('❌ Update tag controller error:', error);

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
      message: 'Failed to update tag',
    });
  }
};

/**
 * Delete tag (Admin)
 */
export const deleteTag = async (
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
        message: 'Tag ID is required',
      });
      return;
    }

    // Create service instance
    const tagService = new TagService();

    // Delete tag
    await tagService.deleteTag(id);

    logger.info(`✅ Tag deleted: ${id} by ${userId}`);

    res.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    logger.error('❌ Delete tag controller error:', error);

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
      message: 'Failed to delete tag',
    });
  }
};

/**
 * Get unused tags (Admin)
 */
export const getUnusedTags = async (
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

    // Create service instance
    const tagService = new TagService();

    // Get unused tags
    const tags = await tagService.getUnusedTags();

    logger.info(`✅ Retrieved ${tags.length} unused tags`);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    logger.error('❌ Get unused tags controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve unused tags',
    });
  }
};

/**
 * Cleanup unused tags (Admin)
 */
export const cleanupUnusedTags = async (
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

    // Create service instance
    const tagService = new TagService();

    // Cleanup unused tags
    const deletedCount = await tagService.cleanupUnusedTags();

    logger.info(`✅ Cleaned up ${deletedCount} unused tags by ${userId}`);

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} unused tags`,
      data: { deletedCount },
    });
  } catch (error) {
    logger.error('❌ Cleanup unused tags controller error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cleanup unused tags',
    });
  }
};
