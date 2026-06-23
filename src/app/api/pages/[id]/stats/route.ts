"use server"

import { NextRequest, NextResponse } from 'next/server'
import { pageService } from '@/services/database/pages'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/pages/:id/stats - 获取页面统计数据
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    
    const stats = await pageService.getPageStats(params.id, days)
    return NextResponse.json(successResponse(stats))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}