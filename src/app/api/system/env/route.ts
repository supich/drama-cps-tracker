export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { successResponse } from '@/lib/errors'
import { settingsService } from '@/services/database/settings'

// GET /api/system/env - 获取环境变量状态（不暴露敏感值）
export async function GET() {
  const metaCredentials = await settingsService.getMetaAppCredentials()
  const env = {
    NODE_ENV: process.env.NODE_ENV || 'unknown',
    META_APP_ID: metaCredentials.appId ? 'configured' : 'not set',
    META_APP_SECRET: metaCredentials.appSecret ? 'configured' : 'not set',
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
