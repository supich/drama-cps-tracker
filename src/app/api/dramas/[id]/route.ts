export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { updateDramaSchema } from '@/lib/validations'
import { handleApiError, successResponse, NotFoundError } from '@/lib/errors'

// GET /api/dramas/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const drama = await prisma.drama.findUnique({
      where: { id: params.id },
      include: { _count: { select: { videos: true } } },
    })
    if (!drama) throw new NotFoundError('剧集不存在')
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

    const drama = await prisma.drama.update({
      where: { id: params.id },
      data: validatedData,
    })
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
    await prisma.drama.delete({ where: { id: params.id } })
    return NextResponse.json(successResponse({ deleted: true }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
