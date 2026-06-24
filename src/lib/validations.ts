import { z } from 'zod'

// Facebook Page 验证
export const createPageSchema = z.object({
  pageId: z.string().min(15).max(20),
  pageName: z.string().min(1).max(255),
  accessToken: z.string().min(1),
  niche: z.string().optional(),
  region: z.string().optional(),
  language: z.string().default('en'),
  timezone: z.string().default('America/New_York'),
  dailyPostLimit: z.number().int().min(1).max(50).default(10),
  tags: z.array(z.string()).optional(),
})

export const updatePageSchema = createPageSchema.partial()

// Drama 验证
export const createDramaSchema = z.object({
  dramaName: z.string().min(1).max(255),
  description: z.string().optional(),
  coverUrl: z.string().min(1).optional(),
  language: z.string().default('en'),
  tags: z.array(z.string()).optional(),
  cpsBaseUrl: z.string().url().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'BANNED']).default('ACTIVE'),
})

export const updateDramaSchema = createDramaSchema.partial()

// Video 验证
export const createVideoSchema = z.object({
  dramaId: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  fileUrl: z.string().min(1),
  coverUrl: z.string().optional(),
  duration: z.number().int().positive().optional(),
  language: z.string().default('en'),
  tags: z.array(z.string()).optional(),
})

export const updateVideoSchema = createVideoSchema.partial()

// Video Variant 验证
export const createVariantSchema = z.object({
  videoId: z.string(),
  variantName: z.string().min(1).max(255),
  title: z.string().min(1, '请填写发布标题').max(2000, '发布标题最多 2000 个字符'),
  caption: z.string().optional(),
  coverUrl: z.string().optional(),
  hookType: z.string().optional(),
  ctaType: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'READY', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
})

export const updateVariantSchema = createVariantSchema.partial()

// Publish Task 验证
export const createBatchPublishSchema = z.object({
  variantIds: z.array(z.string()).default([]),
  videoIds: z.array(z.string()).default([]),
  pageIds: z.array(z.string()).min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  staggerMin: z.number().int().min(5).max(120).default(15),
  staggerMax: z.number().int().min(15).max(240).default(90),
  publishHoursStart: z.number().int().min(0).max(23).default(8),
  publishHoursEnd: z.number().int().min(0).max(23).default(22),
}).refine(data => data.variantIds.length > 0 || data.videoIds.length > 0, {
  message: 'At least one video or variant is required',
  path: ['variantIds'],
})

// 查询参数验证
export const paginationSchema = z.object({
  page: z.coerce.number().int().gt(0).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  search: z.string().nullish().transform(v => v ?? undefined),
  status: z.string().nullish().transform(v => v ?? undefined),
  sortBy: z.string().nullish().transform(v => v ?? undefined),
  sortOrder: z.enum(['asc', 'desc']).catch('desc'),
})

// Analytics 查询验证
export const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  pageId: z.string().optional(),
  videoId: z.string().optional(),
  variantId: z.string().optional(),
  dramaId: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
})
