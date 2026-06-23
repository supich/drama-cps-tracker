export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'

// GET /api/system/health - 系统健康检查
// 始终返回 200，服务状态写在 body 中，避免 Railway healthcheck 误判
export async function GET(_request: NextRequest) {
  const services: Record<string, string> = {}

  // 检查数据库连接（加超时避免长时间挂起）
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
    services.database = 'healthy'
  } catch {
    services.database = 'unhealthy'
  }

  // 检查 Redis 连接（加超时避免长时间挂起）
  try {
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
    services.redis = 'healthy'
  } catch {
    services.redis = 'unhealthy'
  }

  const allHealthy = Object.values(services).every((s) => s === 'healthy')

  return NextResponse.json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services,
  })
}