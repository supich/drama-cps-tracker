import prisma from '@/lib/prisma'
import { TaskStatus, Prisma } from '@prisma/client'
import { NotFoundError, ConflictError, ValidationError } from '@/lib/errors'
import { RISK_RULES } from '@/lib/constants'
import { getRandomInterval } from '@/lib/utils'
import { pageService } from './pages'
import { variantService } from './variants'

type PublishMode = 'NOW' | 'SCHEDULED' | 'SMART'

export class PublishTaskService {
  // 获取发布任务列表
  async getTasks(options: {
    page?: number
    limit?: number
    pageId?: string
    videoId?: string
    variantId?: string
    status?: TaskStatus
    startDate?: string
    endDate?: string
  } = {}) {
    const { page = 1, limit = 20, pageId, videoId, variantId, status, startDate, endDate } = options
    
    const where: Prisma.PublishTaskWhereInput = {}
    if (pageId) where.pageId = pageId
    if (videoId) where.videoId = videoId
    if (variantId) where.variantId = variantId
    if (status) where.status = status
    if (startDate || endDate) {
      where.scheduledAt = {}
      if (startDate) where.scheduledAt.gte = new Date(startDate)
      if (endDate) where.scheduledAt.lte = new Date(endDate)
    }
    
    const [tasks, total] = await Promise.all([
      prisma.publishTask.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          page: {
            select: {
              id: true,
              pageId: true,
              pageName: true,
              status: true,
              healthScore: true,
            },
          },
          video: {
            select: {
              id: true,
              title: true,
              fileUrl: true,
              coverUrl: true,
              duration: true,
              drama: true,
            },
          },
          variant: {
            select: {
              id: true,
              variantName: true,
              title: true,
              caption: true,
              coverUrl: true,
              hookType: true,
              ctaType: true,
              hashtags: true,
            },
          },
        },
      }),
      prisma.publishTask.count({ where }),
    ])
    
    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  // 根据ID获取任务
  async getTaskById(id: string) {
    const task = await prisma.publishTask.findUnique({
      where: { id },
      include: {
        page: true,
        video: {
          include: {
            drama: true,
          },
        },
        variant: true,
        performanceLogs: true,
      },
    })
    
    if (!task) {
      throw new NotFoundError('Publish Task', id)
    }
    
    return task
  }

  // 批量创建发布任务（核心排期算法）
  async createBatchTasks(params: {
    variantIds?: string[]
    videoIds?: string[]
    pageIds: string[]
    publishMode?: PublishMode
    scheduledAt?: Date
    startDate?: Date
    endDate?: Date
    staggerMin?: number
    staggerMax?: number
    publishHoursStart?: number
    publishHoursEnd?: number
  }) {
    const {
      variantIds = [],
      videoIds = [],
      pageIds,
      publishMode = 'SMART',
      scheduledAt,
      startDate,
      endDate,
      staggerMin = RISK_RULES.MIN_STAGGER_INTERVAL,
      staggerMax = RISK_RULES.MAX_STAGGER_INTERVAL,
      publishHoursStart = 8,
      publishHoursEnd = 22,
    } = params
    
    // 验证参数
    if (variantIds.length === 0 && videoIds.length === 0) {
      throw new ValidationError('At least one video or variant is required')
    }
    if (pageIds.length === 0) throw new ValidationError('At least one page is required')
    if (publishMode === 'SMART' && (!startDate || !endDate)) {
      throw new ValidationError('Start date and end date are required for smart scheduling')
    }
    if (publishMode === 'SMART' && startDate! >= endDate!) throw new ValidationError('Start date must be before end date')
    if (publishMode === 'SCHEDULED' && !scheduledAt) {
      throw new ValidationError('Scheduled publish time is required')
    }

    const fixedPublishTime = publishMode === 'NOW'
      ? new Date()
      : publishMode === 'SCHEDULED'
        ? scheduledAt!
        : undefined
    const scheduleRangeStart = publishMode === 'SMART' ? startDate! : fixedPublishTime!
    const scheduleRangeEnd = publishMode === 'SMART'
      ? endDate!
      : new Date(scheduleRangeStart.getTime() + 24 * 60 * 60 * 1000)

    const originalVariants = await Promise.all(
      [...new Set(videoIds)].map(videoId => variantService.getOrCreateOriginalVideoVariant(videoId))
    )
    const publishVariantIds = [
      ...new Set([
        ...variantIds,
        ...originalVariants.map(variant => variant.id),
      ]),
    ]
    
    // 获取所有变体信息
    const variants = await prisma.videoVariant.findMany({
      where: {
        id: { in: publishVariantIds },
        status: 'READY',
      },
      include: {
        video: true,
      },
    })
    
    if (variants.length === 0) throw new ValidationError('No valid variants found')
    
    // 获取所有页面信息
    const pages = await prisma.facebookPage.findMany({
      where: {
        id: { in: pageIds },
        status: 'ACTIVE',
        healthScore: { gte: RISK_RULES.HEALTH_SCORE_THRESHOLD },
      },
    })
    
    if (pages.length === 0) throw new ValidationError('No valid pages found')
    
    // 检查并生成发布任务
    const tasks: Prisma.PublishTaskCreateManyInput[] = []
    const errors: string[] = []
    
    // 按页面分组，每个页面每天的发布数量不超过限制
    const pageSchedule: Record<string, Date[]> = {}
    
    for (const page of pages) {
      // 初始化页面排期
      pageSchedule[page.id] = []
      
      // 获取该页面已有任务
      const existingTasks = await prisma.publishTask.findMany({
        where: {
          pageId: page.id,
          scheduledAt: {
            gte: scheduleRangeStart,
            lte: scheduleRangeEnd,
          },
          status: { notIn: ['CANCELED', 'FAILED'] },
        },
        select: { scheduledAt: true },
      })
      
      pageSchedule[page.id] = existingTasks.map(t => t.scheduledAt)
    }
    
    // 为每个页面分配变体
    for (const page of pages) {
      // 获取该页面已发布的变体ID
      const publishedVariantIds = await prisma.publishTask.findMany({
        where: {
          pageId: page.id,
          variantId: { in: publishVariantIds },
          status: { notIn: ['CANCELED'] },
        },
        select: { variantId: true },
      }).then(tasks => tasks.map(t => t.variantId))
      
      // 过滤掉已发布的变体
      const availableVariants = variants.filter(
        v => !publishedVariantIds.includes(v.id)
      )
      
      if (availableVariants.length === 0) {
        errors.push(`Page ${page.pageName}: All variants already published`)
        continue
      }

      if (publishMode !== 'SMART') {
        let offset = 0

        for (const variant of availableVariants) {
          const taskScheduledAt = new Date(fixedPublishTime!.getTime() + offset * staggerMin * 60 * 1000)
          const dayStart = new Date(taskScheduledAt)
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(taskScheduledAt)
          dayEnd.setHours(23, 59, 59, 999)
          const tasksOnDay = pageSchedule[page.id].filter(
            t => t >= dayStart && t <= dayEnd
          ).length

          if (tasksOnDay >= page.dailyPostLimit) {
            errors.push(`Page ${page.pageName}: Daily post limit reached for ${taskScheduledAt.toLocaleDateString()}`)
            continue
          }

          tasks.push({
            pageId: page.id,
            videoId: variant.videoId,
            variantId: variant.id,
            scheduledAt: taskScheduledAt,
            status: 'PENDING',
          })

          pageSchedule[page.id].push(taskScheduledAt)
          offset++
        }

        continue
      }
      
      // 计算时间范围内的天数
      const days = Math.ceil(
        (endDate!.getTime() - startDate!.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // 计算每天最多可以发布多少个
      const maxPerDay = page.dailyPostLimit
      
      // 当前页面已安排的任务计数
      let tasksScheduled = 0
      
      // 为每个变体安排发布时间
      for (const variant of availableVariants) {
        let scheduled = false
        
        for (let day = 0; day < days && !scheduled; day++) {
          const currentDate = new Date(startDate!)
          currentDate.setDate(currentDate.getDate() + day)
          
          // 检查当天已安排的任务数量
          const dayStart = new Date(currentDate)
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(currentDate)
          dayEnd.setHours(23, 59, 59, 999)
          
          const tasksOnDay = pageSchedule[page.id].filter(
            t => t >= dayStart && t <= dayEnd
          ).length
          
          if (tasksOnDay >= maxPerDay) {
            continue // 当天已满
          }
          
          // 生成随机发布时间
          const hour = Math.floor(
            Math.random() * (publishHoursEnd - publishHoursStart) + publishHoursStart
          )
          const minute = Math.floor(Math.random() * 60)
          
          const scheduledAt = new Date(currentDate)
          scheduledAt.setHours(hour, minute, 0, 0)
          
          // 检查与同页面其他任务的间隔
          const tooClose = pageSchedule[page.id].some(existing => {
            const diff = Math.abs(existing.getTime() - scheduledAt.getTime())
            return diff < staggerMin * 60 * 1000
          })
          
          if (!tooClose) {
            tasks.push({
              pageId: page.id,
              videoId: variant.videoId,
              variantId: variant.id,
              scheduledAt,
              status: 'PENDING',
            })
            
            pageSchedule[page.id].push(scheduledAt)
            tasksScheduled++
            scheduled = true
          }
        }
        
        if (!scheduled) {
          errors.push(`Could not schedule variant ${variant.variantName} for page ${page.pageName}`)
        }
      }
    }
    
    // 批量创建任务
    let created = 0
    let createdTasks: Array<{
      id: string
      pageId: string
      videoId: string
      variantId: string
      scheduledAt: Date
    }> = []

    if (tasks.length > 0) {
      createdTasks = await prisma.$transaction(
        tasks.map(task => prisma.publishTask.create({
          data: task,
          select: {
            id: true,
            pageId: true,
            videoId: true,
            variantId: true,
            scheduledAt: true,
          },
        }))
      )
      created = createdTasks.length
    }
    
    return {
      created,
      tasks: createdTasks,
      errors,
      total: variants.length * pages.length,
    }
  }

  // 更新任务状态
  async updateTaskStatus(id: string, status: TaskStatus, data?: {
    errorMessage?: string
    fbPostId?: string
    fbPostUrl?: string
  }) {
    const task = await this.getTaskById(id)
    
    const updateData: Prisma.PublishTaskUpdateInput = { status }
    
    if (status === 'PUBLISHED') {
      updateData.publishedAt = new Date()
      updateData.fbPostId = data?.fbPostId
      updateData.fbPostUrl = data?.fbPostUrl
      
      // 更新页面今日发布计数
      await pageService.incrementDailyCount(task.pageId)
      
      // 增加页面健康分
      await pageService.updateHealthScore(task.pageId, RISK_RULES.HEALTH_SCORE.PUBLISH_SUCCESS, 'Publish success')
    }
    
    if (status === 'FAILED') {
      updateData.errorMessage = data?.errorMessage
      updateData.retryCount = { increment: 1 }
      
      // 减少页面健康分
      await pageService.updateHealthScore(task.pageId, RISK_RULES.HEALTH_SCORE.PUBLISH_FAIL, 'Publish failed')
      
      // 检查连续失败次数
      const consecutiveFailures = await this.getConsecutiveFailures(task.pageId)
      if (consecutiveFailures >= RISK_RULES.CONSECUTIVE_FAIL_THRESHOLD) {
        await pageService.updateHealthScore(
          task.pageId,
          RISK_RULES.HEALTH_SCORE.CONSECUTIVE_FAIL,
          `${consecutiveFailures} consecutive failures`
        )
        await pageService.pausePage(task.pageId)
      }
    }
    
    return prisma.publishTask.update({
      where: { id },
      data: updateData,
    })
  }

  // 取消任务
  async cancelTask(id: string) {
    const task = await this.getTaskById(id)
    
    if (task.status !== 'PENDING') {
      throw new ConflictError('Can only cancel pending tasks')
    }
    
    return prisma.publishTask.update({
      where: { id },
      data: { status: 'CANCELED' },
    })
  }

  // 重试失败任务
  async retryTask(id: string) {
    const task = await this.getTaskById(id)
    
    if (task.status !== 'FAILED') {
      throw new ConflictError('Can only retry failed tasks')
    }
    
    if (task.retryCount >= RISK_RULES.MAX_RETRY_COUNT) {
      throw new ConflictError(`Maximum retry count (${RISK_RULES.MAX_RETRY_COUNT}) exceeded`)
    }
    
    return prisma.publishTask.update({
      where: { id },
      data: {
        status: 'PENDING',
        scheduledAt: new Date(), // 立即重新调度
      },
    })
  }

  // 获取连续失败次数
  async getConsecutiveFailures(pageId: string): Promise<number> {
    const recentTasks = await prisma.publishTask.findMany({
      where: {
        pageId,
        status: 'FAILED',
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })
    
    let count = 0
    for (const task of recentTasks) {
      if (task.status === 'FAILED') {
        count++
      } else {
        break
      }
    }
    
    return count
  }

  // 获取待处理任务
  async getPendingTasks(limit: number = 50) {
    return prisma.publishTask.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: new Date() },
      },
      take: limit,
      orderBy: { scheduledAt: 'asc' },
      include: {
        page: true,
        video: true,
        variant: true,
      },
    })
  }

  // 获取任务统计
  async getTaskStats(dateRange?: { start: Date; end: Date }) {
    const where: Prisma.PublishTaskWhereInput = {}
    if (dateRange) {
      where.scheduledAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      }
    }
    
    const [total, pending, processing, published, failed, canceled] = await Promise.all([
      prisma.publishTask.count({ where }),
      prisma.publishTask.count({ where: { ...where, status: 'PENDING' } }),
      prisma.publishTask.count({ where: { ...where, status: 'PROCESSING' } }),
      prisma.publishTask.count({ where: { ...where, status: 'PUBLISHED' } }),
      prisma.publishTask.count({ where: { ...where, status: 'FAILED' } }),
      prisma.publishTask.count({ where: { ...where, status: 'CANCELED' } }),
    ])
    
    return { total, pending, processing, published, failed, canceled }
  }
}

export const publishTaskService = new PublishTaskService()
