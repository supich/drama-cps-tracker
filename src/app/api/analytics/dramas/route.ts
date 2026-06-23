export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/services/database/analytics'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/analytics/dramas - 获取剧集统计
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const dramaId = searchParams.get('dramaId') || undefined
    
    const stats = await analyticsService.getStatsByDrama({ startDate, endDate, dramaId })
    return NextResponse.json(successResponse(stats))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}