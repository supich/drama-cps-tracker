export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { variantService } from '@/services/database/variants'
import { createVariantSchema, paginationSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'
import { VariantStatus } from '@prisma/client'

// GET /api/variants - 获取所有变体
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
    })
    
    const result = await variantService.getVariants({
      page: params.page,
      limit: params.limit,
      search: params.search,
      status: params.status as VariantStatus | undefined,
      videoId: searchParams.get('videoId') || undefined,
    })
    
    return NextResponse.json(successResponse(result))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// POST /api/variants - 创建新变体
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createVariantSchema.parse(body)
    const variant = await variantService.createVariant(validatedData)
    return NextResponse.json(successResponse(variant, 201))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
