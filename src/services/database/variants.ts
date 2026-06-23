import prisma from '@/lib/prisma'
import { VariantStatus, Prisma } from '@prisma/client'
import { NotFoundError, ConflictError } from '@/lib/errors'

export class VariantService {
  // 获取所有变体（带分页和筛选）
  async getVariants(options: {
    page?: number
    limit?: number
    videoId?: string
    status?: VariantStatus
    search?: string
  } = {}) {
    const { page = 1, limit = 20, videoId, status, search } = options
    
    const where: Prisma.VideoVariantWhereInput = {}
    if (videoId) where.videoId = videoId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { variantName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { caption: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const [variants, total] = await Promise.all([
      prisma.videoVariant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          video: {
            include: {
              drama: true,
            },
          },
          _count: {
            select: {
              publishTasks: true,
              performanceLogs: true,
            },
          },
        },
      }),
      prisma.videoVariant.count({ where }),
    ])
    
    return {
      variants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  // 根据ID获取变体
  async getVariantById(id: string) {
    const variant = await prisma.videoVariant.findUnique({
      where: { id },
      include: {
        video: {
          include: {
            drama: true,
          },
        },
        _count: {
          select: {
            publishTasks: true,
            performanceLogs: true,
          },
        },
      },
    })
    
    if (!variant) {
      throw new NotFoundError('Video Variant', id)
    }
    
    return variant
  }

  // 为视频创建新变体
  async createVariant(data: {
    videoId: string
    variantName: string
    title: string
    caption?: string
    coverUrl?: string
    hookType?: string
    ctaType?: string
    hashtags?: string[]
    extraData?: any
  }) {
    // 检查视频是否存在
    const video = await prisma.video.findUnique({
      where: { id: data.videoId },
    })
    
    if (!video) {
      throw new NotFoundError('Video', data.videoId)
    }
    
    // 检查变体名称是否重复
    const existingVariant = await prisma.videoVariant.findUnique({
      where: {
        videoId_variantName: {
          videoId: data.videoId,
          variantName: data.variantName,
        },
      },
    })
    
    if (existingVariant) {
      throw new ConflictError(`Variant '${data.variantName}' already exists for this video`)
    }
    
    return prisma.videoVariant.create({
      data: {
        ...data,
        hashtags: data.hashtags || [],
        extraData: data.extraData || {},
      },
      include: {
        video: true,
      },
    })
  }

  // 更新变体信息
  async updateVariant(id: string, data: Prisma.VideoVariantUpdateInput) {
    // 确保变体存在
    await this.getVariantById(id)
    
    return prisma.videoVariant.update({
      where: { id },
      data,
      include: {
        video: true,
      },
    })
  }

  // 删除变体
  async deleteVariant(id: string) {
    // 确保变体存在
    const variant = await this.getVariantById(id)
    
    // 检查是否有发布任务
    const taskCount = await prisma.publishTask.count({
      where: { variantId: id },
    })
    
    if (taskCount > 0) {
      throw new ConflictError('Cannot delete variant with existing publish tasks')
    }
    
    return prisma.videoVariant.delete({
      where: { id },
    })
  }

  // 更新变体状态
  async updateVariantStatus(id: string, status: VariantStatus) {
    return this.updateVariant(id, { status })
  }

  // 获取变体统计
  async getVariantStats(id: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const [variant, stats] = await Promise.all([
      this.getVariantById(id),
      prisma.performanceLog.aggregate({
        where: {
          variantId: id,
          date: { gte: startDate },
        },
        _sum: {
          views: true,
          reactions: true,
          comments: true,
          shares: true,
          clicks: true,
          conversions: true,
          revenue: true,
        },
      }),
    ])
    
    return {
      ...variant,
      stats: stats._sum,
    }
  }

  // 批量更新变体状态
  async batchUpdateStatus(ids: string[], status: VariantStatus) {
    return prisma.videoVariant.updateMany({
      where: {
        id: { in: ids },
      },
      data: { status },
    })
  }

  // 为视频生成多个变体（批量创建）
  async generateVariants(videoId: string, variants: Array<{
    variantName: string
    title: string
    caption?: string
    coverUrl?: string
    hookType?: string
    ctaType?: string
    hashtags?: string[]
  }>) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    })
    
    if (!video) {
      throw new NotFoundError('Video', videoId)
    }
    
    const createdVariants = []
    const errors: string[] = []
    
    for (const variantData of variants) {
      try {
        const variant = await this.createVariant({
          videoId,
          ...variantData,
        })
        createdVariants.push(variant)
      } catch (error: any) {
        console.error(`Failed to create variant '${variantData.variantName}':`, error.message)
        errors.push(`${variantData.variantName}: ${error.message}`)
      }
    }
    
    return { created: createdVariants, errors }
  }
}

export const variantService = new VariantService()