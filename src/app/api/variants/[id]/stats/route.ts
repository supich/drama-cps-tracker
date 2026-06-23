"use server"

import { NextRequest, NextResponse } from 'next/server'
import { variantService } from '@/services/database/variants'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/variants/:id/stats - 获取变体统计数据
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    
    const stats = await variantService.getVariantStats(params.id, days)
    return NextResponse.json(successResponse(stats))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}