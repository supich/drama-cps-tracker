export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { publishTaskService } from '@/services/database/publish-tasks'
import { handleApiError, successResponse } from '@/lib/errors'
import { removePublishJob } from '@/services/queue'

// DELETE /api/publish-tasks/:id - 删除发布任务
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await removePublishJob(params.id)
    await publishTaskService.deleteTask(params.id)
    return NextResponse.json(successResponse({ deleted: true }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
