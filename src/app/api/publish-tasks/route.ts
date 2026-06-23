export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { publishTaskService } from '@/services/database/publish-tasks'
import { paginationSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'
import { TaskStatus } from '@prisma/client'

// GET /api/publish-tasks - 获取发布任务列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
    })
    
    const result = await publishTaskService.getTasks({
      page: params.page,
      limit: params.limit,
      status: params.status as TaskStatus | undefined,
      pageId: searchParams.get('pageId') || undefined,
      videoId: searchParams.get('videoId') || undefined,
      variantId: searchParams.get('variantId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    })
    
    return NextResponse.json(successResponse(result))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}