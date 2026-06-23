export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/services/database/analytics'
import { handleApiError } from '@/lib/errors'

// GET /api/analytics/export - 导出数据
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const type = (searchParams.get('type') || 'videos') as 'pages' | 'videos' | 'variants' | 'dramas'
    
    const csvData = await analyticsService.exportData({ startDate, endDate, type })
    
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=analytics_${type}_${new Date().toISOString().split('T')[0]}.csv`,
      },
    })
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}