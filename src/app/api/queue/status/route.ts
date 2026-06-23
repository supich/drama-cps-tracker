export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getQueueStatus } from '@/services/queue'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/queue/status - 获取队列状态
export async function GET(request: NextRequest) {
  try {
    const status = await getQueueStatus()
    return NextResponse.json(successResponse(status))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}