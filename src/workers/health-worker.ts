"use server"

import { Worker, Job } from 'bullmq'
import { connection } from '@/services/queue'
import prisma from '@/lib/prisma'
import { QUEUE_NAMES } from '@/services/queue'
import { validatePageToken, getPageStatus } from '@/services/meta'
import { pageService } from '@/services/database/pages'
import { RISK_RULES } from '@/lib/constants'

interface HealthJobData {
  pageId: string
  pageAccessToken: string
}

// 主页健康检查处理函数
async function processHealthJob(job: Job<HealthJobData>) {
  const { pageId, pageAccessToken } = job.data
  
  console.log(`Checking health for page: ${pageId}`)
  
  try {
    // 获取页面信息
    const page = await pageService.getPageByPageId(pageId)
    if (!page) {
      throw new Error(`Page ${pageId} not found`)
    }
    
    // 验证token
    let tokenValid = false
    try {
      const tokenInfo = await validatePageToken(pageAccessToken)
      tokenValid = tokenInfo.is_valid
      
      // 更新token过期时间
      if (tokenInfo.expires_at > 0) {
        await pageService.updatePage(page.id, {
          tokenExpiresAt: new Date(tokenInfo.expires_at * 1000),
        })
      }
    } catch (error) {
      console.error(`Token validation failed for page ${pageId}:`, error)
      tokenValid = false
    }
    
    // 获取页面状态
    let pageStatus = { isPublished: true, isUnpublished: false }
    try {
      pageStatus = await getPageStatus(pageId, pageAccessToken)
    } catch (error) {
      console.error(`Failed to get page status for ${pageId}:`, error)
    }
    
    // 确定健康分变化
    let healthChange = 0
    let reason = ''
    
    if (!tokenValid) {
      healthChange = RISK_RULES.HEALTH_SCORE.WARNING
      reason = 'Invalid token'
    } else if (pageStatus.isUnpublished) {
      healthChange = RISK_RULES.HEALTH_SCORE.RESTRICTED
      reason = 'Page unpublished'
    } else {
      // 健康恢复
      healthChange = RISK_RULES.HEALTH_SCORE.RECOVERY
      reason = 'Health recovery'
    }
    
    // 更新健康分
    if (healthChange !== 0) {
      await pageService.updateHealthScore(page.id, healthChange, reason)
    }
    
    // 记录健康日志
    await prisma.pageHealthLog.create({
      data: {
        pageId: page.id,
        healthScore: page.healthScore + healthChange,
        status: !tokenValid ? 'WARNING' : pageStatus.isUnpublished ? 'RESTRICTED' : page.status,
        tokenValid,
        details: {
          reason,
          healthChange,
          previousScore: page.healthScore,
        },
      },
    })
    
    // 如果token无效，暂停页面
    if (!tokenValid && page.status === 'ACTIVE') {
      await pageService.pausePage(page.id)
    }
    
    console.log(`Health check completed for page ${pageId}: tokenValid=${tokenValid}, healthChange=${healthChange}`)
    
    return {
      success: true,
      tokenValid,
      healthChange,
    }
  } catch (error: any) {
    console.error(`Failed to check health for page ${pageId}:`, error.message)
    throw error
  }
}

// 创建 Worker
export const healthWorker = new Worker<HealthJobData>(
  QUEUE_NAMES.PAGE_HEALTH,
  processHealthJob,
  {
    connection,
    concurrency: 2,
    limiter: {
      max: 10,
      duration: 1000 * 60 * 5, // 每5分钟最多10个任务
    },
  }
)

// Worker 事件处理
healthWorker.on('completed', (job) => {
  console.log(`Health job ${job.id} completed`)
})

healthWorker.on('failed', (job, err) => {
  console.error(`Health job ${job?.id} failed:`, err.message)
})

healthWorker.on('error', (err) => {
  console.error('Health worker error:', err)
})

// 处理进程退出
process.on('SIGTERM', async () => {
  console.log('Shutting down health worker...')
  await healthWorker.close()
})

process.on('SIGINT', async () => {
  console.log('Shutting down health worker...')
  await healthWorker.close()
})

console.log('Health worker started')

export default healthWorker