export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { publishTaskService } from '@/services/database/publish-tasks'
import { handleApiError, successResponse } from '@/lib/errors'

// PATCH /api/publish-tasks/:id/cancel - 取消发布任务
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await publishTaskService.cancelTask(params.id)
    return NextResponse.json(successResponse(task))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}