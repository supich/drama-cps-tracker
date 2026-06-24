"use server"

import { Worker, Job } from 'bullmq'
import { connection } from '@/services/queue'
import { QUEUE_NAMES } from '@/services/queue'
import { insightsService } from '@/services/database/insights'

interface InsightsJobData {
  taskId?: string
  postId: string
  videoId?: string
  pageId: string
  pageAccessToken: string
}

// 数据同步处理函数
async function processInsightsJob(job: Job<InsightsJobData>) {
  const { taskId, postId, videoId } = job.data
  
  console.log(`Syncing insights for post: ${postId}${videoId ? `, video: ${videoId}` : ''}`)
  
  try {
    const publishTaskId = taskId || await findTaskId(postId, videoId)

    if (!publishTaskId) {
      console.warn(`No publish task found for post ${postId}`)
      return { success: true, message: 'No task found' }
    }

    const result = await insightsService.syncPublishTaskInsights(publishTaskId)

    console.log(`Insights synced for post ${postId}: ${JSON.stringify(result.data || result.message)}`)
    
    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error(`Failed to sync insights for post ${postId}:`, error.message)
    throw error
  }
}

async function findTaskId(postId: string, videoId?: string) {
  const { default: prisma } = await import('@/lib/prisma')
  const task = await prisma.publishTask.findFirst({
    where: {
      OR: [
        { fbPostId: postId },
        ...(videoId ? [{ fbVideoId: videoId }] : []),
      ],
    },
    select: { id: true },
  })

  return task?.id
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
