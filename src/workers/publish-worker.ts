"use server"

import { Worker, Job } from 'bullmq'
import { connection } from '@/services/queue'
import prisma from '@/lib/prisma'
import { QUEUE_NAMES } from '@/services/queue'
import { publishVideoToPage } from '@/services/meta'
import { pageService } from '@/services/database/pages'
import { publishTaskService } from '@/services/database/publish-tasks'
import { generateTrackingUrl } from '@/lib/utils'

interface PublishJobData {
  taskId: string
  pageId: string
  videoId: string
  variantId: string
}

// 发布任务处理函数
async function processPublishJob(job: Job<PublishJobData>) {
  const { taskId, pageId, videoId, variantId } = job.data
  
  console.log(`Processing publish task: ${taskId}`)
  
  try {
    // 更新任务状态为处理中
    await publishTaskService.updateTaskStatus(taskId, 'PROCESSING')
    
    // 获取任务详情
    const task = await publishTaskService.getTaskById(taskId)
    const page = task.page
    const video = task.video
    const variant = task.variant
    
    // 检查页面状态
    if (page.status !== 'ACTIVE') {
      throw new Error(`Page ${page.pageName} is not active (status: ${page.status})`)
    }
    
    // 检查每日发布限制
    const canPublish = await pageService.checkDailyLimit(pageId)
    if (!canPublish) {
      throw new Error(`Page ${page.pageName} has reached daily limit`)
    }
    
    // 检查健康分
    if (page.healthScore < 60) {
      throw new Error(`Page ${page.pageName} health score is too low (${page.healthScore})`)
    }
    
    // 生成带追踪参数的描述
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const trackingUrl = generateTrackingUrl(baseUrl, {
      dramaId: video.dramaId,
      pageId,
      videoId,
      variantId,
    })
    
    // 构建发布内容
    const title = variant.title || video.title
    const description = [
      variant.caption || '',
      '',
      '🎬 Watch the full series here:',
      trackingUrl,
      '',
      ...(variant.hashtags || []).map(tag => `#${tag}`),
    ].join('\n')
    
    // 调用 Meta API 发布视频
    const result = await publishVideoToPage(
      page.pageId,
      page.accessToken,
      video.fileUrl,
      title,
      description
    )
    
    // 更新任务状态为已发布
    await publishTaskService.updateTaskStatus(taskId, 'PUBLISHED', {
      fbPostId: result.post_id,
      fbPostUrl: `https://facebook.com/${result.post_id}`,
    })
    
    console.log(`Successfully published task ${taskId}, post ID: ${result.post_id}`)
    
    return {
      success: true,
      postId: result.post_id,
    }
  } catch (error: any) {
    console.error(`Failed to publish task ${taskId}:`, error.message)
    
    // 更新任务状态为失败
    await publishTaskService.updateTaskStatus(taskId, 'FAILED', {
      errorMessage: error.message,
    })
    
    // 重新抛出错误，让 BullMQ 处理重试
    throw error
  }
}

// 创建 Worker
export const publishWorker = new Worker<PublishJobData>(
  QUEUE_NAMES.PUBLISH_VIDEO,
  processPublishJob,
  {
    connection,
    concurrency: parseInt(process.env.PUBLISH_WORKER_CONCURRENCY || '5'),
    limiter: {
      max: 10,
      duration: 1000 * 60, // 每分钟最多10个任务
    },
  }
)

// Worker 事件处理
publishWorker.on('completed', (job) => {
  console.log(`Publish job ${job.id} completed`)
})

publishWorker.on('failed', (job, err) => {
  console.error(`Publish job ${job?.id} failed:`, err.message)
})

publishWorker.on('error', (err) => {
  console.error('Publish worker error:', err)
})

// 处理进程退出
process.on('SIGTERM', async () => {
  console.log('Shutting down publish worker...')
  await publishWorker.close()
})

process.on('SIGINT', async () => {
  console.log('Shutting down publish worker...')
  await publishWorker.close()
})

console.log('Publish worker started')

export default publishWorker