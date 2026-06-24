import prisma from '@/lib/prisma'
import { getObjectEngagement, getPostInsights, getVideoInsights } from '@/services/meta'
import { MetaPostInsights } from '@/services/meta/types'

type InsightTotals = {
  views: number
  reactions: number
  comments: number
  shares: number
  clicks: number
}

function getMetricValue(insights: MetaPostInsights | null, metricName: string) {
  const value = insights?.data.find(metric => metric.name === metricName)?.values[0]?.value
  return typeof value === 'number' ? value : 0
}

function getReactionTotal(insights: MetaPostInsights | null, metricName: string) {
  const value = insights?.data.find(metric => metric.name === metricName)?.values[0]?.value
  if (!value || typeof value === 'number') return 0

  return Object.values(value).reduce((sum, count) => sum + count, 0)
}

export class InsightsService {
  async syncPublishTaskInsights(taskId: string) {
    const task = await prisma.publishTask.findUnique({
      where: { id: taskId },
      include: {
        page: true,
      },
    })

    if (!task || task.status !== 'PUBLISHED') {
      return {
        success: false,
        skipped: true,
        message: task ? 'Task is not published' : 'Task not found',
      }
    }

    if (!task.fbPostId && !task.fbVideoId) {
      return {
        success: false,
        skipped: true,
        message: 'Task has no Facebook post or video id',
      }
    }

    const totals: InsightTotals = {
      views: 0,
      reactions: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
    }
    const errors: string[] = []

    let videoInsights: MetaPostInsights | null = null
    let postInsights: MetaPostInsights | null = null

    if (task.fbVideoId) {
      try {
        videoInsights = await getVideoInsights(task.fbVideoId, task.page.accessToken)
        totals.views = getMetricValue(videoInsights, 'total_video_views')
        totals.reactions = getReactionTotal(videoInsights, 'total_video_reactions_by_type_total')
      } catch (error: any) {
        errors.push(`video_insights: ${error.message}`)
      }
    }

    if (task.fbPostId) {
      try {
        postInsights = await getPostInsights(task.fbPostId, task.page.accessToken)
        totals.views = totals.views || getMetricValue(postInsights, 'post_video_views') || getMetricValue(postInsights, 'post_impressions')
        totals.reactions = totals.reactions || getReactionTotal(postInsights, 'post_reactions_by_type_total')
        totals.clicks = getMetricValue(postInsights, 'post_clicks')
      } catch (error: any) {
        errors.push(`post_insights: ${error.message}`)
      }
    }

    const engagementObjectId = task.fbPostId || task.fbVideoId
    if (engagementObjectId) {
      try {
        const engagement = await getObjectEngagement(engagementObjectId, task.page.accessToken)
        totals.reactions = engagement.reactions?.summary?.total_count
          ?? engagement.likes?.summary?.total_count
          ?? totals.reactions
        totals.comments = engagement.comments?.summary?.total_count ?? 0
        totals.shares = engagement.shares?.count ?? 0
      } catch (error: any) {
        errors.push(`engagement: ${error.message}`)
      }
    }

    if (!videoInsights && !postInsights) {
      throw new Error(errors.join('；') || 'No Facebook insights returned')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const log = await prisma.performanceLog.upsert({
      where: {
        pageId_videoId_variantId_date: {
          pageId: task.pageId,
          videoId: task.videoId,
          variantId: task.variantId,
          date: today,
        },
      },
      update: {
        publishTaskId: task.id,
        fbPostId: task.fbPostId,
        fbVideoId: task.fbVideoId,
        views: totals.views,
        reactions: totals.reactions,
        comments: totals.comments,
        shares: totals.shares,
        clicks: totals.clicks,
      },
      create: {
        pageId: task.pageId,
        videoId: task.videoId,
        variantId: task.variantId,
        publishTaskId: task.id,
        fbPostId: task.fbPostId,
        fbVideoId: task.fbVideoId,
        views: totals.views,
        reactions: totals.reactions,
        comments: totals.comments,
        shares: totals.shares,
        clicks: totals.clicks,
        date: today,
      },
    })

    return {
      success: true,
      data: totals,
      logId: log.id,
      warnings: errors,
    }
  }

  async syncRecentPublishedTasks(limit = 50) {
    const tasks = await prisma.publishTask.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { fbPostId: { not: null } },
          { fbVideoId: { not: null } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: { id: true },
    })

    let synced = 0
    let skipped = 0
    const failures: Array<{ taskId: string; message: string }> = []

    for (const task of tasks) {
      try {
        const result = await this.syncPublishTaskInsights(task.id)
        if (result.success) synced++
        else skipped++
      } catch (error: any) {
        failures.push({ taskId: task.id, message: error.message })
      }
    }

    return {
      total: tasks.length,
      synced,
      skipped,
      failed: failures.length,
      failures,
    }
  }
}

export const insightsService = new InsightsService()
