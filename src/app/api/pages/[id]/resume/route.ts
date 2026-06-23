"use server"

import { NextRequest, NextResponse } from 'next/server'
import { pageService } from '@/services/database/pages'
import { handleApiError, successResponse } from '@/lib/errors'

// POST /api/pages/:id/resume - 恢复页面
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const page = await pageService.resumePage(params.id)
    return NextResponse.json(successResponse(page))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}