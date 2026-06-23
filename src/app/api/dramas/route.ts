"use server"

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createDramaSchema, paginationSchema } from '@/lib/validations'
import { handleApiError, successResponse } from '@/lib/errors'

// GET /api/dramas - 获取所有剧集
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
    })
    
    const where: any = {}
    if (params.search) {
      where.OR = [
        { dramaName: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ]
    }
    
    const [dramas, total] = await Promise.all([
      prisma.drama.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { videos: true },
          },
        },
      }),
      prisma.drama.count({ where }),
    ])
    
    return NextResponse.json(successResponse({
      dramas,
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

// POST /api/dramas - 创建新剧集
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createDramaSchema.parse(body)
    
    const drama = await prisma.drama.create({
      data: validatedData,
    })
    
    return NextResponse.json(successResponse(drama, 201))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}