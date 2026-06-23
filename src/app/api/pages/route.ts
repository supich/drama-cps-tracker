export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pageService } from '@/services/database/pages'
import { createPageSchema, paginationSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/pages - 获取所有主页
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
    })
    
    const result = await pageService.getPages({
      page: params.page,
      limit: params.limit,
      status: params.status as any,
      search: params.search,
      niche: searchParams.get('niche') || undefined,
      region: searchParams.get('region') || undefined,
    })
    
    return NextResponse.json(successResponse(result))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// POST /api/pages - 创建新主页
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createPageSchema.parse(body)
    
    const page = await pageService.createPage(validatedData)
    
    return NextResponse.json(successResponse(page, 201))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}