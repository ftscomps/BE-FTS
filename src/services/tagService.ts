/**
 * Tag Service
 * Business logic untuk tag CRUD operations
 */

import prisma from '../config/database';
import { logger } from '../utils/logger';
import { Tag, TagWithBlogCount } from '../types/blog';

/**
 * Tag Service class
 */
export class TagService {
  constructor() {}

  /**
   * Generate slug dari name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Validate tag data
   */
  private validateTagData(data: { name: string }): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Tag name is required');
    }

    if (data.name.length < 2) {
      throw new Error('Tag name must be at least 2 characters long');
    }

    if (data.name.length > 50) {
      throw new Error('Tag name must not exceed 50 characters');
    }
  }

  /**
   * Create new tag
   */
  async createTag(data: { name: string }): Promise<Tag> {
    try {
      // Validate input
      this.validateTagData(data);

      // Generate slug
      const slug = this.generateSlug(data.name);

      // Check if tag with same name or slug already exists
      const existingTag = await (prisma as any).tag.findFirst({
        where: {
          OR: [
            { name: data.name },
            { slug },
          ],
        },
      });

      if (existingTag) {
        throw new Error('Tag with this name or slug already exists');
      }

      // Create tag
      const newTag = await (prisma as any).tag.create({
        data: {
          name: data.name,
          slug,
        },
      });

      logger.info(`✅ New tag created: ${newTag.name}`);

      return newTag;
    } catch (error) {
      logger.error('❌ Create tag error:', error);
      throw error;
    }
  }

  /**
   * Get all tags
   */
  async getTags(includeBlogCount: boolean = false): Promise<Tag[] | TagWithBlogCount[]> {
    try {
      const tags = await (prisma as any).tag.findMany({
        orderBy: { name: 'asc' },
        ...(includeBlogCount && {
          include: {
            _count: {
              select: {
                blogs: true,
              },
            },
          },
        }),
      });

      return tags;
    } catch (error) {
      logger.error('❌ Get tags error:', error);
      throw error;
    }
  }

  /**
   * Get single tag by ID atau slug
   */
  async getTagById(idOrSlug: string): Promise<Tag | null> {
    try {
      const tag = await (prisma as any).tag.findFirst({
        where: {
          OR: [
            { id: idOrSlug },
            { slug: idOrSlug },
          ],
        },
      });

      return tag;
    } catch (error) {
      logger.error('❌ Get tag by ID error:', error);
      throw error;
    }
  }

  /**
   * Get tag with blog count
   */
  async getTagWithBlogCount(idOrSlug: string): Promise<TagWithBlogCount | null> {
    try {
      const tag = await (prisma as any).tag.findFirst({
        where: {
          OR: [
            { id: idOrSlug },
            { slug: idOrSlug },
          ],
        },
        include: {
          _count: {
            select: {
              blogs: true,
            },
          },
        },
      });

      return tag;
    } catch (error) {
      logger.error('❌ Get tag with blog count error:', error);
      throw error;
    }
  }

  /**
   * Update tag
   */
  async updateTag(id: string, data: { name?: string }): Promise<Tag> {
    try {
      // Check if tag exists
      const existingTag = await (prisma as any).tag.findUnique({
        where: { id },
      });

      if (!existingTag) {
        throw new Error('Tag not found');
      }

      // Validate input
      if (data.name) {
        this.validateTagData({ name: data.name });
      }

      // Generate slug if name is updated
      let slug = undefined;
      if (data.name && data.name !== existingTag.name) {
        slug = this.generateSlug(data.name);

        // Check if new slug already exists
        const existingSlugTag = await (prisma as any).tag.findUnique({
          where: { slug },
        });

        if (existingSlugTag) {
          throw new Error('Tag with this slug already exists');
        }
      }

      // Update tag
      const updatedTag = await (prisma as any).tag.update({
        where: { id },
        data: {
          ...data,
          ...(slug && { slug }),
        },
      });

      logger.info(`✅ Tag updated: ${updatedTag.name}`);

      return updatedTag;
    } catch (error) {
      logger.error('❌ Update tag error:', error);
      throw error;
    }
  }

  /**
   * Delete tag
   */
  async deleteTag(id: string): Promise<void> {
    try {
      // Check if tag exists
      const existingTag = await (prisma as any).tag.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              blogs: true,
            },
          },
        },
      });

      if (!existingTag) {
        throw new Error('Tag not found');
      }

      // Check if tag has blogs
      if (existingTag._count.blogs > 0) {
        throw new Error('Cannot delete tag that has blogs. Please remove the tag from blogs first.');
      }

      // Delete tag
      await (prisma as any).tag.delete({
        where: { id },
      });

      logger.info(`✅ Tag deleted: ${existingTag.name}`);
    } catch (error) {
      logger.error('❌ Delete tag error:', error);
      throw error;
    }
  }

  /**
   * Get tags with blog count
   */
  async getTagsWithBlogCount(): Promise<TagWithBlogCount[]> {
    try {
      const tags = await (prisma as any).tag.findMany({
        include: {
          _count: {
            select: {
              blogs: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return tags;
    } catch (error) {
      logger.error('❌ Get tags with blog count error:', error);
      throw error;
    }
  }

  /**
   * Get popular tags (with most blogs)
   */
  async getPopularTags(limit: number = 20): Promise<TagWithBlogCount[]> {
    try {
      const tags = await (prisma as any).tag.findMany({
        include: {
          _count: {
            select: {
              blogs: true,
            },
          },
        },
        orderBy: {
          blogs: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return tags;
    } catch (error) {
      logger.error('❌ Get popular tags error:', error);
      throw error;
    }
  }

  /**
   * Search tags
   */
  async searchTags(query: string): Promise<Tag[]> {
    try {
      const tags = await (prisma as any).tag.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        orderBy: { name: 'asc' },
      });

      return tags;
    } catch (error) {
      logger.error('❌ Search tags error:', error);
      throw error;
    }
  }

  /**
   * Get tags by blog ID
   */
  async getTagsByBlogId(blogId: string): Promise<Tag[]> {
    try {
      const blogTags = await (prisma as any).blogTag.findMany({
        where: { blogId },
        include: {
          tag: true,
        },
      });

      return blogTags.map((bt: any) => bt.tag);
    } catch (error) {
      logger.error('❌ Get tags by blog ID error:', error);
      throw error;
    }
  }

  /**
   * Create multiple tags (untuk bulk operations)
   */
  async createMultipleTags(tagNames: string[]): Promise<Tag[]> {
    try {
      const tags = [];

      for (const tagName of tagNames) {
        try {
          const tag = await this.createTag({ name: tagName });
          tags.push(tag);
        } catch (error) {
          // Skip if tag already exists
          if (error instanceof Error && error.message.includes('already exists')) {
            const existingTag = await (prisma as any).tag.findFirst({
              where: {
                OR: [
                  { name: tagName },
                  { slug: this.generateSlug(tagName) },
                ],
              },
            });
            if (existingTag) {
              tags.push(existingTag);
            }
          } else {
            throw error;
          }
        }
      }

      return tags;
    } catch (error) {
      logger.error('❌ Create multiple tags error:', error);
      throw error;
    }
  }

  /**
   * Get unused tags (tags without any blogs)
   */
  async getUnusedTags(): Promise<Tag[]> {
    try {
      const tags = await (prisma as any).tag.findMany({
        where: {
          blogs: {
            none: {},
          },
        },
        orderBy: { name: 'asc' },
      });

      return tags;
    } catch (error) {
      logger.error('❌ Get unused tags error:', error);
      throw error;
    }
  }

  /**
   * Clean up unused tags
   */
  async cleanupUnusedTags(): Promise<number> {
    try {
      const unusedTags = await this.getUnusedTags();
      
      if (unusedTags.length === 0) {
        return 0;
      }

      const tagIds = unusedTags.map(tag => tag.id);
      
      await (prisma as any).tag.deleteMany({
        where: {
          id: { in: tagIds },
        },
      });

      logger.info(`✅ Cleaned up ${unusedTags.length} unused tags`);

      return unusedTags.length;
    } catch (error) {
      logger.error('❌ Cleanup unused tags error:', error);
      throw error;
    }
  }
}
