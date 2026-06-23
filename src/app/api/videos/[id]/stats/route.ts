"use server"

import { NextRequest, NextResponse } from 'next/server'
import { videoService } from '@/services/database/videos'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/videos/:id/stats - 获取视频统计数据
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    
    const stats = await videoService.getVideoStats(params.id, days)
    return NextResponse.json(successResponse(stats))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}