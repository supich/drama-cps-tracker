export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { paginationSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/clicks - 获取点击日志
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })
    
    const where: any = {}
    if (searchParams.get('pageId')) where.pageId = searchParams.get('pageId')
    if (searchParams.get('videoId')) where.videoId = searchParams.get('videoId')
    if (searchParams.get('variantId')) where.variantId = searchParams.get('variantId')
    if (searchParams.get('dramaId')) where.dramaId = searchParams.get('dramaId')
    
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }
    
    const [clicks, total] = await Promise.all([
      prisma.clickLog.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          page: { select: { pageName: true } },
          video: { select: { title: true } },
          variant: { select: { variantName: true } },
        },
      }),
      prisma.clickLog.count({ where }),
    ])
    
    return NextResponse.json(successResponse({
      clicks,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit),
      },
    }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}