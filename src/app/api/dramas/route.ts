export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { dramaService } from '@/services/database/dramas'
import { createDramaSchema, paginationSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'
import { DramaStatus } from '@prisma/client'

const dramaStatuses = new Set<string>(Object.values(DramaStatus))

// GET /api/dramas - 获取所有剧集
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
    })
    const status = params.status && dramaStatuses.has(params.status)
      ? params.status as DramaStatus
      : undefined
    
    const result = await dramaService.getDramas({
      page: params.page,
      limit: params.limit,
      status,
      search: params.search,
      language: searchParams.get('language') || undefined,
    })
    
    return NextResponse.json(successResponse(result))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// POST /api/dramas - 创建新剧集
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createDramaSchema.parse(body)
    
    const drama = await dramaService.createDrama(validatedData)
    
    return NextResponse.json(successResponse(drama, 201))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
