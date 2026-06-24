export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { publishTaskService } from '@/services/database/publish-tasks'
import { addPublishJob, removePublishJob } from '@/services/queue'
import { handleApiError, successResponse } from '@/lib/errors'

// PATCH /api/publish-tasks/:id/publish-now - 将待发布任务立即加入发布队列
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await removePublishJob(params.id)
    const task = await publishTaskService.publishTaskNow(params.id)

    await addPublishJob({
      taskId: task.id,
      pageId: task.pageId,
      videoId: task.videoId,
      variantId: task.variantId,
      scheduledAt: task.scheduledAt,
    })

    return NextResponse.json(successResponse(task))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
