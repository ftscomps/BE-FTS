/**
 * Blog Types
 * Type definitions untuk blog management system
 */

/**
 * Blog data yang ada di database
 */
export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  featuredImage: string | null;
  isPublished: boolean;
  readTime: number;
  views: number;
  authorId: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Blog dengan relasi ke category dan author
 */
export interface BlogWithRelations extends Blog {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
}

/**
 * Blog dengan views untuk analytics
 */
export interface BlogWithViews extends BlogWithRelations {
  blogViews: {
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    viewedAt: Date;
  }[];
}

/**
 * Category data
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category dengan blog count
 */
export interface CategoryWithBlogCount extends Category {
  _count: {
    blogs: number;
  };
}

/**
 * Tag data
 */
export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

/**
 * Tag dengan blog count
 */
export interface TagWithBlogCount extends Tag {
  _count: {
    blogs: number;
  };
}

/**
 * Blog view data
 */
export interface BlogView {
  id: string;
  blogId: string;
  ipAddress: string | null;
  userAgent: string | null;
  viewedAt: Date;
}

/**
 * Create blog request body
 */
export interface CreateBlogRequest {
  title: string;
  slug?: string; // Optional, akan auto-generate jika tidak ada
  excerpt: string;
  content: string;
  categoryId: string;
  featuredImage?: string | null;
  isPublished?: boolean;
  tags: string[]; // Array of tag names
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
}

/**
 * Update blog request body
 */
export interface UpdateBlogRequest {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  categoryId?: string;
  featuredImage?: string | null;
  isPublished?: boolean;
  tags?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
}

/**
 * Blog query parameters untuk filtering dan pagination
 */
export interface BlogQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tags?: string[];
  author?: string;
  isPublished?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'views' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Blog response dengan pagination
 */
export interface BlogListResponse {
  blogs: BlogWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    categories: Category[];
    tags: Tag[];
  };
}

/**
 * Blog statistics
 */
export interface BlogStats {
  total: number;
  published: number;
  draft: number;
  totalViews: number;
  byCategory: Record<string, number>;
  byAuthor: Record<string, number>;
  byTags: Record<string, number>;
  recentBlogs: BlogWithRelations[];
  popularBlogs: BlogWithRelations[];
}

/**
 * Blog filter options
 */
export interface BlogFilterOptions {
  categories?: string[];
  tags?: string[];
  authors?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  isPublished?: boolean;
  hasFeaturedImage?: boolean;
}

/**
 * Blog validation rules
 */
export interface BlogValidationRules {
  title: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  slug: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    required: boolean;
  };
  excerpt: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  content: {
    minLength: number;
    required: boolean;
  };
  tags: {
    maxItems: number;
    tagMaxLength: number;
  };
  seoTitle: {
    maxLength: number;
  };
  seoDescription: {
    maxLength: number;
  };
  seoKeywords: {
    maxLength: number;
  };
}

/**
 * Blog publish request
 */
export interface PublishBlogRequest {
  isPublished: boolean;
  publishedAt?: Date;
}

/**
 * Blog search result
 */
export interface BlogSearchResult {
  blogs: BlogWithRelations[];
  total: number;
  query: string;
  filters: {
    categories: Category[];
    tags: Tag[];
  };
}

/**
 * Related blogs result
 */
export interface RelatedBlogsResult {
  blogs: BlogWithRelations[];
  total: number;
  basedOn: 'category' | 'tags' | 'author';
}

/**
 * Blog analytics data
 */
export interface BlogAnalytics {
  totalViews: number;
  uniqueViews: number;
  viewsByDate: {
    date: string;
    views: number;
  }[];
  topReferrers: {
    referrer: string;
    views: number;
  }[];
  viewsByCountry: {
    country: string;
    views: number;
  }[];
}

/**
 * SEO meta tags
 */
export interface SEOMetaTags {
  title: string;
  description: string;
  keywords: string | null;
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
    publishedTime: string | null;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
}

/**
 * Structured data untuk SEO
 */
export interface StructuredData {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  image: string | null;
  author: {
    '@type': string;
    name: string;
  };
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  datePublished: string | null;
  dateModified: string;
}
