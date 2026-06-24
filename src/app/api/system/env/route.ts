export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { successResponse } from '@/lib/errors'

// GET /api/system/env - 获取环境变量状态（不暴露敏感值）
export async function GET() {
  const env = {
    NODE_ENV: process.env.NODE_ENV || 'unknown',
    META_APP_ID: process.env.META_APP_ID ? 'configured' : 'not set',
    META_APP_SECRET: process.env.META_APP_SECRET ? 'configured' : 'not set',
    USE_META_MOCK: process.env.USE_META_MOCK || 'false',
    DATABASE_URL: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@').replace(/\/\/[^:]+:[^@]+@/, '//***:***@').substring(0, 40) + '...'
      : 'not set',
    REDIS_URL: process.env.REDIS_URL
      ? process.env.REDIS_URL.replace(/:[^:@]*@/, ':***@').replace(/redis:\/\/:[^@]+@/, 'redis://***@').substring(0, 30) + '...'
      : (process.env.REDIS_PRIVATE_URL ? 'configured (REDIS_PRIVATE_URL)' : 'not set'),
    STORAGE_TYPE: process.env.STORAGE_TYPE || 'local',
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  }

  return NextResponse.json(successResponse(env))
}
