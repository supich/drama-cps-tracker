export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { insightsService } from '@/services/database/insights'
import { handleApiError, successResponse } from '@/lib/errors'

// POST /api/analytics/sync - 手动同步最近已发布视频的 Facebook 播放数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const requestedLimit = Number(body.limit || 50)
    const limit = Math.min(Math.max(requestedLimit, 1), 100)

    const result = await insightsService.syncRecentPublishedTasks(limit)
    return NextResponse.json(successResponse(result))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
