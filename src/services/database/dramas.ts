import prisma from '@/lib/prisma'
import { ConflictError, NotFoundError } from '@/lib/errors'
import { DramaStatus, Prisma } from '@prisma/client'

const emptyStats = {
  views: 0,
  reactions: 0,
  comments: 0,
  shares: 0,
  clicks: 0,
  conversions: 0,
  revenue: 0,
}

export class DramaService {
  async getDramas(options: {
    page?: number
    limit?: number
    status?: DramaStatus
    language?: string
    search?: string
  } = {}) {
    const { page = 1, limit = 20, status, language, search } = options

    const where: Prisma.DramaWhereInput = {}
    if (status) where.status = status
    if (language) where.language = language
    if (search) {
      where.OR = [
        { dramaName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ]
    }

    const [dramas, total] = await Promise.all([
      prisma.drama.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          videos: {
            select: {
              id: true,
              _count: {
                select: {
                  variants: true,
                  publishTasks: true,
                  performanceLogs: true,
                },
              },
            },
          },
          _count: {
            select: { videos: true },
          },
        },
      }),
      prisma.drama.count({ where }),
    ])

    const videoIdToDramaId = new Map<string, string>()
    const videoIds = dramas.flatMap((drama) => {
      return drama.videos.map((video) => {
        videoIdToDramaId.set(video.id, drama.id)
        return video.id
      })
    })

    const performanceByDrama = new Map<string, typeof emptyStats>()
    if (videoIds.length > 0) {
      const performance = await prisma.performanceLog.groupBy({
        by: ['videoId'],
        where: { videoId: { in: videoIds } },
        _sum: {
          views: true,
          reactions: true,
          comments: true,
          shares: true,
          clicks: true,
          conversions: true,
          revenue: true,
        },
      })

      for (const row of performance) {
        const dramaId = videoIdToDramaId.get(row.videoId)
        if (!dramaId) continue

        const current = performanceByDrama.get(dramaId) || { ...emptyStats }
        current.views += row._sum.views || 0
        current.reactions += row._sum.reactions || 0
        current.comments += row._sum.comments || 0
        current.shares += row._sum.shares || 0
        current.clicks += row._sum.clicks || 0
        current.conversions += row._sum.conversions || 0
        current.revenue += Number(row._sum.revenue) || 0
        performanceByDrama.set(dramaId, current)
      }
    }

    return {
      dramas: dramas.map(({ videos, ...drama }) => ({
        ...drama,
        stats: performanceByDrama.get(drama.id) || { ...emptyStats },
        _count: {
          ...drama._count,
          variants: videos.reduce((sum, video) => sum + video._count.variants, 0),
          publishTasks: videos.reduce((sum, video) => sum + video._count.publishTasks, 0),
          performanceLogs: videos.reduce((sum, video) => sum + video._count.performanceLogs, 0),
        },
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async getDramaById(id: string) {
    const drama = await prisma.drama.findUnique({
      where: { id },
      include: {
        videos: {
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: {
                variants: true,
                publishTasks: true,
              },
            },
          },
        },
        _count: {
          select: { videos: true },
        },
      },
    })

    if (!drama) {
      throw new NotFoundError('剧集', id)
    }

    return drama
  }

  async createDrama(data: Prisma.DramaCreateInput) {
    return prisma.drama.create({
      data: {
        ...data,
        tags: data.tags || [],
      },
    })
  }

  async updateDrama(id: string, data: Prisma.DramaUpdateInput) {
    await this.getDramaById(id)

    return prisma.drama.update({
      where: { id },
      data,
    })
  }

  async deleteDrama(id: string) {
    await this.getDramaById(id)

    const videoCount = await prisma.video.count({
      where: { dramaId: id },
    })

    if (videoCount > 0) {
      throw new ConflictError('剧集下已有视频，无法删除。请先删除视频或将剧集归档。')
    }

    return prisma.drama.delete({
      where: { id },
    })
  }
}

export const dramaService = new DramaService()
