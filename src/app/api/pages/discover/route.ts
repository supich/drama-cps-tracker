export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserPages } from '@/services/meta'
import { MetaUserPageAccount } from '@/services/meta/types'
import { handleApiError, successResponse } from '@/lib/errors'

const discoverPagesSchema = z.object({
  userAccessToken: z.string().min(1, '请填写用户访问口令'),
})

// POST /api/pages/discover - 使用 User Access Token 获取可管理主页列表
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAccessToken } = discoverPagesSchema.parse(body)
    const pages = await getUserPages(userAccessToken)

    return NextResponse.json(successResponse({
      pages: pages.map((page: MetaUserPageAccount) => ({
        pageId: page.id,
        pageName: page.name,
        accessToken: page.access_token,
        category: page.category,
        tasks: page.tasks || [],
      })),
    }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
