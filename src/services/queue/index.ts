import { Queue, QueueEvents } from 'bullmq'

// BullMQ 连接配置（使用连接选项而非 Redis 实例以避免类型冲突）
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const parsedUrl = new URL(redisUrl)

const connection = {
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port || '6379'),
  password: parsedUrl.password || undefined,
  maxRetriesPerRequest: null,
  lazyConnect: true,
}

export { connection }

// 队列名称常量
export const QUEUE_NAMES = {
  PUBLISH_VIDEO: 'publish-video',
  SYNC_INSIGHTS: 'sync-insights',
  PAGE_HEALTH: 'page-health',
} as const

// 创建队列实例
export const publishQueue = new Queue(QUEUE_NAMES.PUBLISH_VIDEO, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000 * 60, // 1分钟
    },
    removeOnComplete: {
      age: 24 * 3600, // 保留24小时
      count: 1000, // 最多保留1000个
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 保留7天
    },
  },
})

export const insightsQueue = new Queue(QUEUE_NAMES.SYNC_INSIGHTS, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000 * 60 * 5, // 5分钟
    },
    removeOnComplete: true,
    removeOnFail: {
      age: 3 * 24 * 3600,
    },
  },
})

export const healthQueue = new Queue(QUEUE_NAMES.PAGE_HEALTH, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000 * 60 * 10, // 10分钟
    },
    removeOnComplete: true,
    removeOnFail: {
      age: 3 * 24 * 3600,
    },
  },
})

// 队列事件监听器
export const publishQueueEvents = new QueueEvents(QUEUE_NAMES.PUBLISH_VIDEO, {
  connection,
})

export const insightsQueueEvents = new QueueEvents(QUEUE_NAMES.SYNC_INSIGHTS, {
  connection,
})

export const healthQueueEvents = new QueueEvents(QUEUE_NAMES.PAGE_HEALTH, {
  connection,
})

// 添加发布任务到队列
export async function addPublishJob(data: {
  taskId: string
  pageId: string
  videoId: string
  variantId: string
  scheduledAt?: Date
}) {
  const delay = data.scheduledAt
    ? Math.max(0, data.scheduledAt.getTime() - Date.now())
    : 0
  
  return publishQueue.add('publish-video', data, {
    jobId: `publish-${data.taskId}`,
    delay,
  })
}

// 添加数据同步任务
export async function addInsightsJob(data: {
  postId: string
  pageId: string
  pageAccessToken: string
}) {
  return insightsQueue.add('sync-insights', data, {
    jobId: `insights-${data.postId}`,
  })
}

// 添加主页健康检查任务
export async function addHealthCheckJob(data: {
  pageId: string
  pageAccessToken: string
}) {
  return healthQueue.add('page-health', data, {
    jobId: `health-${data.pageId}`,
  })
}

// 批量添加发布任务
export async function addBatchPublishJobs(tasks: Array<{
  taskId: string
  pageId: string
  videoId: string
  variantId: string
  scheduledAt: Date
}>) {
  const jobs = tasks.map(task => ({
    name: 'publish-video',
    data: task,
    opts: {
      jobId: `publish-${task.taskId}`,
      delay: Math.max(0, task.scheduledAt.getTime() - Date.now()),
    },
  }))
  
  return publishQueue.addBulk(jobs)
}

// 获取队列状态
export async function getQueueStatus() {
  const [publishWaiting, publishActive, publishDelayed, publishCompleted, publishFailed] =
    await Promise.all([
      publishQueue.getWaitingCount(),
      publishQueue.getActiveCount(),
      publishQueue.getDelayedCount(),
      publishQueue.getCompletedCount(),
      publishQueue.getFailedCount(),
    ])
  
  const [insightsWaiting, insightsActive] = await Promise.all([
    insightsQueue.getWaitingCount(),
    insightsQueue.getActiveCount(),
  ])
  
  const [healthWaiting, healthActive] = await Promise.all([
    healthQueue.getWaitingCount(),
    healthQueue.getActiveCount(),
  ])
  
  return {
    publish: {
      waiting: publishWaiting,
      active: publishActive,
      delayed: publishDelayed,
      completed: publishCompleted,
      failed: publishFailed,
    },
    insights: {
      waiting: insightsWaiting,
      active: insightsActive,
    },
    health: {
      waiting: healthWaiting,
      active: healthActive,
    },
  }
}

// 清理队列
export async function cleanQueues() {
  await Promise.all([
    publishQueue.clean(24 * 3600 * 1000, 100, 'completed'),
    publishQueue.clean(7 * 24 * 3600 * 1000, 100, 'failed'),
    insightsQueue.clean(24 * 3600 * 1000, 50, 'completed'),
    healthQueue.clean(24 * 3600 * 1000, 50, 'completed'),
  ])
}

// 关闭队列连接
export async function closeQueues() {
  await Promise.all([
    publishQueue.close(),
    insightsQueue.close(),
    healthQueue.close(),
    publishQueueEvents.close(),
    insightsQueueEvents.close(),
    healthQueueEvents.close(),
  ])
}