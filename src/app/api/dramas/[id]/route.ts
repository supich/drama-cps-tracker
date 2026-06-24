export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { dramaService } from '@/services/database/dramas'
import { updateDramaSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/dramas/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const drama = await dramaService.getDramaById(params.id)
    return NextResponse.json(successResponse(drama))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// PATCH /api/dramas/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateDramaSchema.parse(body)

    const drama = await dramaService.updateDrama(params.id, validatedData)
    return NextResponse.json(successResponse(drama))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// DELETE /api/dramas/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dramaService.deleteDrama(params.id)
    return NextResponse.json(successResponse({ deleted: true }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
