"use server"

import { Worker, Job } from 'bullmq'
import { connection } from '@/services/queue'
import prisma from '@/lib/prisma'
import { QUEUE_NAMES } from '@/services/queue'
import { getPostInsights } from '@/services/meta'

interface InsightsJobData {
  postId: string
  pageId: string
  pageAccessToken: string
}

// 数据同步处理函数
async function processInsightsJob(job: Job<InsightsJobData>) {
  const { postId, pageId, pageAccessToken } = job.data
  
  console.log(`Syncing insights for post: ${postId}`)
  
  try {
    // 从 Meta API 获取帖子数据
    const insights = await getPostInsights(postId, pageAccessToken)
    
    // 解析 insights 数据
    let views = 0
    let reactions = 0
    let clicks = 0
    
    for (const metric of insights.data) {
      switch (metric.name) {
        case 'post_impressions':
          views = typeof metric.values[0]?.value === 'number' ? metric.values[0].value : 0
          break
        case 'post_reactions_by_type_total':
          const reactionData = metric.values[0]?.value || {}
          reactions = Object.values(reactionData as Record<string, number>).reduce(
            (sum, val) => sum + val,
            0
          )
          break
        case 'post_clicks':
          clicks = typeof metric.values[0]?.value === 'number' ? metric.values[0].value : 0
          break
        case 'post_video_views':
          // 视频观看数可以作为额外指标
          break
      }
    }
    
    // 查找对应的发布任务
    const publishTask = await prisma.publishTask.findFirst({
      where: { fbPostId: postId },
    })
    
    if (!publishTask) {
      console.warn(`No publish task found for post ${postId}`)
      return { success: true, message: 'No task found' }
    }
    
    // 更新或创建性能日志
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await prisma.performanceLog.upsert({
      where: {
        pageId_videoId_variantId_date: {
          pageId: publishTask.pageId,
          videoId: publishTask.videoId,
          variantId: publishTask.variantId,
          date: today,
        },
      },
      update: {
        views,
        reactions,
        clicks,
        // 保留其他字段的增量更新
      },
      create: {
        pageId: publishTask.pageId,
        videoId: publishTask.videoId,
        variantId: publishTask.variantId,
        publishTaskId: publishTask.id,
        fbPostId: postId,
        views,
        reactions,
        clicks,
        date: today,
      },
    })
    
    console.log(`Insights synced for post ${postId}: views=${views}, reactions=${reactions}, clicks=${clicks}`)
    
    return {
      success: true,
      data: { views, reactions, clicks },
    }
  } catch (error: any) {
    console.error(`Failed to sync insights for post ${postId}:`, error.message)
    throw error
  }
}

// 创建 Worker
export const insightsWorker = new Worker<InsightsJobData>(
  QUEUE_NAMES.SYNC_INSIGHTS,
  processInsightsJob,
  {
    connection,
    concurrency: 3,
    limiter: {
      max: 20,
      duration: 1000 * 60,
    },
  }
)

// Worker 事件处理
insightsWorker.on('completed', (job) => {
  console.log(`Insights job ${job.id} completed`)
})

insightsWorker.on('failed', (job, err) => {
  console.error(`Insights job ${job?.id} failed:`, err.message)
})

insightsWorker.on('error', (err) => {
  console.error('Insights worker error:', err)
})

// 处理进程退出
process.on('SIGTERM', async () => {
  console.log('Shutting down insights worker...')
  await insightsWorker.close()
})

process.on('SIGINT', async () => {
  console.log('Shutting down insights worker...')
  await insightsWorker.close()
})

console.log('Insights worker started')

export default insightsWorker