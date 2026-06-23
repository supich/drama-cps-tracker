import prisma from '@/lib/prisma'
import { VideoStatus, Prisma } from '@prisma/client'
import { NotFoundError, ConflictError } from '@/lib/errors'

export class VideoService {
  // 获取所有视频（带分页和筛选）
  async getVideos(options: {
    page?: number
    limit?: number
    dramaId?: string
    status?: VideoStatus
    language?: string
    search?: string
  } = {}) {
    const { page = 1, limit = 20, dramaId, status, language, search } = options
    
    const where: Prisma.VideoWhereInput = {}
    if (dramaId) where.dramaId = dramaId
    if (status) where.status = status
    if (language) where.language = language
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ]
    }
    
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          drama: true,
          _count: {
            select: {
              variants: true,
              publishTasks: true,
              performanceLogs: true,
            },
          },
        },
      }),
      prisma.video.count({ where }),
    ])
    
    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  // 根据ID获取视频
  async getVideoById(id: string) {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        drama: true,
        variants: true,
        _count: {
          select: {
            publishTasks: true,
            performanceLogs: true,
          },
        },
      },
    })
    
    if (!video) {
      throw new NotFoundError('Video', id)
    }
    
    return video
  }

  // 创建新视频
  async createVideo(data: {
    dramaId: string
    title: string
    description?: string
    fileUrl: string
    coverUrl?: string
    duration?: number
    language?: string
    tags?: string[]
    metadata?: any
  }) {
    // 检查剧集是否存在
    const drama = await prisma.drama.findUnique({
      where: { id: data.dramaId },
    })
    
    if (!drama) {
      throw new NotFoundError('Drama', data.dramaId)
    }
    
    return prisma.video.create({
      data: {
        ...data,
        tags: data.tags || [],
        metadata: data.metadata || {},
        language: data.language || drama.language,
      },
      include: {
        drama: true,
      },
    })
  }

  // 更新视频信息
  async updateVideo(id: string, data: Prisma.VideoUpdateInput) {
    // 确保视频存在
    await this.getVideoById(id)
    
    return prisma.video.update({
      where: { id },
      data,
      include: {
        drama: true,
      },
    })
  }

  // 删除视频
  async deleteVideo(id: string) {
    // 确保视频存在
    const video = await this.getVideoById(id)
    
    // 检查是否有发布任务
    const taskCount = await prisma.publishTask.count({
      where: { videoId: id },
    })
    
    if (taskCount > 0) {
      throw new ConflictError('Cannot delete video with existing publish tasks')
    }
    
    // 删除相关变体
    await prisma.videoVariant.deleteMany({
      where: { videoId: id },
    })
    
    // 删除视频
    return prisma.video.delete({
      where: { id },
    })
  }

  // 更新视频状态
  async updateVideoStatus(id: string, status: VideoStatus) {
    return this.updateVideo(id, { status })
  }

  // 获取视频统计
  async getVideoStats(id: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const [video, stats] = await Promise.all([
      this.getVideoById(id),
      prisma.performanceLog.aggregate({
        where: {
          videoId: id,
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
      ...video,
      stats: stats._sum,
    }
  }

  // 批量更新视频状态
  async batchUpdateStatus(ids: string[], status: VideoStatus) {
    return prisma.video.updateMany({
      where: {
        id: { in: ids },
      },
      data: { status },
    })
  }
}

export const videoService = new VideoService()