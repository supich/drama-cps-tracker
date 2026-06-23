"use server"

import { NextRequest, NextResponse } from 'next/server'
import { pageService } from '@/services/database/pages'
import { handleApiError, successResponse } from '@/lib/errors'

// POST /api/system/reset-daily-counts - 重置每日发布计数（每天0点执行）
export async function POST(request: NextRequest) {
  try {
    // 验证请求来源（生产环境中应该添加认证）
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.SYSTEM_API_KEY}`) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }
    
    const result = await pageService.resetDailyCounts()
    return NextResponse.json(successResponse({
      message: 'Daily counts reset successfully',
      affected: result.count,
    }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}