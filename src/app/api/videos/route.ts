"use server"

import { NextRequest, NextResponse } from 'next/server'
import { videoService } from '@/services/database/videos'
import { createVideoSchema, paginationSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/videos - 获取所有视频
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
    })
    
    const result = await videoService.getVideos({
      page: params.page,
      limit: params.limit,
      status: params.status as any,
      search: params.search,
      dramaId: searchParams.get('dramaId') || undefined,
      language: searchParams.get('language') || undefined,
    })
    
    return NextResponse.json(successResponse(result))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// POST /api/videos - 创建新视频
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createVideoSchema.parse(body)
    
    const video = await videoService.createVideo(validatedData)
    
    return NextResponse.json(successResponse(video, 201))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}