export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/services/database/analytics'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/analytics/time - 按时间统计
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const groupBy = (searchParams.get('groupBy') || 'day') as 'day' | 'week' | 'month'
    const pageId = searchParams.get('pageId') || undefined
    const videoId = searchParams.get('videoId') || undefined
    const variantId = searchParams.get('variantId') || undefined
    
    const stats = await analyticsService.getStatsByTime({
      startDate,
      endDate,
      groupBy,
      pageId,
      videoId,
      variantId,
    })
    return NextResponse.json(successResponse(stats))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}