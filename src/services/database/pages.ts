import prisma from '@/lib/prisma'
import { PageStatus, Prisma } from '@prisma/client'
import { NotFoundError, ConflictError } from '@/lib/errors'
import { RISK_RULES } from '@/lib/constants'
import { MetaClient } from '../meta/client'

const metaClient = new MetaClient()

export class PageService {
  // 获取所有主页（带分页）
  async getPages(options: {
    page?: number
    limit?: number
    status?: PageStatus
    niche?: string
    region?: string
    search?: string
  } = {}) {
    const { page = 1, limit = 20, status, niche, region, search } = options
    
    const where: Prisma.FacebookPageWhereInput = {}
    if (status) where.status = status
    if (niche) where.niche = niche
    if (region) where.region = region
    if (search) {
      where.OR = [
        { pageName: { contains: search, mode: 'insensitive' } },
        { pageId: { contains: search } },
      ]
    }
    
    const [pages, total] = await Promise.all([
      prisma.facebookPage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              publishTasks: true,
              performanceLogs: true,
            },
          },
        },
      }),
      prisma.facebookPage.count({ where }),
    ])
    
    return {
      pages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  // 根据ID获取主页
  async getPageById(id: string) {
    const page = await prisma.facebookPage.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            publishTasks: true,
            performanceLogs: true,
          },
        },
      },
    })
    
    if (!page) {
      throw new NotFoundError('Facebook Page', id)
    }
    
    return page
  }

  // 根据Page ID获取主页
  async getPageByPageId(pageId: string) {
    return prisma.facebookPage.findUnique({
      where: { pageId },
    })
  }

  // 创建新主页
  async createPage(data: {
    pageId: string
    pageName: string
    accessToken: string
    niche?: string
    region?: string
    language?: string
    timezone?: string
    dailyPostLimit?: number
    tags?: string[]
  }) {
    // 检查Page ID是否已存在
    const existingPage = await this.getPageByPageId(data.pageId)
    if (existingPage) {
      throw new ConflictError(`Page with ID ${data.pageId} already exists`)
    }
    
    // 验证token（可选）
    let tokenExpiresAt = null
    try {
      const tokenInfo = await metaClient.validatePageToken(data.accessToken)
      if (tokenInfo.expires_at > 0) {
        tokenExpiresAt = new Date(tokenInfo.expires_at * 1000)
      }
    } catch (error) {
      console.warn('Could not validate token, proceeding with creation:', error)
    }
    
    // 获取页面信息（可选）
    let fansCount = 0
    try {
      const pageInfo = await metaClient.getPageInfo(data.pageId, data.accessToken)
      fansCount = pageInfo.fan_count || 0
    } catch (error) {
      console.warn('Could not fetch page info:', error)
    }
    
    return prisma.facebookPage.create({
      data: {
        ...data,
        tokenExpiresAt,
        fansCount,
        dailyPostLimit: data.dailyPostLimit || RISK_RULES.DEFAULT_DAILY_POST_LIMIT,
      },
    })
  }

  // 更新主页信息
  async updatePage(id: string, data: Prisma.FacebookPageUpdateInput) {
    // 确保主页存在
    await this.getPageById(id)
    
    return prisma.facebookPage.update({
      where: { id },
      data,
    })
  }

  // 删除主页
  async deletePage(id: string) {
    // 确保主页存在
    await this.getPageById(id)
    
    // 检查是否有进行中的发布任务
    const activeTasks = await prisma.publishTask.count({
      where: {
        pageId: id,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
    })
    
    if (activeTasks > 0) {
      throw new ConflictError('Cannot delete page with active publishing tasks')
    }
    
    // 软删除或标记为删除
    return prisma.facebookPage.update({
      where: { id },
      data: {
        status: 'BANNED',
        accessToken: '', // 清除token
      },
    })
  }

  // 暂停主页
  async pausePage(id: string) {
    return this.updatePage(id, { status: 'PAUSED' })
  }

  // 恢复主页
  async resumePage(id: string) {
    const page = await this.getPageById(id)
    
    // 检查健康分
    if (page.healthScore < RISK_RULES.HEALTH_SCORE_THRESHOLD) {
      throw new ConflictError(
        `Page health score (${page.healthScore}) is below threshold (${RISK_RULES.HEALTH_SCORE_THRESHOLD})`
      )
    }
    
    return this.updatePage(id, { status: 'ACTIVE' })
  }

  // 验证token
  async validateToken(id: string) {
    const page = await this.getPageById(id)
    
    try {
      const tokenInfo = await metaClient.validatePageToken(page.accessToken)
      const isValid = tokenInfo.is_valid
      
      // 更新token过期时间
      let tokenExpiresAt = null
      if (tokenInfo.expires_at > 0) {
        tokenExpiresAt = new Date(tokenInfo.expires_at * 1000)
      }
      
      await this.updatePage(id, {
        tokenExpiresAt,
        status: isValid ? page.status : 'WARNING',
      })
      
      return {
        isValid,
        expiresAt: tokenExpiresAt,
        scopes: tokenInfo.scopes,
      }
    } catch (error: any) {
      await this.updatePage(id, { status: 'WARNING' })
      throw error
    }
  }

  // 刷新页面数据
  async refreshPageData(id: string) {
    const page = await this.getPageById(id)
    
    try {
      const pageInfo = await metaClient.getPageInfo(page.pageId, page.accessToken)
      const pageStatus = await metaClient.getPageStatus(page.pageId, page.accessToken)
      
      return this.updatePage(id, {
        fansCount: pageInfo.fan_count || 0,
        coverUrl: pageInfo.cover?.source,
        profilePicUrl: pageInfo.picture?.data?.url,
        category: pageInfo.category,
      })
    } catch (error) {
      console.error('Failed to refresh page data:', error)
      throw error
    }
  }

  // 更新健康分
  async updateHealthScore(id: string, change: number, reason: string) {
    const page = await this.getPageById(id)
    const newScore = Math.max(0, Math.min(100, page.healthScore + change))
    
    // 记录健康分变更
    await prisma.pageHealthLog.create({
      data: {
        pageId: id,
        healthScore: newScore,
        status: page.status,
        details: {
          change,
          reason,
          previousScore: page.healthScore,
        },
      },
    })
    
    // 更新主页健康分
    return this.updatePage(id, {
      healthScore: newScore,
      status: newScore < RISK_RULES.HEALTH_SCORE_THRESHOLD ? 'WARNING' : page.status,
    })
  }

  // 检查每日发布限制
  async checkDailyLimit(id: string): Promise<boolean> {
    const page = await this.getPageById(id)
    return page.todayPostCount < page.dailyPostLimit
  }

  // 增加今日发布计数
  async incrementDailyCount(id: string) {
    return prisma.facebookPage.update({
      where: { id },
      data: {
        todayPostCount: { increment: 1 },
        lastPostAt: new Date(),
      },
    })
  }

  // 重置每日发布计数（每天0点执行）
  async resetDailyCounts() {
    return prisma.facebookPage.updateMany({
      data: {
        todayPostCount: 0,
      },
    })
  }

  // 获取活跃主页
  async getActivePages() {
    return prisma.facebookPage.findMany({
      where: {
        status: 'ACTIVE',
        healthScore: { gte: RISK_RULES.HEALTH_SCORE_THRESHOLD },
      },
    })
  }

  // 获取主页统计
  async getPageStats(id: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const [page, stats] = await Promise.all([
      this.getPageById(id),
      prisma.performanceLog.aggregate({
        where: {
          pageId: id,
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
      ...page,
      stats: stats._sum,
    }
  }
}

export const pageService = new PageService()