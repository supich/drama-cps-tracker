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

// ── 懒加载队列实例（避免构建阶段触发 Redis 连接）──────────────────────────

let _publishQueue: Queue | undefined
let _insightsQueue: Queue | undefined
let _healthQueue: Queue | undefined
let _publishQueueEvents: QueueEvents | undefined
let _insightsQueueEvents: QueueEvents | undefined
let _healthQueueEvents: QueueEvents | undefined

function getPublishQueue(): Queue {
  if (!_publishQueue) {
    _publishQueue = new Queue(QUEUE_NAMES.PUBLISH_VIDEO, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 * 60 },
        removeOnComplete: { age: 24 * 3600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    })
  }
  return _publishQueue
}

function getInsightsQueue(): Queue {
  if (!_insightsQueue) {
    _insightsQueue = new Queue(QUEUE_NAMES.SYNC_INSIGHTS, {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 * 60 * 5 },
        removeOnComplete: true,
        removeOnFail: { age: 3 * 24 * 3600 },
      },
    })
  }
  return _insightsQueue
}

function getHealthQueue(): Queue {
  if (!_healthQueue) {
    _healthQueue = new Queue(QUEUE_NAMES.PAGE_HEALTH, {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 * 60 * 10 },
        removeOnComplete: true,
        removeOnFail: { age: 3 * 24 * 3600 },
      },
    })
  }
  return _healthQueue
}

export function getPublishQueueEvents(): QueueEvents {
  if (!_publishQueueEvents) {
    _publishQueueEvents = new QueueEvents(QUEUE_NAMES.PUBLISH_VIDEO, { connection })
  }
  return _publishQueueEvents
}

export function getInsightsQueueEvents(): QueueEvents {
  if (!_insightsQueueEvents) {
    _insightsQueueEvents = new QueueEvents(QUEUE_NAMES.SYNC_INSIGHTS, { connection })
  }
  return _insightsQueueEvents
}

export function getHealthQueueEvents(): QueueEvents {
  if (!_healthQueueEvents) {
    _healthQueueEvents = new QueueEvents(QUEUE_NAMES.PAGE_HEALTH, { connection })
  }
  return _healthQueueEvents
}

// ── 公开的队列操作函数 ─────────────────────────────────────────────────────

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
  return getPublishQueue().add('publish-video', data, {
    jobId: `publish-${data.taskId}`,
    delay,
  })
}

// 移除指定发布任务的队列 Job，用于删除任务或改成立即发布前清理旧延迟任务
export async function removePublishJob(taskId: string) {
  const job = await getPublishQueue().getJob(`publish-${taskId}`)
  if (job) {
    await job.remove()
  }
}

// 添加数据同步任务
export async function addInsightsJob(data: {
  taskId?: string
  postId: string
  videoId?: string
  pageId: string
  pageAccessToken: string
  delayMs?: number
}) {
  return getInsightsQueue().add('sync-insights', data, {
    jobId: `insights-${data.taskId || data.postId}-${data.delayMs || 0}`,
    delay: data.delayMs || 0,
  })
}

// 添加主页健康检查任务
export async function addHealthCheckJob(data: {
  pageId: string
  pageAccessToken: string
}) {
  return getHealthQueue().add('page-health', data, {
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
  return getPublishQueue().addBulk(jobs)
}

// 获取队列状态
export async function getQueueStatus() {
  const pq = getPublishQueue()
  const iq = getInsightsQueue()
  const hq = getHealthQueue()

  const [
    publishWaiting, publishActive, publishDelayed, publishCompleted, publishFailed,
    insightsWaiting, insightsActive,
    healthWaiting, healthActive,
  ] = await Promise.all([
    pq.getWaitingCount(),
    pq.getActiveCount(),
    pq.getDelayedCount(),
    pq.getCompletedCount(),
    pq.getFailedCount(),
    iq.getWaitingCount(),
    iq.getActiveCount(),
    hq.getWaitingCount(),
    hq.getActiveCount(),
  ])

  return {
    publish: { waiting: publishWaiting, active: publishActive, delayed: publishDelayed, completed: publishCompleted, failed: publishFailed },
    insights: { waiting: insightsWaiting, active: insightsActive },
    health: { waiting: healthWaiting, active: healthActive },
  }
}

// 清理队列
export async function cleanQueues() {
  await Promise.all([
    getPublishQueue().clean(24 * 3600 * 1000, 100, 'completed'),
    getPublishQueue().clean(7 * 24 * 3600 * 1000, 100, 'failed'),
    getInsightsQueue().clean(24 * 3600 * 1000, 50, 'completed'),
    getHealthQueue().clean(24 * 3600 * 1000, 50, 'completed'),
  ])
}
