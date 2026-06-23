"use server"

import { NextRequest, NextResponse } from 'next/server'
import { publishTaskService } from '@/services/database/publish-tasks'
import { handleApiError, successResponse } from '@/lib/errors'
import { addPublishJob } from '@/services/queue'

// POST /api/publish-tasks/:id/retry - 重试失败任务
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 重置任务状态
    const task = await publishTaskService.retryTask(params.id)
    
    // 重新添加到队列
    await addPublishJob({
      taskId: task.id,
      pageId: task.pageId,
      videoId: task.videoId,
      variantId: task.variantId,
    })
    
    return NextResponse.json(successResponse(task))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}