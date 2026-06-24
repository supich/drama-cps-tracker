"use server"

import { Worker, Job } from 'bullmq'
import { connection } from '@/services/queue'
import { QUEUE_NAMES } from '@/services/queue'
import { executePublishTask } from '@/services/publisher'

interface PublishJobData {
  taskId: string
  pageId: string
  videoId: string
  variantId: string
}

// 发布任务处理函数
async function processPublishJob(job: Job<PublishJobData>) {
  const { taskId } = job.data
  
  console.log(`Processing publish task: ${taskId}`)
  
  try {
    const result = await executePublishTask(taskId)
    
    console.log(`Successfully published task ${taskId}, post ID: ${result.postId}`)
    
    return result
  } catch (error: any) {
    console.error(`Failed to publish task ${taskId}:`, error.message)
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
