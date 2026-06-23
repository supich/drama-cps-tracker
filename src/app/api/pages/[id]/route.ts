export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pageService } from '@/services/database/pages'
import { updatePageSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/pages/:id - 获取单个主页
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const page = await pageService.getPageById(params.id)
    return NextResponse.json(successResponse(page))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// PATCH /api/pages/:id - 更新主页
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updatePageSchema.parse(body)
    
    const page = await pageService.updatePage(params.id, validatedData)
    return NextResponse.json(successResponse(page))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// DELETE /api/pages/:id - 删除主页
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await pageService.deletePage(params.id)
    return NextResponse.json(successResponse({ deleted: true }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}