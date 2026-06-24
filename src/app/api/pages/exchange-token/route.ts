export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { metaClient } from '@/services/meta/client'
import { handleApiError, successResponse } from '@/lib/errors'

const exchangeTokenSchema = z.object({
  userAccessToken: z.string().min(1, '请填写用户访问口令'),
})

// POST /api/pages/exchange-token - 将短期 User Access Token 转为长期 User Access Token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAccessToken } = exchangeTokenSchema.parse(body)
    const token = await metaClient.exchangeUserAccessToken(userAccessToken)
    const expiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null

    return NextResponse.json(successResponse({
      accessToken: token.access_token,
      tokenType: token.token_type || 'bearer',
      expiresIn: token.expires_in || null,
      expiresAt,
    }))
  } catch (error) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
