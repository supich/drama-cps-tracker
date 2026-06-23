"use server"

import { NextRequest, NextResponse } from 'next/server'
import { variantService } from '@/services/database/variants'
import { createVariantSchema, paginationSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/videos/:id/variants - 获取视频的所有变体
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paginationParams = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })
    
    const result = await variantService.getVariants({
      ...paginationParams,
      videoId: params.id,
      status: searchParams.get('status') as any,
    })
    
    return NextResponse.json(successResponse(result))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// POST /api/videos/:id/variants - 为视频创建新变体
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = createVariantSchema.parse({
      ...body,
      videoId: params.id,
    })
    
    const variant = await variantService.createVariant(validatedData)
    
    return NextResponse.json(successResponse(variant, 201))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}