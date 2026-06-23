"use server"

import { NextRequest, NextResponse } from 'next/server'
import { pageService } from '@/services/database/pages'
import { handleApiError, successResponse } from '@/lib/errors'

// POST /api/pages/:id/validate-token - 验证页面Token
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pageService.validateToken(params.id)
    return NextResponse.json(successResponse(result))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}