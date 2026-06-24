export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { publishTaskService } from '@/services/database/publish-tasks'
import { removePublishJob } from '@/services/queue'
import { executePublishTask } from '@/services/publisher'
import { handleApiError, successResponse } from '@/lib/errors'

// PATCH /api/publish-tasks/:id/publish-now - 将待发布任务立即加入发布队列
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await removePublishJob(params.id)
    const task = await publishTaskService.publishTaskNow(params.id)
    const result = await executePublishTask(task.id, {
      origin: new URL(_request.url).origin,
    })

    return NextResponse.json(successResponse({ task, result }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
