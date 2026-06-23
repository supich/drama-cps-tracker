export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { variantService } from '@/services/database/variants'
import { updateVariantSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/variants/:id - 获取单个变体
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const variant = await variantService.getVariantById(params.id)
    return NextResponse.json(successResponse(variant))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// PATCH /api/variants/:id - 更新变体
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateVariantSchema.parse(body)
    
    const variant = await variantService.updateVariant(params.id, validatedData)
    return NextResponse.json(successResponse(variant))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// DELETE /api/variants/:id - 删除变体
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await variantService.deleteVariant(params.id)
    return NextResponse.json(successResponse({ deleted: true }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}