export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { publishTaskService } from '@/services/database/publish-tasks'
import { createBatchPublishSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'
import { addBatchPublishJobs } from '@/services/queue'
import { executePublishTask } from '@/services/publisher'

function startImmediatePublishTasks(
  tasks: Array<{ id: string; scheduledAt: Date }>,
  origin: string
) {
  for (const task of tasks) {
    const delay = Math.max(0, task.scheduledAt.getTime() - Date.now())

    setTimeout(() => {
      executePublishTask(task.id, { origin }).catch(error => {
        console.error(`Immediate publish task ${task.id} failed:`, error)
      })
    }, delay)
  }
}

// POST /api/publish-tasks/batch-create - 批量创建发布任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createBatchPublishSchema.parse(body)
    
    // 创建发布任务
    const result = await publishTaskService.createBatchTasks({
      variantIds: validatedData.variantIds,
      videoIds: validatedData.videoIds,
      pageIds: validatedData.pageIds,
      publishMode: validatedData.publishMode,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      staggerMin: validatedData.staggerMin,
      staggerMax: validatedData.staggerMax,
      publishHoursStart: validatedData.publishHoursStart,
      publishHoursEnd: validatedData.publishHoursEnd,
    })
    
    if (result.created > 0 && validatedData.publishMode === 'NOW') {
      startImmediatePublishTasks(result.tasks, new URL(request.url).origin)

      return NextResponse.json(successResponse({
        ...result,
        queuedForPublish: result.created,
      }))
    }

    // 如果成功创建了预约/排期任务，将它们添加到队列
    if (result.created > 0) {
      // 添加到队列
      const queueJobs = result.tasks.map(task => ({
        taskId: task.id,
        pageId: task.pageId,
        videoId: task.videoId,
        variantId: task.variantId,
        scheduledAt: task.scheduledAt,
      }))
      
      await addBatchPublishJobs(queueJobs)
    }
    
    return NextResponse.json(successResponse(result))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
