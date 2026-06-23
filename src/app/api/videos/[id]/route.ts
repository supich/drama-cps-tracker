export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { videoService } from '@/services/database/videos'
import { updateVideoSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/videos/:id - 获取单个视频
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const video = await videoService.getVideoById(params.id)
    return NextResponse.json(successResponse(video))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// PATCH /api/videos/:id - 更新视频
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateVideoSchema.parse(body)
    
    const video = await videoService.updateVideo(params.id, validatedData)
    return NextResponse.json(successResponse(video))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// DELETE /api/videos/:id - 删除视频
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await videoService.deleteVideo(params.id)
    return NextResponse.json(successResponse({ deleted: true }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}