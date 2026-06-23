import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class AnalyticsService {
  // 获取总览数据
  async getOverview(startDate?: Date, endDate?: Date) {
    const where: Prisma.PerformanceLogWhereInput = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }
    
    const [
      totalPages,
      activePages,
      totalVideos,
      totalVariants,
      totalTasks,
      publishedTasks,
      performance,
    ] = await Promise.all([
      prisma.facebookPage.count(),
      prisma.facebookPage.count({ where: { status: 'ACTIVE' } }),
      prisma.video.count(),
      prisma.videoVariant.count(),
      prisma.publishTask.count(),
      prisma.publishTask.count({ where: { status: 'PUBLISHED' } }),
      prisma.performanceLog.aggregate({
        where,
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
    
    // 获取今日数据
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    
    const todayTasks = await prisma.publishTask.count({
      where: {
        publishedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: 'PUBLISHED',
      },
    })
    
    const todayPerformance = await prisma.performanceLog.aggregate({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _sum: {
        views: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
    })
    
    // 获取最近任务
    const recentTasks = await prisma.publishTask.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        page: { select: { pageName: true } },
        video: { select: { title: true } },
        variant: { select: { variantName: true } },
      },
    })
    
    // 获取表现最好的视频
    const topVideos = await prisma.performanceLog.groupBy({
      by: ['videoId'],
      _sum: {
        views: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
      orderBy: {
        _sum: { views: 'desc' },
      },
      take: 5,
    })
    
    // 获取视频详情
    const topVideoIds = topVideos.map(v => v.videoId)
    const topVideoDetails = await prisma.video.findMany({
      where: { id: { in: topVideoIds } },
      include: { drama: true },
    })
    
    const topVideosWithStats = topVideos.map(stat => {
      const video = topVideoDetails.find(v => v.id === stat.videoId)
      return {
        ...video,
        stats: stat._sum,
      }
    })
    
    // 获取风险主页
    const riskPages = await prisma.facebookPage.findMany({
      where: {
        OR: [
          { status: 'WARNING' },
          { status: 'RESTRICTED' },
          { healthScore: { lt: 60 } },
        ],
      },
      take: 5,
      orderBy: { healthScore: 'asc' },
    })
    
    return {
      totalPages,
      activePages,
      totalVideos,
      totalVariants,
      totalTasks,
      publishedTasks,
      performance: performance._sum,
      today: {
        publishedTasks: todayTasks,
        performance: todayPerformance._sum,
      },
      recentTasks,
      topVideos: topVideosWithStats,
      riskPages,
    }
  }

  // 按页面统计
  async getStatsByPage(options: {
    startDate?: Date
    endDate?: Date
    pageId?: string
  } = {}) {
    const { startDate, endDate, pageId } = options
    
    const where: Prisma.PerformanceLogWhereInput = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }
    if (pageId) where.pageId = pageId
    
    const stats = await prisma.performanceLog.groupBy({
      by: ['pageId'],
      where,
      _sum: {
        views: true,
        reactions: true,
        comments: true,
        shares: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
      _count: true,
    })
    
    const pageIds = stats.map(s => s.pageId)
    const pages = await prisma.facebookPage.findMany({
      where: { id: { in: pageIds } },
    })
    
    return stats.map(stat => {
      const page = pages.find(p => p.id === stat.pageId)
      return {
        ...page,
        stats: stat._sum,
        totalLogs: stat._count,
      }
    })
  }

  // 按视频统计
  async getStatsByVideo(options: {
    startDate?: Date
    endDate?: Date
    videoId?: string
  } = {}) {
    const { startDate, endDate, videoId } = options
    
    const where: Prisma.PerformanceLogWhereInput = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }
    if (videoId) where.videoId = videoId
    
    const stats = await prisma.performanceLog.groupBy({
      by: ['videoId'],
      where,
      _sum: {
        views: true,
        reactions: true,
        comments: true,
        shares: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
      _count: true,
    })
    
    const videoIds = stats.map(s => s.videoId)
    const videos = await prisma.video.findMany({
      where: { id: { in: videoIds } },
      include: { drama: true },
    })
    
    return stats.map(stat => {
      const video = videos.find(v => v.id === stat.videoId)
      return {
        ...video,
        stats: stat._sum,
        totalLogs: stat._count,
      }
    })
  }

  // 按变体统计
  async getStatsByVariant(options: {
    startDate?: Date
    endDate?: Date
    variantId?: string
  } = {}) {
    const { startDate, endDate, variantId } = options
    
    const where: Prisma.PerformanceLogWhereInput = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }
    if (variantId) where.variantId = variantId
    
    const stats = await prisma.performanceLog.groupBy({
      by: ['variantId'],
      where,
      _sum: {
        views: true,
        reactions: true,
        comments: true,
        shares: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
      _count: true,
    })
    
    const variantIds = stats.map(s => s.variantId)
    const variants = await prisma.videoVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        video: {
          include: { drama: true },
        },
      },
    })
    
    return stats.map(stat => {
      const variant = variants.find(v => v.id === stat.variantId)
      return {
        ...variant,
        stats: stat._sum,
        totalLogs: stat._count,
      }
    })
  }

  // 按剧集统计
  async getStatsByDrama(options: {
    startDate?: Date
    endDate?: Date
    dramaId?: string
  } = {}) {
    const { startDate, endDate, dramaId } = options
    
    const where: Prisma.PerformanceLogWhereInput = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }
    if (dramaId) {
      where.video = { dramaId }
    }
    
    // 先获取视频ID
    const videoIds = await prisma.video.findMany({
      where: dramaId ? { dramaId } : {},
      select: { id: true },
    }).then(videos => videos.map(v => v.id))
    
    where.videoId = { in: videoIds }
    
    const stats = await prisma.performanceLog.groupBy({
      by: ['videoId'],
      where,
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
    
    // 按剧集聚合
    const dramaStats: Record<string, {
      dramaId: string
      dramaName: string
      stats: any
      videoCount: number
    }> = {}
    
    const videos = await prisma.video.findMany({
      where: { id: { in: videoIds } },
      include: { drama: true },
    })
    
    for (const stat of stats) {
      const video = videos.find(v => v.id === stat.videoId)
      if (!video) continue
      
      const dramaId = video.dramaId
      if (!dramaStats[dramaId]) {
        dramaStats[dramaId] = {
          dramaId,
          dramaName: video.drama.dramaName,
          stats: {
            views: 0,
            reactions: 0,
            comments: 0,
            shares: 0,
            clicks: 0,
            conversions: 0,
            revenue: 0,
          },
          videoCount: 0,
        }
      }
      
      dramaStats[dramaId].stats.views += stat._sum.views || 0
      dramaStats[dramaId].stats.reactions += stat._sum.reactions || 0
      dramaStats[dramaId].stats.comments += stat._sum.comments || 0
      dramaStats[dramaId].stats.shares += stat._sum.shares || 0
      dramaStats[dramaId].stats.clicks += stat._sum.clicks || 0
      dramaStats[dramaId].stats.conversions += stat._sum.conversions || 0
      dramaStats[dramaId].stats.revenue += Number(stat._sum.revenue) || 0
      dramaStats[dramaId].videoCount++
    }
    
    return Object.values(dramaStats)
  }

  // 按时间统计（时间序列）
  async getStatsByTime(options: {
    startDate?: Date
    endDate?: Date
    groupBy?: 'day' | 'week' | 'month'
    pageId?: string
    videoId?: string
    variantId?: string
  } = {}) {
    const { startDate, endDate, groupBy = 'day', pageId, videoId, variantId } = options
    
    const where: Prisma.PerformanceLogWhereInput = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }
    if (pageId) where.pageId = pageId
    if (videoId) where.videoId = videoId
    if (variantId) where.variantId = variantId
    
    // 根据分组方式调整查询
    let dateField: string
    switch (groupBy) {
      case 'week':
        // Prisma 不支持直接按周分组，这里简化为按日分组
        dateField = 'date'
        break
      case 'month':
        dateField = 'date'
        break
      default:
        dateField = 'date'
    }
    
    const stats = await prisma.performanceLog.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        date: true,
        views: true,
        reactions: true,
        comments: true,
        shares: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
    })
    
    // 按日期聚合
    const aggregated: Record<string, {
      date: string
      views: number
      reactions: number
      comments: number
      shares: number
      clicks: number
      conversions: number
      revenue: number
    }> = {}
    
    for (const stat of stats) {
      const dateKey = stat.date.toISOString().split('T')[0]
      if (!aggregated[dateKey]) {
        aggregated[dateKey] = {
          date: dateKey,
          views: 0,
          reactions: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
        }
      }
      
      aggregated[dateKey].views += stat.views
      aggregated[dateKey].reactions += stat.reactions
      aggregated[dateKey].comments += stat.comments
      aggregated[dateKey].shares += stat.shares
      aggregated[dateKey].clicks += stat.clicks
      aggregated[dateKey].conversions += stat.conversions
      aggregated[dateKey].revenue += Number(stat.revenue)
    }
    
    return Object.values(aggregated)
  }

  // 导出CSV数据
  async exportData(options: {
    startDate?: Date
    endDate?: Date
    type: 'pages' | 'videos' | 'variants' | 'dramas'
  }) {
    const { startDate, endDate, type } = options
    
    let data: any[] = []
    switch (type) {
      case 'pages':
        data = await this.getStatsByPage({ startDate, endDate })
        break
      case 'videos':
        data = await this.getStatsByVideo({ startDate, endDate })
        break
      case 'variants':
        data = await this.getStatsByVariant({ startDate, endDate })
        break
      case 'dramas':
        data = await this.getStatsByDrama({ startDate, endDate })
        break
    }
    
    // 转换为CSV格式
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header]
        if (typeof val === 'object') {
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`
        }
        return `"${String(val).replace(/"/g, '""')}"`
      })
      csvRows.push(values.join(','))
    }
    
    return csvRows.join('\n')
  }
}

export const analyticsService = new AnalyticsService()