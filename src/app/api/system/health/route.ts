"use server"

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'
import { getQueueStatus } from '@/services/queue'

// GET /api/system/health - 系统健康检查
export async function GET(request: NextRequest) {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`
    const dbStatus = 'healthy'
    
    // 检查 Redis 连接
    let redisStatus = 'healthy'
    try {
      await redis.ping()
    } catch (error) {
      redisStatus = 'unhealthy'
    }
    
    // 检查队列状态
    const queueStatus = await getQueueStatus()
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: dbStatus,
          redis: redisStatus,
          queues: {
            publish: {
              waiting: queueStatus.publish.waiting,
              active: queueStatus.publish.active,
              delayed: queueStatus.publish.delayed,
            },
            insights: {
              waiting: queueStatus.insights.waiting,
              active: queueStatus.insights.active,
            },
            health: {
              waiting: queueStatus.health.waiting,
              active: queueStatus.health.active,
            },
          },
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'System health check failed',
        },
      },
      { status: 500 }
    )
  }
}